// src/pages/AccountInfo.jsx
// import { useEffect, useState } from "react";
// import { supabase } from "../lib/supabaseClient";

// export default function AccountInfo() {
//   const [userInfo, setUserInfo] = useState({
//     first_name: "",
//     last_name: "",
//     email: "",
//     phone: "",
//     street: "",
//     city: "",
//     state: "",
//     postal_code: "",
//     latitude: null,
//     longitude: null,
//   });
//   const [posts, setPosts] = useState([]);
//   const [isEditing, setIsEditing] = useState(false);
//   const [editForm, setEditForm] = useState({});

//   const userEmail = sessionStorage.getItem("userEmail");

//   useEffect(() => {
//     if (!userEmail) return;
//     fetchUserInfo();
//     fetchUserPosts();
//   }, [userEmail]);

//   const fetchUserInfo = async () => {
//     const { data, error } = await supabase
//       .from("users")
//       .select("*")
//       .eq("email", userEmail)
//       .single();

//     if (error) {
//       console.error(error);
//       return;
//     }

//     const info = {
//       first_name: data.first_name || "",
//       last_name: data.last_name || "",
//       email: data.email || "",
//       phone: data.phone || "",
//       street: data.street || "",
//       city: data.city || "",
//       state: data.state || "",
//       postal_code: data.postal_code || "",
//       latitude: data.latitude || null,
//       longitude: data.longitude || null,
//     };

//     setUserInfo(info);
//     setEditForm(info);
//   };

//   const fetchUserPosts = async () => {
//     if (!userEmail) return;

//     const { data, error } = await supabase
//       .from("posts")
//       .select("*")
//       .eq("user_email", userEmail)
//       .order("created_at", { ascending: false });

//     if (error) console.error(error);
//     else setPosts(data || []);
//   };

//   const handleEdit = () => setIsEditing(true);
//   const handleCancel = () => {
//     setIsEditing(false);
//     setEditForm(userInfo);
//   };

//   const handleSave = async () => {
//     // 住所をまとめてフル住所
//     const fullAddress = `${editForm.street}, ${editForm.city}, ${editForm.state} ${editForm.postal_code}`;

//     // 緯度経度を取得
//     let lat = null;
//     let lng = null;
//     try {
//       const res = await fetch(
//         `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
//       );
//       const data = await res.json();

//       if (data.length === 0) throw new Error("Invalid address");
//       //lat = parseFloat(data[0].lat);
//       //lng = parseFloat(data[0].lng);
//       lat = data.results[0].geometry.location.lat;
//       lng = data.results[0].geometry.location.lng;
//     } catch (err) {
//       alert("Could not get valid latitude/longitude. Please check your address.");
//       return;
//     }

//     const { error } = await supabase
//       .from("users")
//       .update({
//         first_name: editForm.first_name,
//         last_name: editForm.last_name,
//         phone: editForm.phone,
//         street: editForm.street,
//         city: editForm.city,
//         state: editForm.state,
//         postal_code: editForm.postal_code,
//         latitude: lat,
//         longitude: lng,
//       })
//       .eq("email", userEmail);

//     if (error) {
//       console.error(error);
//       alert("Error updating profile");
//     } else {
//       setUserInfo({ ...editForm, latitude: lat, longitude: lng, address: fullAddress });
//       setIsEditing(false);
//       alert("Profile updated successfully!");
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
//       <div className="max-w-4xl mx-auto">
//         <h1 className="text-4xl font-bold mb-8 text-gray-800 text-center">
//           My Account
//         </h1>

//         <div className="bg-white shadow-2xl rounded-2xl p-8 mb-8">
//           <div className="flex justify-between items-center mb-6">
//             <h2 className="text-3xl font-bold text-gray-800">Profile Information</h2>
//             {!isEditing ? (
//               <button
//                 onClick={handleEdit}
//                 className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
//               >
//                 Edit Profile
//               </button>
//             ) : (
//               <div className="flex gap-3">
//                 <button
//                   onClick={handleSave}
//                   className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition"
//                 >
//                   Save
//                 </button>
//                 <button
//                   onClick={handleCancel}
//                   className="bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-600 transition"
//                 >
//                   Cancel
//                 </button>
//               </div>
//             )}
//           </div>

//           <div className="space-y-6">
//             {[
//               { label: "Fisrt Name", key: "first_name", type: "text" },
//               { label: "Last Name", key: "last_name", type: "text" },
//               { label: "Phone Number", key: "phone", type: "tel" },
//               { label: "Street", key: "street", type: "text" },
//               { label: "City", key: "city", type: "text" },
//               { label: "State", key: "state", type: "text" },
//               { label: "Postal Code", key: "postal_code", type: "text" },
//             ].map(({ label, key, type }) => (
//               <div key={key}>
//                 <label className="block text-sm font-semibold text-gray-700 mb-2">
//                   {label}
//                 </label>
//                 {isEditing ? (
//                   <input
//                     type={type}
//                     value={editForm[key]}
//                     onChange={(e) =>
//                       setEditForm({ ...editForm, [key]: e.target.value })
//                     }
//                     className="border-2 border-gray-300 rounded-lg p-3 w-full text-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none"
//                   />
//                 ) : (
//                   <div className="bg-gray-50 rounded-lg p-4 text-lg text-gray-800">
//                     {userInfo[key] || "Not set"}
//                   </div>
//                 )}
//               </div>
//             ))}

//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-2">
//                 Email
//               </label>
//               <div className="bg-gray-100 rounded-lg p-4 text-lg text-gray-600">
//                 {userInfo.email}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Posts 部分は元のコードのまま */}
//       </div>
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AccountInfo() {
  const [userInfo, setUserInfo] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    postal_code: "",
    latitude: null,
    longitude: null,
  });
  const [posts, setPosts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const userEmail = sessionStorage.getItem("userEmail");

  useEffect(() => {
    if (!userEmail) return;
    fetchUserInfo();
    fetchUserPosts();
  }, [userEmail]);

  // --- ユーザー情報取得 ---
  const fetchUserInfo = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", userEmail)
      .single();

    if (error) {
      console.error(error);
      return;
    }

    const info = {
      first_name: data.first_name || "",
      last_name: data.last_name || "",
      email: data.email || "",
      phone: data.phone || "",
      street: data.street || "",
      city: data.city || "",
      state: data.state || "",
      postal_code: data.postal_code || "",
      latitude: data.latitude || null,
      longitude: data.longitude || null,
    };

    setUserInfo(info);
    setEditForm(info);
  };

  // --- 自分の投稿取得 ---
  const fetchUserPosts = async () => {
    if (!userEmail) return;

    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("user_email", userEmail)
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    else setPosts(data || []);
  };

  // --- 投稿削除 ---
  const handleDeletePost = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this post?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) {
      alert("Error deleting post.");
      console.error(error);
    } else {
      alert("Post deleted successfully!");
      // 投稿リストを再取得
      fetchUserPosts();
    }
  };

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    setIsEditing(false);
    setEditForm(userInfo);
  };

  const handleSave = async () => {
    const fullAddress = `${editForm.street}, ${editForm.city}, ${editForm.state} ${editForm.postal_code}`;
    let lat = null;
    let lng = null;

    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          fullAddress
        )}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
      );
      const data = await res.json();
      if (!data.results?.length) throw new Error("Invalid address");
      lat = data.results[0].geometry.location.lat;
      lng = data.results[0].geometry.location.lng;
    } catch (err) {
      alert("Could not get valid latitude/longitude. Please check your address.");
      return;
    }

    const { error } = await supabase
      .from("users")
      .update({
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        phone: editForm.phone,
        street: editForm.street,
        city: editForm.city,
        state: editForm.state,
        postal_code: editForm.postal_code,
        latitude: lat,
        longitude: lng,
      })
      .eq("email", userEmail);

    if (error) {
      console.error(error);
      alert("Error updating profile");
    } else {
      setUserInfo({ ...editForm, latitude: lat, longitude: lng, address: fullAddress });
      setIsEditing(false);
      alert("Profile updated successfully!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-800 text-center">
          My Account
        </h1>

        {/* --- Profile Section --- */}
        <div className="bg-white shadow-2xl rounded-2xl p-8 mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800">Profile Information</h2>
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {[
              { label: "First Name", key: "first_name", type: "text" },
              { label: "Last Name", key: "last_name", type: "text" },
              { label: "Phone Number", key: "phone", type: "tel" },
              { label: "Street", key: "street", type: "text" },
              { label: "City", key: "city", type: "text" },
              { label: "State", key: "state", type: "text" },
              { label: "Postal Code", key: "postal_code", type: "text" },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {label}
                </label>
                {isEditing ? (
                  <input
                    type={type}
                    value={editForm[key]}
                    onChange={(e) =>
                      setEditForm({ ...editForm, [key]: e.target.value })
                    }
                    className="border-2 border-gray-300 rounded-lg p-3 w-full text-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none"
                  />
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 text-lg text-gray-800">
                    {userInfo[key] || "Not set"}
                  </div>
                )}
              </div>
            ))}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <div className="bg-gray-100 rounded-lg p-4 text-lg text-gray-600">
                {userInfo.email}
              </div>
            </div>
          </div>
        </div>

        {/* --- User's Posts Section --- */}
        <div className="bg-white shadow-xl rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">My Posts</h2>
          {posts.length === 0 ? (
            <p className="text-gray-600">You haven't created any posts yet.</p>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">{post.title}</h3>
                      <p className="text-gray-600 mb-2">{post.category}</p>
                      <p className="text-gray-700 mb-4">{post.description}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
                        <p><span className="font-semibold">Address:</span> {post.address}</p>
                        <p><span className="font-semibold">Contact:</span> {post.contact}</p>
                        <p><span className="font-semibold">Status:</span> {post.status}</p>
                        <p><span className="font-semibold">People Needed:</span> {post.people_needed}</p>
                        <p><span className="font-semibold">People Accepted:</span> {post.people_accepted}</p>
                        <p><span className="font-semibold">Created:</span> {new Date(post.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-red-700 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
