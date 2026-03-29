import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";


const readStoredUser = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    return null;
  }

  return {
    id: Number(localStorage.getItem("user_id") || 0),
    token,
    name: localStorage.getItem("user_name") || "",
    email: localStorage.getItem("user_email") || "",
  };
};


const ProtectedRoute = ({ user, children }) => {
  if (!user?.token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};


function App() {
  const [authUser, setAuthUser] = useState(readStoredUser);
  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark",
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const syncAuthUser = () => setAuthUser(readStoredUser());

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    syncAuthUser();
  };

  const appProps = {
    authUser,
    isDarkMode,
    onToggleTheme: () => setIsDarkMode((current) => !current),
    onLogout: handleLogout,
    onAuthChange: syncAuthUser,
  };

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: "16px",
            padding: "14px 18px",
          },
        }}
      />

      <Routes>
        <Route path="/" element={<Home {...appProps} />} />
        <Route path="/login" element={<Login {...appProps} />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute user={authUser}>
              <Dashboard {...appProps} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}


export default App;
