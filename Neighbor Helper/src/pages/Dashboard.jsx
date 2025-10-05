import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import MapPosts from './MapPosts';
import Sidebar from './Sidebar/';


export default function Dashboard() {
  const { uid } = useParams();
  const [showSidebar, setShowSidebar] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const navigate = useNavigate();

//   const handlePostCreated = () => {
//     setRefreshTrigger(prev => prev + 1);
//   };

  return (
    <div className="relative w-full h-screen">
      {/* Hamburger Menu Button */}
      <button
        onClick={() => setShowSidebar(true)}
        className="fixed top-6 left-5 z-50 bg-white p-3 rounded-lg shadow-lg hover:shadow-xl transition"
      >
        <div className="w-8 h-5 flex flex-col justify-between">
            <span className="block h-0.5 bg-green-600 rounded"></span>

           <span className="block h-0.5 bg-green-600 rounded"></span>
            
            <span className="block h-0.5 bg-green-600 rounded"></span>
        </div>
      </button>

      {/* Sidebar */}
      <Sidebar 
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
      />

      {/* Map */}
      <MapPosts 
        supabase={supabase}
        refreshTrigger={refreshTrigger}
      />

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => navigate('/create')}
        className="fixed inset-y-0 right-16 translate-y-[calc(100vh-5rem)] w-16 h-16 bg-green-600 rounded-full shadow-lg hover:bg-green-700 hover:scale-110 transition flex items-center justify-center z-40"
>
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
        </svg>
      </button>
    </div>
  );
}