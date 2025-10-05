// // src/pages/LoginPage.jsx
// import React, { useState } from "react";
// import { MapPin } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { supabase } from "../lib/supabaseClient";

// export default function LoginPage() {
//   const navigate = useNavigate();

//   const [isSignup, setIsSignup] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [formData, setFormData] = useState({
//     firstName: "",
//     lastName: "",
//     email: "",
//     password: "",
//     phone: "",
//     streetAddress: "",
//     city: "",
//     state: "",
//     postalCode: "",
//   });

//   // Helper to map Supabase messages to friendlier text
//   const explain = (err) => {
//     const msg = (err?.message || "").toLowerCase();
//     if (msg.includes("email not confirmed")) return "Please confirm your email first (check your inbox).";
//     if (msg.includes("invalid login credentials")) return "Invalid email or password.";
//     if (msg.includes("signup requires valid password")) return "Password is required to sign up.";
//     return err?.message || "Something went wrong";
//   };

//   const upsertProfile = async (user) => {
//     // IMPORTANT: include user_id so RLS passes (auth.uid() = user_id)
//     const { error } = await supabase
//       .from("users")
//       .upsert(
//         {
//           user_id: user.id, // <-- FK to auth.users(id)
//           email: user.email,
//           first_name: formData.firstName || null,
//           last_name: formData.lastName || null,
//           phone: formData.phone || null,
//           street: formData.streetAddress || null,
//           city: formData.city || null,
//           state: formData.state || null,
//           postal_code: formData.postalCode || null,
//         },
//         { onConflict: "user_id" } // requires unique/PK on user_id
//       );
//     if (error) throw error;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (loading) return;

//     setLoading(true);

//     const email = (formData.email || "").trim().toLowerCase();
//     const password = (formData.password || "").trim();

//     try {
//       if (isSignup) {
//         // --- SIGN UP ---
//         const { data, error: signUpError } = await supabase.auth.signUp({
//           email,
//           password, // required for password flow
//           options: {
//             emailRedirectTo: `${window.location.origin}/me`,
//           },
//         });
//         if (signUpError) throw signUpError;

//         // If email confirmations are ON, Supabase returns NO session here.
//         // In that case we can't upsert (RLS would fail because auth.uid() is null).
//         const session = data.session ?? (await supabase.auth.getSession()).data.session;
//         if (!session) {
//           alert("Check your email to confirm your account, then log in.");
//           return;
//         }

//         // Email confirmations OFF -> we have a session and can upsert now
//         await upsertProfile(session.user);
//         navigate("/me");
//       } else {
//         // --- LOGIN ---
//         const { data, error: signInError } = await supabase.auth.signInWithPassword({
//           email,
//           password,
//         });
//         if (signInError) throw signInError;

//         // Ensure a profile row exists/updated after login
//         await upsertProfile(data.user);
//         navigate("/me");
//       }
//     } catch (err) {
//       console.error(err);
//       alert(explain(err));
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
//       <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
//         {/* Header */}
//         <div className="text-center mb-8">
//           <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
//             <MapPin className="w-8 h-8 text-white" />
//           </div>
//           <h1 className="text-3xl font-bold text-gray-900">Neighborhood Help</h1>
//           <p className="text-gray-600 mt-2">Connect and support your community</p>
//         </div>

//         {/* Toggle */}
//         <div className="flex gap-2 mb-6">
//           <button
//             type="button"
//             onClick={() => setIsSignup(false)}
//             className={`flex-1 py-2 rounded-lg font-medium transition ${!isSignup ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
//               }`}
//           >
//             Login
//           </button>
//           <button
//             type="button"
//             onClick={() => setIsSignup(true)}
//             className={`flex-1 py-2 rounded-lg font-medium transition ${isSignup ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
//               }`}
//           >
//             Sign Up
//           </button>
//         </div>

//         {/* Form */}
//         <form className="space-y-4" onSubmit={handleSubmit}>
//           {isSignup && (
//             <>
//               <input
//                 type="text"
//                 placeholder="First Name"
//                 value={formData.firstName}
//                 onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
//                 className="w-full px-4 py-3 border rounded-lg"
//                 autoComplete="given-name"
//               />
//               <input
//                 type="text"
//                 placeholder="Last Name"
//                 value={formData.lastName}
//                 onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
//                 className="w-full px-4 py-3 border rounded-lg"
//                 autoComplete="family-name"
//               />
//             </>
//           )}

//           <input
//             type="email"
//             placeholder="Email"
//             value={formData.email}
//             onChange={(e) => setFormData({ ...formData, email: e.target.value })}
//             className="w-full px-4 py-3 border rounded-lg"
//             autoComplete="email"
//             required
//           />

//           <input
//             type="password"
//             placeholder="Password"
//             value={formData.password}
//             onChange={(e) => setFormData({ ...formData, password: e.target.value })}
//             className="w-full px-4 py-3 border rounded-lg"
//             autoComplete={isSignup ? "new-password" : "current-password"}
//             required
//             minLength={6}
//           />

//           {isSignup && (
//             <>
//               <input
//                 type="tel"
//                 placeholder="Phone"
//                 value={formData.phone}
//                 onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
//                 className="w-full px-4 py-3 border rounded-lg"
//                 autoComplete="tel"
//               />
//               <input
//                 type="text"
//                 placeholder="Street Address"
//                 value={formData.streetAddress}
//                 onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
//                 className="w-full px-4 py-3 border rounded-lg"
//                 autoComplete="street-address"
//               />
//               <input
//                 type="text"
//                 placeholder="City"
//                 value={formData.city}
//                 onChange={(e) => setFormData({ ...formData, city: e.target.value })}
//                 className="w-full px-4 py-3 border rounded-lg"
//                 autoComplete="address-level2"
//               />

//               {/* State input + dropdown side by side */}
//               <div className="flex gap-2">
//                 <input
//                   type="text"
//                   placeholder="State"
//                   className="flex-1 px-4 py-3 border rounded-lg"
//                   value={formData.state}
//                   onChange={(e) => setFormData({ ...formData, state: e.target.value })}
//                   autoComplete="address-level1"
//                 />
//                 <select
//                   className="flex-1 px-4 py-3 border rounded-lg"
//                   value={formData.state}
//                   onChange={(e) => setFormData({ ...formData, state: e.target.value })}
//                 >
//                   <option value="">Select a state</option>
//                   {[
//                     "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
//                     "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
//                     "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
//                   ].map((s) => (
//                     <option key={s} value={s}>{s}</option>
//                   ))}
//                 </select>
//               </div>

//               <input
//                 type="text"
//                 placeholder="Postal Code"
//                 value={formData.postalCode}
//                 onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
//                 className="w-full px-4 py-3 border rounded-lg"
//                 autoComplete="postal-code"
//               />
//             </>
//           )}

//           <button
//             type="submit"
//             disabled={loading}
//             className={`w-full ${loading ? "bg-green-400" : "bg-green-700 hover:bg-green-800"} text-white py-3 rounded-lg font-medium transition`}
//           >
//             {loading ? "Please wait..." : isSignup ? "Create Account" : "Log In"}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }
// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { supabase } from '../lib/supabaseClient';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    streetAddress: "",
    city: "",
    state: "",
    postalCode: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // const userEmail = email; // ← フォームのstateから取得
    // sessionStorage.setItem("userEmail", userEmail); // ← これもここで保存
    
    const userEmail = (formData.email || "").trim();

    if (isSignup) {
      //  Sign Up: check all fields
      for (const key in formData) {
        if (!formData[key]) {
          alert("There are missing fields. Please fill out all fields.");
          return;
        }
      }

      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', formData.email)
        .single();

      if (existingUser) {
        alert("This email is already used. Please try logging in.");
        return;
      }

      // to get the longitude and latitude from input
      const fullAddress = `${formData.streetAddress}, ${formData.city}, ${formData.state}, ${formData.postalCode}`;
      const geoResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
      );
      const geoData = await geoResponse.json();

      let lat = null;
      let lng = null;
      if (geoData.results && geoData.results.length > 0) {
        lat = geoData.results[0].geometry.location.lat;
        lng = geoData.results[0].geometry.location.lng;
      } else {
        alert("Could not find coordinates for the entered address.");
      } 

      // Insert new user
      const { error } = await supabase.from('users').insert([
        {
          email: formData.email,
          password: formData.password, //  Hash this in production
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          street: formData.streetAddress,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postalCode,
          latitude: lat, 
          longitude: lng
        }
      ]);

      if (error) {
        console.error(error);
        alert("Error occurred during account creation.");
        return;
      }

       // ✅ Save session in browser memory
      sessionStorage.setItem("userEmail", formData.email);

      navigate("/dashboard");

      //debaging
      const userEmail = sessionStorage.getItem("userEmail");
      if (!userEmail) {
        console.log("No user logged in hererererer");
        return;
      }
    } else {
      // ✅ Login: only check email & password
      if (!formData.email || !formData.password) {
        alert("Please enter your email and password.");
        return;
      }

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', formData.email)
        .single();

      if (error || !user || user.password !== formData.password) {
        alert("Email or password is incorrect.");
        return;
      }

      // ✅ Save session on login
      sessionStorage.setItem("userEmail", formData.email);

      navigate("/dashboard");

      
    }
  };

  return ( <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
   
      <div className="bg-mint rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Neighbor Helper</h1>
          <p className="text-red-600 mt-2 font-serif">Connect and support your community!!</p>
        </div>

        {/* Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setIsSignup(false)}
            className={`flex-1 py-2 rounded-lg font-medium transition ${!isSignup ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            Login
          </button>
          <button
            onClick={() => setIsSignup(true)}
            className={`flex-1 py-2 rounded-lg font-medium transition ${isSignup ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {isSignup && (
            <>
              <input type="text" placeholder="First Name" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full px-4 py-3 border rounded-lg" />
              <input type="text" placeholder="Last Name" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full px-4 py-3 border rounded-lg" />
            </>
          )}

          <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 border rounded-lg" />
          <input type="password" placeholder="Password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-3 border rounded-lg" />

          {isSignup && (
            <>
              <input type="tel" placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-3 border rounded-lg" />
              <input type="text" placeholder="Street Address" value={formData.streetAddress} onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })} className="w-full px-4 py-3 border rounded-lg" />
              <input type="text" placeholder="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full px-4 py-3 border rounded-lg" />

              {/* State input + dropdown side by side */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="State"
                  className="flex-1 px-4 py-3 border rounded-lg"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
                <select
                  className="flex-1 px-4 py-3 border rounded-lg"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                >
                  <option value="">Select a state</option>
                  <option value="AL">Alabama</option>
                  <option value="AK">Alaska</option>
                  <option value="AZ">Arizona</option>
                  <option value="AR">Arkansas</option>
                  <option value="CA">California</option>
                  <option value="CO">Colorado</option>
                  <option value="CT">Connecticut</option>
                  <option value="DE">Delaware</option>
                  <option value="FL">Florida</option>
                  <option value="GA">Georgia</option>
                  <option value="HI">Hawaii</option>
                  <option value="ID">Idaho</option>
                  <option value="IL">Illinois</option>
                  <option value="IN">Indiana</option>
                  <option value="IA">Iowa</option>
                  <option value="KS">Kansas</option>
                  <option value="KY">Kentucky</option>
                  <option value="LA">Louisiana</option>
                  <option value="ME">Maine</option>
                  <option value="MD">Maryland</option>
                  <option value="MA">Massachusetts</option>
                  <option value="MI">Michigan</option>
                  <option value="MN">Minnesota</option>
                  <option value="MS">Mississippi</option>
                  <option value="MO">Missouri</option>
                  <option value="MT">Montana</option>
                  <option value="NE">Nebraska</option>
                  <option value="NV">Nevada</option>
                  <option value="NH">New Hampshire</option>
                  <option value="NJ">New Jersey</option>
                  <option value="NM">New Mexico</option>
                  <option value="NY">New York</option>
                  <option value="NC">North Carolina</option>
                  <option value="ND">North Dakota</option>
                  <option value="OH">Ohio</option>
                  <option value="OK">Oklahoma</option>
                  <option value="OR">Oregon</option>
                  <option value="PA">Pennsylvania</option>
                  <option value="RI">Rhode Island</option>
                  <option value="SC">South Carolina</option>
                  <option value="SD">South Dakota</option>
                  <option value="TN">Tennessee</option>
                  <option value="TX">Texas</option>
                  <option value="UT">Utah</option>
                  <option value="VT">Vermont</option>
                  <option value="VA">Virginia</option>
                  <option value="WA">Washington</option>
                  <option value="WV">West Virginia</option>
                  <option value="WI">Wisconsin</option>
                  <option value="WY">Wyoming</option>
                </select>
              </div>

              <input type="text" placeholder="Postal Code" value={formData.postalCode} onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })} className="w-full px-4 py-3 border rounded-lg" />
            </>
          )}

          <button onClick={handleSubmit} className="w-full bg-green-700 text-white py-3 rounded-lg font-medium hover:bg-green-800 transition">
            {isSignup ? "Create Account" : "Log In"}
          </button>
        </div>
      </div>
    </div>
  );
}
