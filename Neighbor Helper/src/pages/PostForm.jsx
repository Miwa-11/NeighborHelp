

// src/pages/PostForm.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OpenAI from "openai";

/** ──────────────────────────────────────────────────────────────────────────
 * OpenAI + categorization setup
 * ─────────────────────────────────────────────────────────────────────────── */
const OPENAI_MODEL = "gpt-4o-mini"; // fast/cheap; switch to a server endpoint before prod

const CATEGORIES = [
  "Daily Support",
  "Transportation/Errand",
  "Repair",
  "Education",
  "Events",
  "Disaster/Emergency Help",
  "Emotional Support",
  "Environment Actions",
];

// normalize arbitrary LLM text to one of our canonical labels
const CANONICAL = (() => {
  const norm = (s) => s.toLowerCase().replace(/[^a-z]/g, "");
  const map = {
    dailysupport: "Daily Support",
    transportationerrand: "Transportation/Errand",
    repair: "Repair",
    education: "Education",
    events: "Events",
    disasteremergencyhelp: "Disaster/Emergency Help",
    emotionalsupport: "Emotional Support",
    environmentactions: "Environment Actions",
    // common near-misses
    transportation: "Transportation/Errand",
    errand: "Transportation/Errand",
    environmentalactions: "Environment Actions",
    environmentaction: "Environment Actions",
    emergencysupport: "Disaster/Emergency Help",
  };
  return { norm, map };
})();

const coerceCategory = (raw) => {
  if (!raw) return null;
  const { norm, map } = CANONICAL;
  const key = norm(String(raw));
  if (map[key]) return map[key];
  for (const k of Object.keys(map)) {
    if (key.includes(k)) return map[k];
  }
  return null;
};

// keyword fallback (runs if API fails or returns junk)
const categorizePostFallback = (title, description) => {
  const text = `${title} ${description}`.toLowerCase();
  const has = (...ws) => ws.some((w) => text.includes(w));
  if (has("ride", "drive", "pickup", "delivery", "transport", "car", "bus", "taxi", "travel")) return "Transportation/Errand";
  if (has("fix", "repair", "broken", "maintenance", "plumbing", "electric", "mechanic", "construction", "assemble")) return "Repair";
  if (has("teach", "tutor", "learn", "study", "homework", "school", "class", "course")) return "Education";
  if (has("event", "party", "gathering", "celebration", "meeting", "wedding", "workshop", "seminar", "conference", "festival")) return "Events";
  if (has("emergency", "urgent", "disaster", "flood", "fire", "storm", "earthquake")) return "Disaster/Emergency Help";
  if (has("talk", "listen", "support", "counsel", "lonely", "mental")) return "Emotional Support";
  if (has("clean", "cleanup", "recycle", "garden", "plant", "environment")) return "Environment Actions";
  return "Daily Support";
};

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // dev only; move server-side before prod
});

// strict JSON schema response to avoid free-form text
async function categorizeWithAI(title, description) {
  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "category_schema",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["category"],
            properties: {
              category: { type: "string", enum: CATEGORIES },
            },
          },
        },
      },
      messages: [
        {
          role: "system",
          content: "Classify the post into exactly one category. Return strict JSON only.",
        },
        {
          role: "user",
          content: JSON.stringify({ categories: CATEGORIES, title, description }),
        },
      ],
    });

    const raw = response?.choices?.[0]?.message?.content;
    if (!raw) throw new Error("Empty OpenAI response");

    const parsed = JSON.parse(raw);
    const coerced = coerceCategory(parsed?.category);
    if (coerced) return coerced;

    const fallbackCoerced = coerceCategory(String(parsed?.category || raw));
    if (fallbackCoerced) return fallbackCoerced;

    return categorizePostFallback(title, description);
  } catch (err) {
    console.error("AI categorization error:", err);
    return categorizePostFallback(title, description);
  }
}

/** ──────────────────────────────────────────────────────────────────────────
 * Helpers for near-duplicate detection
 * ─────────────────────────────────────────────────────────────────────────── */
const bboxFromCenter = (lat, lon, radiusM) => {
  const dLat = radiusM / 111320;
  const dLon = radiusM / (111320 * Math.cos((lat * Math.PI) / 180));
  return { minLat: lat - dLat, maxLat: lat + dLat, minLon: lon - dLon, maxLon: lon + dLon };
};

const distanceM = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

/** ──────────────────────────────────────────────────────────────────────────
 * Component
 * ─────────────────────────────────────────────────────────────────────────── */
export default function PostForm({ supabase, onPostCreated }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    contact: "",
    people_needed: "",
  });

  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [aiCategory, setAiCategory] = useState("");
  const [categorizingAI, setCategorizingAI] = useState(false);

  // duplicate modal state
  const [dupeOpen, setDupeOpen] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [pendingPayload, setPendingPayload] = useState(null);

  useEffect(() => {
    const userEmail = sessionStorage.getItem("userEmail");
    if (!userEmail) {
      alert("You must be logged in to create a post.");
      navigate("/");
    }
  }, [navigate]);

  // auto-categorize after pause (2s)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (form.title && form.description) {
        setCategorizingAI(true);
        const category = await categorizeWithAI(form.title, form.description);
        setAiCategory(category);
        setCategorizingAI(false);
      } else {
        setAiCategory("");
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [form.title, form.description]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const useMyLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation is not supported by your browser.");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ latitude, longitude });
        setForm((f) => ({
          ...f,
          street: "", city: "", state: "", zipcode: "", country: "",
        }));
      },
      (err) => { console.error(err); alert("Unable to retrieve your location"); }
    );
  };

  const resolveCoordinates = async () => {
    let latitude, longitude, address;
    if (location) {
      latitude = Number(location.latitude);
      longitude = Number(location.longitude);
      address = "Location shared (coordinates)";
    } else if (form.street && form.city && form.state && form.zipcode && form.country) {
      const fullAddress = `${form.street}, ${form.city}, ${form.state} ${form.zipcode}, ${form.country}`;
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullAddress)}.json?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`
      );
      const geo = await res.json();
      if (!geo.features?.length) throw new Error("Address not found.");
      const [lng, lat] = geo.features[0].center;
      latitude = Number(lat);
      longitude = Number(lng);
      address = fullAddress;
    } else {
      throw new Error("Provide a full address or use your current location.");
    }
    return { latitude, longitude, address };
  };

  const checkDuplicates = async ({ latitude, longitude }) => {
    const radiusM = 1000;
    const { minLat, maxLat, minLon, maxLon } = bboxFromCenter(latitude, longitude, radiusM);
    const { data, error } = await supabase
      .from("posts")
      .select("id,title,description,latitude,longitude,created_at")
      .gte("latitude", minLat).lte("latitude", maxLat)
      .gte("longitude", minLon).lte("longitude", maxLon)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw error;

    const closeBy = (data || [])
      .map((p) => ({
        ...p,
        distance_m: distanceM(latitude, longitude, Number(p.latitude), Number(p.longitude)),
      }))
      .filter((p) => p.distance_m <= radiusM);

    const key = (form.title + " " + form.description).toLowerCase();
    const keywords = key.split(/\W+/).filter(Boolean).slice(0, 6);
    const withText = closeBy.filter(p =>
      keywords.length === 0 || keywords.some(k => (p.title + " " + p.description).toLowerCase().includes(k))
    );

    return withText.slice(0, 5);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const userEmail = sessionStorage.getItem("userEmail");
      if (!userEmail) throw new Error("You must be logged in to create a post.");

      const { latitude, longitude, address } = await resolveCoordinates();
      const dupes = await checkDuplicates({ latitude, longitude });

      // final category using AI (with robust fallback internally)
      const finalCategory = await categorizeWithAI(form.title, form.description);

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        address,
        latitude,
        longitude,
        contact: form.contact.trim(),
        people_needed: Number(form.people_needed),
        status: "open",
        category: finalCategory,
        user_email: userEmail,
      };

      if (dupes.length > 0) {
        setCandidates(dupes);
        setPendingPayload(payload);
        setDupeOpen(true);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.from("posts").insert([payload]).select().single();
      if (error) throw error;

      onPostCreated?.(data);
      resetForm();
      navigate(`/postdetail/${data.id}`);
    } catch (err) {
      console.error("Error creating post:", err);
      alert(err.message || "Failed to create post.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      street: "",
      city: "",
      state: "",
      zipcode: "",
      country: "",
      contact: "",
      people_needed: "",
    });
    setLocation(null);
    setAiCategory("");
  };

  const createAnyway = async () => {
    if (!pendingPayload) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from("posts").insert([pendingPayload]).select().single();
      if (error) throw error;

      onPostCreated?.(data);
      resetForm();
      setDupeOpen(false);
      navigate(`/postdetail/${data.id}`);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to create post.");
    } finally {
      setLoading(false);
    }
  };

  const cancelCreate = () => {
    setDupeOpen(false);
    setPendingPayload(null);
  };

  const getCategoryColor = (category) => {
    const colors = {
      "Daily Support": "#FF6B6B",
      "Transportation/Errand": "#4ECDC4",
      "Repair": "#FFE66D",
      "Education": "#A8E6CF",
      "Events": "#95E1D3",
      "Disaster/Emergency Help": "#FF8B94",
      "Emotional Support": "#8BC34A",
      "Environment Actions": "#6C5CE7",
    };
    return colors[category] || "#95A5A6";
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-5 w-full max-w-lg mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Create a Help Post</h2>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            placeholder="Need help moving furniture"
            className="border-2 border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-green-400 focus:border-green-400 focus:outline-none"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            placeholder="Describe the help needed..."
            rows="4"
            className="border-2 border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-green-400 focus:border-green-400 focus:outline-none"
          />
        </div>

        {(aiCategory || categorizingAI) && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 border-2 border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
              </svg>
              <span className="text-sm font-medium text-gray-700">
                {categorizingAI ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></span>
                    AI is analyzing your post...
                  </span>
                ) : (
                  <>
                    AI Suggested Category:
                    <span
                      className="ml-2 px-3 py-1 text-white rounded-full text-sm font-semibold"
                      style={{ backgroundColor: getCategoryColor(aiCategory) }}
                    >
                      {aiCategory}
                    </span>
                  </>
                )}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Category is automatically determined by AI based on your description
            </p>
          </div>
        )}

        {!location && (
          <>
            <div className="mb-2">
              <label className="block font-semibold">Street</label>
              <input name="street" value={form.street} onChange={handleChange} className="border p-2 rounded w-full" />
            </div>
            <div className="mb-2 grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold">City</label>
                <input name="city" value={form.city} onChange={handleChange} className="border p-2 rounded w-full" />
              </div>
              <div>
                <label className="block font-semibold">State</label>
                <input name="state" value={form.state} onChange={handleChange} className="border p-2 rounded w-full" />
              </div>
            </div>
            <div className="mb-2 grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold">Zipcode</label>
                <input name="zipcode" value={form.zipcode} onChange={handleChange} className="border p-2 rounded w-full" />
              </div>
              <div>
                <label className="block font-semibold">Country</label>
                <input name="country" value={form.country} onChange={handleChange} className="border p-2 rounded w-full" />
              </div>
            </div>
          </>
        )}

        <div className="mb-4">
          <button type="button" onClick={useMyLocation} className="mt-2 w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600">
            Use My Current Location
          </button>
          {location && (
            <p className="text-green-600 text-sm mt-1">
              Using Latitude: {location.latitude.toFixed(5)} | Longitude: {location.longitude.toFixed(5)}
            </p>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">People Needed</label>
          <input
            type="number"
            name="people_needed"
            min="0"
            value={form.people_needed}
            onChange={(e) => setForm((f) => ({ ...f, people_needed: Math.max(1, parseInt(e.target.value || "1", 10)) }))}
            required
            className="border-2 border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-green-400 focus:border-green-400 focus:outline-none"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Contact (Phone)</label>
          <input
            type="tel"
            name="contact"
            value={form.contact}
            onChange={handleChange}
            required
            pattern="[0-9]{10}"
            title="Enter 10-digit phone number"
            className="border-2 border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-green-400 focus:border-green-400 focus:outline-none"
          />
        </div>

        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
          {loading ? "Submitting..." : "Submit Post"}
        </button>
      </form>

      {/* Duplicate Modal */}
      {dupeOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
            <h3 className="text-lg font-semibold">Similar posts nearby</h3>
            <p className="text-sm text-gray-600 mb-4">
              We found posts within ~1km that might be similar. Review them below or continue to create your post.
            </p>

            <ul className="max-h-64 overflow-auto divide-y">
              {candidates.map((c) => (
                <li key={c.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-gray-900">{c.title}</div>
                      <div className="text-gray-600 text-sm line-clamp-2">{c.description}</div>
                      <div className="text-gray-500 text-xs mt-1">
                        ~{Math.round(c.distance_m)} m away • {new Date(c.created_at).toLocaleString()}
                      </div>
                    </div>
                    <button
                      className="shrink-0 px-3 py-1.5 rounded bg-gray-200 hover:bg-gray-300"
                      onClick={() => navigate(`/postdetail/${c.id}`)}
                    >
                      View
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button onClick={cancelCreate} className="px-4 py-2 rounded border border-gray-300">
                Cancel
              </button>
              <button onClick={createAnyway} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
                Create anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
