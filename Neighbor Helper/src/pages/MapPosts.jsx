import { useEffect, useRef, useState, useCallback } from "react";

const MAPBOX_ACCESS_TOKEN =
  "pk.eyJ1IjoieXVtYWZ1a2F6YXdhIiwiYSI6ImNtZ2Q0ZzJnNTB4NXgybW9xMWFyMjZlMnAifQ.oETNDJXzaWZIWietg-4IZA";

const showCustomAlert = (message, type = "info") => {
  console.log(`[App Alert - ${type.toUpperCase()}]: ${message}`);
  const alertContainer = document.getElementById("alert-container");
  if (alertContainer) {
    alertContainer.innerHTML = `
      <div class="fixed top-0 left-1/2 -translate-x-1/2 mt-4 p-3 rounded-lg shadow-xl text-white ${type === "error" ? "bg-red-500" : "bg-blue-500"
      } z-[1000]">
        ${message}
      </div>
    `;
    setTimeout(() => (alertContainer.innerHTML = ""), 3000);
  }
};

export default function MapPosts({ supabase, refreshTrigger }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);
  const [posts, setPosts] = useState([]);
  
  // Mapbox initialization state
  const [mapLibReady, setMapLibReady] = useState(false); 
  
  const DEFAULT_LOCATION = { latitude: 32.7357, longitude: -97.1081 };
  const [location, setLocation] = useState(null); // Initialize as null to trigger fetch
  const [radiusMiles, setRadiusMiles] = useState(8);

  const getCategoryColor = useCallback((category) => {
    const colors = {
      "Daily Support": "#FF6B6B",
      "Transportation/Errand": "#4ECDC4",
      Repair: "#FFE66D",
      Education: "#A8E6CF",
      Events: "#95E1D3",
      "Disaster/Emergency Help": "#FF8B94",
      "Emotional Support": "#8BC34A",
      "Environment Actions": "#6C5CE7",
      Other: "#95A5A6",
    };
    return colors[category] || "#95A5A6";
  }, []);


  // --- 1. Mapbox Library Ready Check (Essential for Map rendering) ---
  useEffect(() => {
    // Check if mapboxgl is globally available
    if (window.mapboxgl && !mapLibReady) {
      const mapboxgl = window.mapboxgl;
      mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
      setMapLibReady(true);
    } else if (!window.mapboxgl) {
      // Fallback/Error message if not loaded, but doesn't halt execution
      console.warn(
        "Mapbox GL JS is not loaded. Ensure the script/link tags are in index.html."
      );
    }
  }, [mapLibReady]);


  // --- 2. User Location Fetch (Determines Map Center) ---
  useEffect(() => {
    if (location) return; // Only run once on mount

    const fetchInitialLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (error) => {
          console.error("Geolocation failed, using default location.", error);
          setLocation(DEFAULT_LOCATION); // Use default location on error
        }
      );
    };
    fetchInitialLocation();
  }, []);


  // --- 3. Data Fetch (Runs when Location/Radius changes) ---
  useEffect(() => {
    if (!location) return;

    const fetchNearbyPosts = async () => {
      const radiusKilometers = radiusMiles * 1.60934;
      const latDelta = radiusKilometers / 111;
      const lonDelta =
        radiusKilometers /
        (111 * Math.cos((location.latitude * Math.PI) / 180));

      const minLat = location.latitude - latDelta;
      const maxLat = location.latitude + latDelta;
      const minLon = location.longitude - lonDelta;
      const maxLon = location.longitude + lonDelta;
      
      try {
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .eq("status", "open")
          .gte("latitude", minLat)
          .lte("latitude", maxLat)
          .gte("longitude", minLon)
          .lte("longitude", maxLon);
        if (error) throw error;
        setPosts(data || []);
      } catch (error) {
        console.error("Error loading posts:", error);
        showCustomAlert("Failed to load nearby posts.", "error");
      }
    };

    fetchNearbyPosts();
  }, [location, radiusMiles, supabase, refreshTrigger]);


  // --- 4. Map Initialization (Runs once when location is set and lib is ready) ---
  useEffect(() => {
    // Check if Mapbox is loaded before trying to use mapboxgl
    if (!location || !mapLibReady || map.current) return;
    
    // Use the global window.mapboxgl instance
    const mapboxgl = window.mapboxgl; 
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [location.longitude, location.latitude],
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    new mapboxgl.Marker({ color: "#2563EB" })
      .setLngLat([location.longitude, location.latitude])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML("Search Center"))
      .addTo(map.current);
  }, [location, mapLibReady]);


  // --- 5. Marker Drawing (Runs when Posts change) ---
  useEffect(() => {
    if (!map.current) return;

    const mapboxgl = window.mapboxgl; // Ensure access within this effect

    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    posts.forEach((post) => {
      if (!post.latitude || !post.longitude) return;

      // FIX: Use a simple anchor link for navigation to avoid using React hooks inside dynamic HTML
      const popupContent = `
        <div class="p-2 font-sans text-gray-800">
          <h3 class="text-lg font-bold text-blue-700 mb-1">${post.title}</h3>
          <p class="text-sm">${post.description}</p>
          <hr class="my-1 border-gray-200">
          <p class="text-xs"><strong>Category:</strong> ${post.category}</p>
          <p class="text-xs"><strong>People Needed:</strong> ${post.people_needed}</p>
          <a 
            href="/postdetail/${post.id}"
            class="mt-2 w-full block text-center text-sm text-white bg-green-500 hover:bg-green-600 transition py-1 rounded-md"
          >
            View Details
          </a>
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 25, focusAfterOpen: false }).setHTML(popupContent);


      const marker = new mapboxgl.Marker({
        color: getCategoryColor(post.category),
      })
        .setLngLat([post.longitude, post.latitude])
        .setPopup(popup)
        .addTo(map.current);

      markers.current.push(marker);
    });
  }, [posts, getCategoryColor]);

  return (
    <div className="relative w-full h-screen">
      <div id="alert-container"></div>

      <div
        id="map-container"
        ref={mapContainer}
        tabIndex={-1}
        className="w-full h-full min-h-screen"
      />

      <div className="fixed top-6 left-24 z-40 bg-white p-4 rounded-xl shadow-2xl border border-gray-100 transition duration-300 transform hover:scale-[1.02] max-w-xs w-[250px]">
        <h3 className="text-xl font-bold text-gray-800 mb-3">Posts Nearby</h3>
        <label className="block text-sm font-medium text-gray-600 mb-1">
          Search Radius:
          <span className="text-blue-600 font-semibold ml-1">
            {radiusMiles} Miles
          </span>
        </label>
        <input
          type="range"
          min="1"
          max={40}
          step="1"
          value={radiusMiles}
          onChange={(e) => setRadiusMiles(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{
            backgroundImage: `linear-gradient(to right, #2563BB 0%, #3B8276 ${((radiusMiles - 1) / 39) * 100
              }%, #E5E7EB ${((radiusMiles - 1) / 39) * 100}%, #E5E7EB 100%)`,
          }}
        />
        <p className="mt-3 text-sm text-gray-500">
          Found <span className="font-bold text-green-600">{posts.length}</span>{" "}
          active help requests in range.
        </p>
      </div>
    </div>
  );
}
