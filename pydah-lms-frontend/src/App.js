import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import HodLogin from "./pages/HodLogin"; // Import HOD Login page
import HodRegister from "./pages/HodRegister"; // Import HOD Registration page
import HodDashboard from "./pages/HodDashboard"; // Import HOD Dashboard
import Header from "./components/Header";
import Footer from "./components/Footer";
import "./App.css"; // Import App CSS file

import Home from "./components/Home"

const App = () => {
  return (
    <>
    <div className="bg-secondary">
    <Header />
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/hod-login" element={<HodLogin />} /> {/* HOD Login */}
        <Route path="/hod-register" element={<HodRegister />} /> {/* HOD Registration */}
        <Route path="/hod-dashboard" element={<HodDashboard />} /> {/* HOD Dashboard */}
        
        <Route path="/" element={<Home />} /> {/* Default page */}
      </Routes>
    </Router>
    <Footer />
    </div>
    </>
  );
};

export default App;
