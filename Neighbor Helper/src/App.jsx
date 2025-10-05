import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import RequireAuth from "./auth/RequireAuth";

import LoginPage from "./pages/LoginPage";
import MapPosts from "./pages/MapPosts";
import NearbyPosts from "./pages/NearbyPosts";
import Dashboard from "./pages/Dashboard/";
import Sidebar from "./pages/Sidebar/";
import PostForm from "./pages/PostForm";
import AccountInfo from "./pages/AccountInfo";
import { supabase } from "./lib/supabaseClient";
import PostDetails from "./pages/PostDetail";
import UserPage from "./pages/UserPage";
import Me from "./pages/Me";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/map" element={<MapPosts supabase={supabase}/>} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/post" element={<NearbyPosts supabase={supabase}/>} />
          <Route path="/create" element={<PostForm supabase={supabase}/>} />
          <Route path="/info" element={<AccountInfo />} />
          <Route path="/postdetail/:id" element={<PostDetails />} />

          <Route path="/users/:email" element={<UserPage />} />
          <Route path="/me" element={<Me />} />
          

          <Route path="*" element={<div className="p-4">Not Found</div>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}


//--------------------------


// // src/App.jsx
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import { AuthProvider } from "./auth/AuthProvider";
// // import RequireAuth from "./auth/RequireAuth"; // Not used yet; keep commented or remove

// import LoginPage from "./pages/LoginPage";
// import MapPosts from "./pages/MapPosts";
// import NearbyPosts from "./pages/NearbyPosts";
// import Dashboard from "./pages/Dashboard/";   // ← no trailing slash
// // import Sidebar from "./pages/Sidebar";    // ← not used here; remove to avoid bundler warnings
// import PostForm from "./pages/PostForm";
// import AccountInfo from "./pages/AccountInfo";
// import { supabase } from "./lib/supabaseClient";
// import PostDetails from "./pages/PostDetail"; // ← FIX: correct file name
// import UserPage from "./pages/UserPage";
// import Me from "./pages/Me";

// export default function App() {
//   return (
//     <Router>
//       <AuthProvider>
//         <Routes>
//           {/* Public */}
//           <Route path="/" element={<LoginPage />} />
//           <Route path="/map" element={<MapPosts supabase={supabase} />} />
//           <Route path="/dashboard" element={<Dashboard />} />

//           {/* Keep list/create vs details consistent */}
//           <Route path="/post" element={<NearbyPosts supabase={supabase} />} />
//           <Route path="/create" element={<PostForm supabase={supabase} />} />
//           <Route path="/post/:id" element={<PostDetails />} /> {/* ← unified detail route */}

//           <Route path="/info" element={<AccountInfo />} />

//           {/* User profile pages */}
//           <Route path="/users/:email" element={<UserPage />} />
//           <Route path="/me" element={<Me />} />

//           <Route path="*" element={<div className="p-4">Not Found</div>} />
//         </Routes>
//       </AuthProvider>
//     </Router>
//   );
// }

