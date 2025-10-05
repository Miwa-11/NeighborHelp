import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuthCtx } from '../auth/AuthProvider';
import "../index.css"

export default function Sidebar({ showSidebar, setShowSidebar }) {
  const navigate = useNavigate();
  const { session } = useAuthCtx();
  const [userName, setUserName] = useState("");

  // useEffect(() => {
  //   const fetchUser = async () => {
  //     if (session?.user?.id) {
  //       const { data } = await supabase
  //         .from('profiles')
  //         .select('first_name, last_name')
  //         .eq('user_id', session.user.id)
  //         .single();
        
  //       if (data) {
  //         setUserName(`${data.first_name} ${data.last_name}`);
  //       }
  //     }
  //   };
  //   fetchUser();
  // }, [session]);

  useEffect(() => {
  const fetchUser = async () => {
    const userEmail = sessionStorage.getItem("userEmail"); // ←ここで email 取得
    if (!userEmail) return;

    const { data, error } = await supabase
      .from('users')
      .select('first_name, last_name')
      .eq('email', userEmail)  // ← email で検索
      .single();

    if (error) {
      console.error(error);
      return;
    }

    if (data) {
      const firstName = data.first_name || "";
      const lastName = data.last_name || "";
      const fullName = `${firstName} ${lastName}`.trim();
      setUserName(fullName || "User"); // ←デフォルト表示も用意
    }
  };

  fetchUser();
}, []);


  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await supabase.auth.signOut();
      sessionStorage.removeItem("userEmail");
      navigate('/');
    }
  };

  return (
    <>
      {/* Overlay */}
      {showSidebar && (
        <div
          onClick={() => setShowSidebar(false)}
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
          <h2 className="text-2xl font-bold">Neighborhood Help</h2>
          <p className="text-sm opacity-90 mt-1">Welcome, {userName}!</p>
        </div>

        <div className="py-4">
          <button
            onClick={() => {
              
              setShowSidebar(false);
              navigate('/post');
            }}
            className="w-full px-6 py-4 text-left hover:bg-gray-100 flex items-center gap-4 transition"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
            </svg>
            <span className="font-medium">Task List</span>
          </button>

          <button
            onClick={() => {
              
              setShowSidebar(false);
              navigate("/info");
            }}
            className="w-full px-6 py-4 text-left hover:bg-gray-100 flex items-center gap-4 transition"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            <span className="font-medium">Account</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full px-6 py-4 text-left hover:bg-gray-100 flex items-center gap-4 transition text-red-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}