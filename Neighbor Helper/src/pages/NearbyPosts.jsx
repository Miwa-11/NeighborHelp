import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";


const toRad = (value) => (value * Math.PI) / 180;
const calculateDistanceMiles = (lat1, lon1, lat2, lon2) => {
  const R = 3958.8; // Radius of Earth in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const REMOVAL_FLAG_STATUS = "closed_pending_removal";

export default function NearbyPosts({ supabase }) {
  const [posts, setPosts] = useState([]);
  const [location, setLocation] = useState(null);
  const [radiusMiles, setRadiusMiles] = useState(8);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const navigate = useNavigate();

  const getCategoryColor = useCallback((category) => {
    const colors = {
      "Daily Support": "bg-rose-100 text-rose-700 border-rose-200",
      "Transportation/Errand": "bg-cyan-100 text-cyan-700 border-cyan-200",
      Repair: "bg-yellow-100 text-yellow-700 border-yellow-200",
      Education: "bg-emerald-100 text-emerald-700 border-emerald-200",
      Events: "bg-purple-100 text-purple-700 border-purple-200",
      "Disaster/Emergency Help": "bg-red-100 text-red-700 border-red-200",
      "Emotional Support": "bg-green-100 text-green-700 border-green-200",
      "Environment Actions": "bg-indigo-100 text-indigo-700 border-indigo-200",
      Other: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return colors[category] || "bg-gray-100 text-gray-700 border-gray-200";
  }, []);

  const getCategoryIcon = (category) => {
    const icons = {
      "Daily Support": "🧺",
      "Transportation/Errand": "🚗",
      Repair: "🔧",
      Education: "📚",
      Events: "🎉",
      "Disaster/Emergency Help": "🚨",
      "Emotional Support": "💬",
      "Environment Actions": "🌱",
      Other: "🤝",
    };
    return icons[category] || "📌";
  };

  
  // useEffect(() => {
  //   const fetchUserAndLocation = async () => {
  //     const {
  //       data: { user },
  //     } = await supabase.auth.getUser();
  //     setCurrentUserId(user?.id); 
  //     navigator.geolocation.getCurrentPosition(
  //       (pos) => {
  //         setLocation({
  //           latitude: pos.coords.latitude,
  //           longitude: pos.coords.longitude,
  //         });
  //         setLoading(false);
  //       },
  //       () => {
  //         setLocation({ latitude: 32.7357, longitude: -97.1081 });
  //         setLoading(false);
  //       }
  //     );
  //   };
  //   fetchUserAndLocation();
  // }, [supabase]);

  useEffect(() => {
  const fetchUserAndLocation = async () => {
    // Supabase Authを使わず、sessionStorageから取得
    const userEmail = sessionStorage.getItem("userEmail");

    if (!userEmail) {
      console.error("No userEmail found in sessionStorage.");
      setLoading(false);
      return;
    }

    // emailからユーザーIDを取得（usersテーブルから）
    const { data, error } = await supabase
      .from("users")
      .select("email")
      .eq("email", userEmail)
      .single();

    if (error) {
      console.error("Failed to fetch user by email:", error);
      setLoading(false);
      return;
    }

    setCurrentUserId(data.email);

    // --- 現在地取得 ---
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setLoading(false);
      },
      () => {
        // 拒否された場合はUTAの位置をデフォルトに
        setLocation({ latitude: 32.7357, longitude: -97.1081 });
        setLoading(false);
      }
    );
  };

  fetchUserAndLocation();
}, []);


  useEffect(() => {
    if (!location || loading) return;

    const fetchAndFilterPosts = async () => {
      setPostsLoading(true);

      const { data: allPosts, error } = await supabase
        .from("posts")
        .select("*")
        .neq("status", REMOVAL_FLAG_STATUS); // Ignore posts flagged for removal

      if (error) {
        console.error("Error fetching posts:", error);
        setPostsLoading(false);
        return;
      }

      const nearby = allPosts.filter((post) => {
        if (post.status === REMOVAL_FLAG_STATUS) return false;

        if (!post.latitude || !post.longitude) return false;

        const dist = calculateDistanceMiles(
          location.latitude,
          location.longitude,
          post.latitude,
          post.longitude
        );
        return dist <= radiusMiles;
      });

      setPosts(nearby);
      setPostsLoading(false);
    };

    fetchAndFilterPosts();
  }, [location, radiusMiles, supabase, loading]);

  const handleOpenMaps = (latitude, longitude) => {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
      "_blank"
    );
  };

  const handleOpenCall = (contact) => {
   window.location.href = `tel:${contact}`;
  };

  // const handleIncrementAccepted = async (
  //   postId,
  //   currentAccepted,
  //   needed,
  //   posterUserId
  // ) => {
  //   if (currentUserId === posterUserId) {
  //      console.log("Error: Poster tried to accept their own help.");
  //     alert("You cannot accept help for your own post.");
  //     return;
  //   }

  //   if (currentAccepted >= needed) {
  //     console.log("Error: Post is already full.");
  //     alert("This help request is already full.");
  //     return;
  //   }

  //   setPostsLoading(true);
  //   const newAccepted = currentAccepted + 1;
  //   let newStatus = "open";
  //   let updatePayload = { people_accepted: newAccepted };

  //   if (newAccepted >= needed) {
  //    newStatus = REMOVAL_FLAG_STATUS;
  //     updatePayload = {
  //       ...updatePayload,
  //       status: newStatus,
  //       closed_at: new Date().toISOString(),
  //     };
  //     alert("Success! This post is now full and closed.");
  //   } else {
  //     alert("Thank you for offering help!");
  //   }

  //   const { error } = await supabase
  //     .from("posts")
  //     .update(updatePayload)
  //     .eq("id", postId);

  //   if (error) {
  //     console.error("Error updating accepted count:", error);
  //     alert("Failed to update post.");
  //     setPostsLoading(false);
  //     return;
  //   }

  //   setPosts((prevPosts) =>
  //     prevPosts.map((post) =>
  //       post.id === postId
  //         ? { ...post, people_accepted: newAccepted, status: newStatus }
  //         : post
  //     )
  //   );
  //   setPostsLoading(false);
  // };

  const handleIncrementAccepted = async (
  postId,
  currentAccepted,
  needed,
  posterUserEmail // ← ここも変更
) => {
  const currentUserEmail = sessionStorage.getItem("userEmail"); // ← 現在ログイン中のemailを取得

  // 投稿者自身が自分の投稿を受けようとした場合
  if (currentUserId === posterUserEmail) {
    console.log("Error: Poster tried to accept their own help.");
    alert("You cannot accept help for your own post.");
    return;
  }

  // 必要人数を超えている場合
  if (currentAccepted >= needed) {
    console.log("Error: Post is already full.");
    alert("This help request is already full.");
    return;
  }

  setPostsLoading(true);
  const newAccepted = currentAccepted + 1;
  let newStatus = "open";
  let updatePayload = { people_accepted: newAccepted };

  if (newAccepted >= needed) {
    newStatus = REMOVAL_FLAG_STATUS;
    updatePayload = {
      ...updatePayload,
      status: newStatus,
      closed_at: new Date().toISOString(),
    };
    alert("Success! This post is now full and closed.");
  } else {
    alert("Thank you for offering help!");
  }

  const { error } = await supabase
    .from("posts")
    .update(updatePayload)
    .eq("id", postId);

  if (error) {
    console.error("Error updating accepted count:", error);
    alert("Failed to update post.");
    setPostsLoading(false);
    return;
  }

  setPosts((prevPosts) =>
    prevPosts.map((post) =>
      post.id === postId
        ? { ...post, people_accepted: newAccepted, status: newStatus }
        : post
    )
  );
  setPostsLoading(false);
};


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-700 font-medium">
            Loading your location...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex justify-center p-8">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Help Needed Near You
          </h1>
          <p className="text-gray-600 text-lg">
            Connect with your community and make a difference
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <label className="block">
            <div className="flex justify-between items-center mb-3">
              <span className="text-lg font-semibold text-gray-700">
                Search Radius
              </span>
              <span className="text-2xl font-bold text-blue-600">
                {radiusMiles} miles
              </span>
            </div>
            <input
              type="range"
              min="1"
              max={40}
              value={radiusMiles}
              onChange={(e) => setRadiusMiles(Number(e.target.value))}
              className="w-full h-3 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>1 mile</span>
              <span>40 miles</span>
            </div>
          </label>
        </div>

        {postsLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Finding help requests...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="text-9xl mb-6">🙁</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                No Help Requests Found
              </h3>
              <p className="text-gray-600 text-lg mb-2">
                There are currently no help requests within {radiusMiles} miles
                of your location.
              </p>
              <p className="text-gray-500">
                Try increasing the search radius or check back later!
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-md p-4 mb-6">
              <p className="text-lg font-semibold text-gray-700">
                📍 Found <span className="text-blue-600">{posts.length}</span>{" "}
                {posts.length === 1 ? "request" : "requests"} near you
              </p>
            </div>

            <div className="space-y-6">
              {posts.map((post) => {
                const currentUserEmail = sessionStorage.getItem("userEmail");
                const isPoster = currentUserEmail && currentUserEmail === post.user_email;
                const isFull = post.people_accepted >= post.people_needed;

                return (
                  <div
                    key={post.id}
                    className="bg-white rounded-2xl shadow-xl border-4 border-blue-200 hover:border-blue-400 hover:shadow-2xl transition-all duration-300 overflow-hidden"
                  >
                    <div className="p-8 border-l-8 border-blue-500">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-3xl font-bold text-gray-800 flex-1">
                          {getCategoryIcon(post.category)} {post.title}
                        </h3>
                        {isPoster && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-200 text-yellow-800 ml-4">
                            YOUR POST
                          </span>
                        )}
                        <span
                          className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ml-4 ${getCategoryColor(
                            post.category
                          )}`}
                        >
                          {post.category}
                        </span>
                      </div>
                      <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                        {post.description}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {/* --- Open Maps Link --- */}
                        <div
                          onClick={() =>
                            handleOpenMaps(post.latitude, post.longitude)
                          }
                          className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200 cursor-pointer hover:bg-blue-100 transition"
                        >
                          <p className="text-sm font-bold text-blue-600 mb-1">
                            📍 Location
                          </p>
                          <p className="text-gray-800 font-semibold text-lg hover:underline">
                            {post.address}
                          </p>
                        </div>

                        {/* --- Call Link --- */}
                        <div
                          onClick={() => handleOpenCall(post.contact)}
                          className="bg-green-50 rounded-xl p-4 border-2 border-green-200 cursor-pointer hover:bg-green-100 transition"
                        >
                          <p className="text-sm font-bold text-green-600 mb-1">
                            📞 Contact
                          </p>
                          <p className="text-gray-800 font-semibold text-lg hover:underline">
                            {post.contact}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 items-center">
                       <div className="bg-blue-50 rounded-lg px-5 py-3 border-3 border-blue-300 shadow-sm">
                          <span className="text-blue-700 font-bold text-lg">
                            👥 {post.people_needed - post.people_accepted}{" "}
                            {post.people_needed - post.people_accepted === 1
                              ? "spot"
                              : "spots"}{" "}
                            left
                          </span>
                        </div>

                        <div
                          className={`rounded-lg px-5 py-3 border-3 font-bold text-lg shadow-sm ${
                            isFull || post.status !== "open"
                              ? "bg-gray-50 text-gray-600 border-gray-300"
                              : "bg-green-50 text-green-700 border-green-300"
                          }`}
                        >
                          {isFull
                            ? "🔴 FULL"
                            : post.status === "open"
                            ? "🟢 OPEN"
                            : "⚪ CLOSED"}
                        </div>

                        <button
                          onClick={() =>
                            handleIncrementAccepted(
                                 post.id,
                                 post.people_accepted,
                                 post.people_needed,
                                post.user_email
                              )
                          }
                          disabled={isPoster || isFull}
                          className={`
                            px-6 py-3 rounded-full text-lg font-bold transition-all shadow-md
                            ${
                              isPoster || isFull
                                ? "bg-gray-400 text-gray-100 cursor-not-allowed"
                                : "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105"
                            }
                          `}
                        >
                          {isPoster
                            ? "Your Post"
                            : isFull
                            ? "Request Full"
                            : "I Can Help!"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
