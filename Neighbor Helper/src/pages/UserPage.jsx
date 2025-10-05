// // src/pages/UserPage.jsx
// import { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import { supabase } from "../lib/supabaseClient";

// export default function UserPage() {
//   const { email = "" } = useParams();
//   const decodedEmail = decodeURIComponent(email);

//   const [profile, setProfile] = useState(null); // from public.users
//   const [posts, setPosts] = useState([]);       // from public.posts
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     (async () => {
//       setLoading(true);

//       // 1) Load profile by email (only public/safe columns)
//       const { data: prof, error: pErr } = await supabase
//         .from("users")
//         .select("email, first_name, last_name, phone, city, state, street, postal_code")
//         .eq("email", decodedEmail)
//         .maybeSingle();

//       if (pErr) console.error(pErr);
//       setProfile(prof ?? null);

//       // 2) Load posts by user_email
//       const { data: rows, error: rErr } = await supabase
//         .from("posts")
//         .select("id, title, description, address, status, category, created_at")
//         .eq("user_email", decodedEmail)
//         .order("created_at", { ascending: false });

//       if (rErr) console.error(rErr);
//       setPosts(rows ?? []);

//       setLoading(false);
//     })();
//   }, [decodedEmail]);

//   if (loading) return <div className="p-6">Loading…</div>;
//   if (!profile)
//     return (
//       <div className="p-6">
//         No public profile found for <span className="font-mono">{decodedEmail}</span>.
//       </div>
//     );

//   const name =
//     [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
//     decodedEmail;

//   return (
//     <div className="max-w-4xl mx-auto p-6">
//       {/* Profile header */}
//       <div className="bg-white rounded-xl shadow p-6 mb-6">
//         <h1 className="text-2xl font-bold">{name}</h1>
//         <div className="text-gray-600">{decodedEmail}</div>
//         {(profile.city || profile.state) && (
//           <div className="text-gray-600 text-sm">
//             {[profile.city, profile.state].filter(Boolean).join(", ")}
//           </div>
//         )}
//       </div>

//       {/* Posts list */}
//       <div className="bg-white rounded-xl shadow p-6">
//         <h2 className="text-xl font-semibold mb-4">Posts</h2>
//         {posts.length === 0 ? (
//           <div className="text-gray-600">No posts yet.</div>
//         ) : (
//           <div className="space-y-4">
//             {posts.map((p) => (
//               <div key={p.id} className="border rounded-lg p-4">
//                 <div className="flex justify-between items-start">
//                   <div className="font-semibold">{p.title}</div>
//                   <span
//                     className={`text-xs px-2 py-1 rounded ${
//                       p.status === "open"
//                         ? "bg-green-100 text-green-700"
//                         : "bg-gray-100 text-gray-700"
//                     }`}
//                   >
//                     {p.status}
//                   </span>
//                 </div>
//                 <p className="text-gray-800 mt-1">{p.description}</p>
//                 <div className="text-sm text-gray-600 mt-2">
//                   {p.address} • {new Date(p.created_at).toLocaleString()}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }


// src/pages/UserPage.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function UserPage() {
  const { email = "" } = useParams();
  const decodedEmail = decodeURIComponent(email);

  const [profile, setProfile] = useState(null); // from public.users
  const [posts, setPosts] = useState([]);       // from public.posts
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);

      // 1) Load profile by email (only public/safe columns)
      const { data: prof, error: pErr } = await supabase
        .from("users")
        .select("email, first_name, last_name, phone, city, state, street, postal_code")
        .eq("email", decodedEmail)
        .maybeSingle();

      if (pErr) console.error(pErr);
      setProfile(prof ?? null);

      // 2) Load posts by user_email
      const { data: rows, error: rErr } = await supabase
        .from("posts")
        .select("id, title, description, address, status, category, created_at")
        .eq("user_email", decodedEmail)
        .order("created_at", { ascending: false });

      if (rErr) console.error(rErr);
      setPosts(rows ?? []);

      setLoading(false);
    })();
  }, [decodedEmail]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!profile)
    return (
      <div className="p-6">
        No public profile found for <span className="font-mono">{decodedEmail}</span>.
      </div>
    );

  const name =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    decodedEmail;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Profile header */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h1 className="text-2xl font-bold">{name}</h1>
        <div className="text-gray-600">{decodedEmail}</div>
        {(profile.city || profile.state) && (
          <div className="text-gray-600 text-sm">
            {[profile.city, profile.state].filter(Boolean).join(", ")}
          </div>
        )}
      </div>

      {/* Posts list */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Posts</h2>
        {posts.length === 0 ? (
          <div className="text-gray-600">No posts yet.</div>
        ) : (
          <div className="space-y-4">
            {posts.map((p) => (
              <div key={p.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <Link
                    to={`/post/${p.id}`}
                    className="font-semibold text-blue-700 hover:underline"
                  >
                    {p.title}
                  </Link>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      p.status === "open"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
                <p className="text-gray-800 mt-1">{p.description}</p>
                <div className="text-sm text-gray-600 mt-2">
                  {p.address} • {new Date(p.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

