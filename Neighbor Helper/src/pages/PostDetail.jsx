// src/pages/PostDetails.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function PostDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setPost(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load post details.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="text-center mt-10">Loading post...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;
  if (!post) return <p className="text-center mt-10">Post not found.</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-xl mt-10">
      <button
        onClick={() => navigate(-1)}
        className="text-blue-600 underline mb-4 hover:text-blue-800"
      >
        ← Back
      </button>

      <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
      <p className="text-gray-600 mb-4">{post.category}</p>

      <p className="text-lg mb-4">{post.description}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <div>
          <p>
            <span className="font-semibold">Address:</span> {post.address}
          </p>
          <p>
            <span className="font-semibold">Contact:</span> {post.contact}
          </p>
          <p>
            <span className="font-semibold">Status:</span> {post.status}
          </p>
        </div>
        <div>
          <p>
            <span className="font-semibold">People Needed:</span>{" "}
            {post.people_needed}
          </p>
          <p>
            <span className="font-semibold">People Accepted:</span>{" "}
            {post.people_accepted}
          </p>
          <p>
            <span className="font-semibold">Created At:</span>{" "}
            {new Date(post.created_at).toLocaleString()}
          </p>
          <p>
            <span className="font-semibold">Posted By:</span> {post.user_email}
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={() => alert("Feature coming soon!")}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Join / Contact
        </button>
      </div>
    </div>
  );
}
