import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const HodRegister = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [HODId, setHODId] = useState(""); // New state for HODId
  const [emailValid, setEmailValid] = useState(false);
  const [customDepartment, setCustomDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordConditions, setPasswordConditions] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
  });
  const [confirmPasswordValid, setConfirmPasswordValid] = useState(false);
  const navigate = useNavigate();

  // Handle Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "email") {
      setEmail(value);
      setEmailValid(/^[^\s@]{5,}@[^\s@]{2,}\.[^\s@]{2,}$/.test(value));
    }

    if (name === "password") {
      setPassword(value);
      setPasswordConditions({
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /[0-9]/.test(value),
        specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(value),
      });
    }

    if (name === "confirmPassword") {
      setConfirmPassword(value);
      setConfirmPasswordValid(value === password);
    }

    if (name === "department") {
      setDepartment(value);
    }

    if (name === "HODId") {
      setHODId(value);
    }
  };

  const handleDepartmentChange = (e) => {
    setDepartment(e.target.value);
    if (e.target.value !== "Others") {
      setCustomDepartment(""); //Reset custom input if not "Others"
    }
  };
  const isPasswordValid = Object.values(passwordConditions).every(Boolean);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    const finalDepartment = department === "Others" ? customDepartment : department;
    try {
      const response = await fetch("https://pydah-lms-backend.onrender.com/api/hod/hod-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name, 
          email, 
          password, 
          department: finalDepartment,
          HODId // Including HODId in the request
        }),
      });

      const data = await response.json();
      setLoading(false); // Hide loading spinner
      if (response.ok) {
        alert("Registration Successful! Please login.");
        navigate("/hod-login");
      } else {
        alert(data.msg);
      }
    } catch (error) {
      setLoading(false); // Hide loading spinner
      console.error("Registration Error:", error);
    }
  };
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col items-center">
          {/* Animated Loader */}
          <div className="w-16 h-16 border-4 border-primary  rounded-2xl animate-spin"></div>

          <p className="mt-4 text-lg font-semibold text-gray-700">
            Processing Your Request, please wait...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-maroon to-darkGold px-4 sm:px-6 lg:px-8">
    <div className="w-full max-w-md bg-secondary shadow-outerRaised rounded-neumorphic p-6 sm:p-8">
      <h2 className="text-3xl font-semibold mb-6 text-center text-primary font-heading">
        HOD Registration
      </h2>
  
      <form onSubmit={handleRegister}>
        <div className="mb-4">
          <label className="block text-primary font-medium">Name</label>
          <input
            type="text"
            className="w-full p-3 border-none rounded-neumorphic bg-background shadow-innerInset focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        
        {/* New HOD ID Field */}
        <div className="mb-4">
          <label className="block text-primary font-medium">HOD ID <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="HODId"
            className="w-full p-3 border-none rounded-neumorphic bg-background shadow-innerInset focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter your HOD ID"
            value={HODId}
            onChange={handleChange}
            required
          />
        </div>
  
        <div className="mb-4">
          <label className="block text-primary font-medium">Email</label>
          <input
            type="email"
            name="email"
            className="w-full p-3 border-none rounded-neumorphic bg-background shadow-innerInset focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter email"
            value={email}
            onChange={handleChange}
            required
          />
          {!emailValid && email && (
            <p className="text-red-500 text-sm mt-1">❌ Invalid email format</p>
          )}
        </div>
  
        <div className="mb-4">
          <label className="block text-primary font-medium">Password</label>
          <input
            type="password"
            name="password"
            className="w-full p-3 border-none rounded-neumorphic bg-background shadow-innerInset focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter password"
            value={password}
            onChange={handleChange}
            required
          />
        </div>
  
        {!isPasswordValid && password && (
          <ul className="text-sm mt-2 space-y-1">
            {Object.entries(passwordConditions).map(([key, value]) => (
              <li key={key} className={`ml-4 ${value ? "text-green-600" : "text-red-500"}`}>
                {value ? "✅" : "❌"} {key.replace(/([A-Z])/g, " $1").trim()}
              </li>
            ))}
          </ul>
        )}
  
        {isPasswordValid && (
          <div className="mb-4">
            <label className="block text-primary font-medium">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              className="w-full p-3 border-none rounded-neumorphic bg-background shadow-innerInset focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={handleChange}
              required
            />
            {!confirmPasswordValid && confirmPassword && (
              <p className="text-red-500 text-sm mt-1">❌ Passwords do not match</p>
            )}
          </div>
        )}
  
        <div className="mb-4">
          <label className="block text-primary font-medium">Department</label>
          <select
            name="department"
            className="w-full p-3 border-none rounded-neumorphic bg-background shadow-innerInset focus:outline-none focus:ring-2 focus:ring-primary"
            value={department}
            onChange={handleDepartmentChange}
            required
          >
            <option value="" disabled>Select Department</option>
            <option value="CSE">CSE</option>
            <option value="Agriculture">Agriculture - Mech - Civil</option>
            <option value="ECE">ECE</option>
            <option value="Diploma-CSE">Diploma-CSE</option>
            <option value="Diploma-ECE">Diploma-ECE</option>
            <option value="Diploma-MECH">Diploma-MECH</option>
            <option value="HBS">HBS</option>
            <option value="Non-Teaching">Non-Teaching</option>
            <option value="Others">Others</option>
          </select>
          {department === "Others" && (
            <input
              type="text"
              name="customDepartment"
              className="w-full p-3 mt-2 border-none rounded-neumorphic bg-background shadow-innerInset focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Please specify department"
              value={customDepartment}
              onChange={(e) => setCustomDepartment(e.target.value)}
              required
            />
          )}
        </div>
  
        <button
          type="submit"
          className={`w-full text-textLight p-3 rounded-neumorphic font-semibold shadow-outerRaised transition-all duration-300 ${
            emailValid && isPasswordValid && confirmPasswordValid && HODId
              ? "bg-primary hover:bg-darkGold"
              : "bg-gray-400 cursor-not-allowed"
          }`}
          disabled={!emailValid || !isPasswordValid || !confirmPasswordValid || !HODId}
        >
          Register
        </button>
      </form>
  
      <p className="text-center text-gray-600 mt-6 text-sm">
        Already have an account?{" "}
        <span
          onClick={() => navigate("/hod-login")}
          className="text-accent cursor-pointer hover:underline"
        >
          Login here
        </span>
      </p>
    </div>
  </div>
  
  );
};

export default HodRegister;