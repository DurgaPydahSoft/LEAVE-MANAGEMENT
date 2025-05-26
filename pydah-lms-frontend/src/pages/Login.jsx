import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import 'animate.css';

const Login = () => {
  const [customDepartment, setCustomDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    employeeId: "",
    department: "",
    designation: "",
    mobileNo: "",
  });

  const [role, setRole] = useState("employee");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [passwordConditions, setPasswordConditions] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
  });
  const [confirmPasswordValid, setConfirmPasswordValid] = useState(false);
  const [emailValid, setEmailValid] = useState(false);
  const [mobileValid, setMobileValid] = useState(false);

  const navigate = useNavigate();

  const handleDepartmentChange = (e) => {
    const selectedDepartment = e.target.value;

    setFormData((prev) => ({
      ...prev,
      department:
        selectedDepartment === "Others" ? customDepartment : selectedDepartment,
    }));

    if (selectedDepartment !== "Others") {
      setCustomDepartment(""); // Reset custom input if not "Others"
    }
  };
  const handleCustomDepartmentChange = (e) => {
    const customValue = e.target.value;
    setCustomDepartment(customValue);

    setFormData((prev) => ({
      ...prev,
      department: customValue, // Store custom department in formData
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "password") {
      setPasswordConditions({
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /[0-9]/.test(value),
        specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(value),
      });
    }

    if (name === "confirmPassword") {
      setConfirmPasswordValid(value === formData.password);
    }
    if (name === "email") {
      setEmailValid(/^[^\s@]{5,}@[^\s@]{2,}\.[^\s@]{2,}$/.test(value));
    }

    if (name === "mobileNo") {
      setMobileValid(/^[6-9]\d{9}$/.test(value)); // Validates Indian 10-digit phone numbers
    }
  };

  const isPasswordValid = Object.values(passwordConditions).every(Boolean);
  const isFormValid = isRegistering
    ? isPasswordValid && confirmPasswordValid && emailValid && mobileValid
    : formData.employeeId && formData.password;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    setLoading(true);

    // const endpoint = isRegistering ? "/register" : (role === "admin" ? "/admin" : "/login/admin");
    let endpoint;
if (isRegistering) {
  endpoint = "/register";
} else if (role === "admin") {
  endpoint = "/admin";
} else {
  endpoint = "/login/admin";
}

    console.log(endpoint);
    try {
      const response = await fetch(
        `https://pydah-lms-backend.onrender.com/api/auth${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isRegistering
              ? formData
              : { employeeId: parseInt(formData.employeeId) , password: formData.password }
          ),
        }
      );

      const data = await response.json();
      setLoading(false);
      if (!response.ok) return setError(data.msg || "Something went wrong");

      if (isRegistering) {

        alert("Registration successful! Please login.");
        setLoading(false);
        setIsRegistering(false);
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("employeeId", data.employeeId);
        setLoading(false);
        navigate(
          role === "employee" ? "/employee-dashboard" : "/admin-dashboard"
        );
      }
    } catch (err) {
      setError("Server error. Please try again.");
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
     
      <form className="w-full max-w-md bg-secondary shadow-outerRaised rounded-neumorphic p-6 sm:p-8">
      <button
        onClick={() => navigate("/")}
        className="mb-4 text-textLight bg-primary hover:bg-darkGold border border-transparent rounded-neumorphic py-2 px-4 text-sm font-semibold transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent"
      >
        <i className="fa fa-arrow-left"></i> {/* Left arrow icon */}
      </button>
        <h2 className="text-3xl font-bold mb-6 text-center text-primary font-heading animate__animated animate__bounce">
          {isRegistering ? "Register" : "Login"}
        </h2>

        {error && (
          <p className="text-red-500 text-center mb-4 bg-red-100 p-2 rounded-lg">
            {error}
          </p>
        )}

        {/* Role Selector (Only in Login) */}
        {!isRegistering && (
          <div className="mb-4">
            <label className="block text-primary font-medium mb-2">
              Select Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        )}

        {/* Registration Fields */}
        {isRegistering && (
          <>
            <div className="input-group">
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
      
            <div className="input-group">
              <select
                name="department"
                value={
                  formData.department === customDepartment
                    ? "Others"
                    : formData.department
                }
                onChange={handleDepartmentChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            </div>

            {/* Show input field if "Others" is selected */}
            {formData.department === customDepartment && (
              <div className="input-group mt-2">
                <input
                  type="text"
                  name="customDepartment"
                  placeholder="Please specify department"
                  value={customDepartment}
                  onChange={handleCustomDepartmentChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="input-group">
              <input
                type="text"
                name="designation"
                placeholder="Designation"
                value={formData.designation}
                onChange={handleChange}
                required
              />
            </div>
            <div className="input-group">
          <input 
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        {isRegistering && !emailValid && formData.email && (
          <p className="text-red-500 text-sm mt-1">❌ Enter a valid email</p>
        )}

            <div className="input-group">
              <input
                type="text"
                name="mobileNo"
                placeholder="Mobile No."
                value={formData.mobileNo}
                onChange={handleChange}
                required
              />
            </div>
            {isRegistering && !mobileValid && formData.mobileNo && (
              <p className="text-red-500 text-sm mt-1">
                ❌ Enter a valid 10-digit phone number
              </p>
            )}
          </>
        )}
        <div className="input-group">
              <input
                type="number"
                name="employeeId"
                placeholder="Employee ID"
                value={formData.employeeId}
                onChange={handleChange}
                required
              />
            </div>

        
        <div className="input-group">
          <input
          class=" font-medium"
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        {/* Password Conditions */}
        {isRegistering && !isPasswordValid && (
          <ul className="text-sm mt-2 space-y-1">
            {Object.entries(passwordConditions).map(([key, value]) => (
              <li
                key={key}
                className={`ml-4 ${value ? "text-green-600" : "text-red-500"}`}
              >
                ✅ {key.replace(/([A-Z])/g, " $1").trim()}
              </li>
            ))}
          </ul>
        )}

        {/* Confirm Password (Dynamically Positioned) */}
        {isRegistering && isPasswordValid && (
          <div className="input-group mt-4">
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
        )}

        {isRegistering &&
          confirmPasswordValid === false &&
          formData.confirmPassword && (
            <p className="text-red-500 text-sm mt-1">
              ❌ Passwords do not match
            </p>
          )}

        <button
          type="submit"
          className={`w-full text-white p-3 rounded-lg font-semibold transition-all duration-300 ${
            isFormValid
              ? "bg-primary"
              : "bg-gray-400 cursor-not-allowed"
          }`}
          disabled={!isFormValid}
          onClick={handleSubmit}
        >
          {isRegistering ? "Register" : "Login"}
        </button>

        <p className="text-center mt-4 text-sm text-gray-600">
          {isRegistering
            ? "Already have an account?"
            : "Don't have an account?"}{" "}
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-primary hover:text-blue-800 underline"
          >
            {isRegistering ? "Login here" : "Register here"}
          </button>
        </p>

        <button
          onClick={() => navigate("/hod-login")}
          className="w-full mt-4 text-primary hover:text-green-800 underline"
        >
          HOD Login
        </button>
      </form>

      {/* Tailwind CSS Input Field Styling */}
      <style>{`
        .input-group {
          margin-bottom: 16px;
        }
        .input-group input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ccc;
          border-radius: 8px;
          font-size: font-medium;
          transition: border 0.3s ease, box-shadow 0.3s ease;
        }
        .input-group input:focus {
           outline: none;
           border-color: #2563eb;
          box-shadow: 0 0 6px rgba(37, 99, 235, 0.4);
        }
      `}</style>
    </div>
  );
};

export default Login;
