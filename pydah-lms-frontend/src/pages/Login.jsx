import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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

  // Add refs to track state
  const formDataRef = useRef(formData);
  const roleRef = useRef(role);

  // Update refs when state changes
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  const navigate = useNavigate();
  const location = useLocation();

  // Handle URL parameters
  useEffect(() => {
    console.log("Login component mounted - Checking URL parameters");
    const searchParams = new URLSearchParams(location.search);
    const employeeId = searchParams.get('employeeId');
    const password = searchParams.get('password');

    console.log("Raw URL parameters:", {
      employeeId,
      password,
      fullUrl: window.location.href,
      searchString: location.search
    });

    // Validate parameters
    if (employeeId && password) {
      const parsedEmployeeId = parseInt(employeeId);
      console.log("Parsed employeeId:", parsedEmployeeId);
      
      if (!isNaN(parsedEmployeeId)) {
        console.log("Valid URL parameters found, setting up admin login");
        
        // Set form data and role
        const newFormData = {
          name: "",
          email: "",
          password: password,
          employeeId: parsedEmployeeId.toString(), // Convert back to string for form
          department: "",
          designation: "",
          mobileNo: "",
        };
        
        console.log("Setting new form data:", newFormData);
        setFormData(newFormData);
        formDataRef.current = newFormData; // Update ref immediately
        
        console.log("Setting role to admin");
        setRole("admin");
        roleRef.current = "admin"; // Update ref immediately
        
        // Add a small delay to ensure state updates are complete
        setTimeout(() => {
          console.log("Current state before login:", {
            formData: formDataRef.current,
            role: roleRef.current
          });
          handleSubmit(null, true);
        }, 1000);
      } else {
        console.log("Invalid employeeId format:", employeeId);
        setError("Invalid employee ID format");
      }
    } else {
      console.log("Missing URL parameters:", {
        employeeId,
        password
      });
    }
  }, [location.search]);

  const handleDepartmentChange = (e) => {
    const selectedDepartment = e.target.value;
    setFormData((prev) => ({
      ...prev,
      department: selectedDepartment === "Others" ? customDepartment : selectedDepartment,
    }));

    if (selectedDepartment !== "Others") {
      setCustomDepartment("");
    }
  };

  const handleCustomDepartmentChange = (e) => {
    const customValue = e.target.value;
    setCustomDepartment(customValue);
    setFormData((prev) => ({
      ...prev,
      department: customValue,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log("Form field changed:", { name, value });
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      console.log("Updated form data:", newData);
      return newData;
    });

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
      setMobileValid(/^[6-9]\d{9}$/.test(value));
    }
  };

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    console.log("Role changed to:", newRole);
    setRole(newRole);
  };

  const isPasswordValid = Object.values(passwordConditions).every(Boolean);
  const isFormValid = isRegistering
    ? isPasswordValid && confirmPasswordValid && emailValid && mobileValid
    : formData.employeeId && formData.password;

  const handleSubmit = async (e, isUrlLogin = false) => {
    if (e) e.preventDefault();
    console.log("handleSubmit called", { 
      isUrlLogin, 
      role: roleRef.current, 
      formData: formDataRef.current,
      currentUrl: window.location.href,
      searchParams: window.location.search
    });
    setError("");
    setLoading(true);

    let endpoint;
    if (isRegistering) {
      endpoint = "/register";
    } else if (roleRef.current === "admin") {
      endpoint = "/admin";
    } else {
      endpoint = "/login/employee";
    }

    console.log("Making request to endpoint:", endpoint);
    try {
      console.log("Form data before parsing:", formDataRef.current);
      const employeeId = parseInt(formDataRef.current.employeeId);
      console.log("Parsed employeeId:", employeeId);
      
      if (isNaN(employeeId)) {
        console.error("Invalid employeeId format:", formDataRef.current.employeeId);
        setError("Invalid employee ID format");
        setLoading(false);
        return;
      }

      const requestBody = isRegistering
        ? formDataRef.current
        : { 
            employeeId: employeeId,
            password: formDataRef.current.password
          };
      
      console.log("Request body:", requestBody);
      
      const response = await fetch(
        `http://localhost:5000/api/auth${endpoint}`,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(requestBody),
        }
      );

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);
      
      if (!response.ok) {
        console.error("Login failed:", data.msg);
        setError(data.msg || "Something went wrong");
        setLoading(false);
        return;
      }

      if (isRegistering) {
        alert("Registration successful! Please login.");
        setLoading(false);
        setIsRegistering(false);
      } else {
        console.log("Login successful, storing data");
        
        try {
          // Clear existing data
          localStorage.clear();
          
          // Store token and user data
          if (data.token) {
            localStorage.setItem("token", data.token);
            console.log("Token stored:", data.token);
          } else {
            console.error("No token received in response");
            setError("Login failed: No token received");
            setLoading(false);
            return;
          }

          // Store employee ID
          const storedEmployeeId = data.admin?.id || data.employeeId;
          if (storedEmployeeId) {
            localStorage.setItem("employeeId", storedEmployeeId);
            console.log("Employee ID stored:", storedEmployeeId);
          }

          // Store role
          localStorage.setItem("role", roleRef.current);
          console.log("Role stored:", roleRef.current);

          // Verify storage
          const storedToken = localStorage.getItem("token");
          const verifiedEmployeeId = localStorage.getItem("employeeId");
          const storedRole = localStorage.getItem("role");

          console.log("Verification of stored data:", {
            token: storedToken ? "Present" : "Missing",
            employeeId: verifiedEmployeeId ? "Present" : "Missing",
            role: storedRole ? "Present" : "Missing"
          });

          if (!storedToken || !verifiedEmployeeId || !storedRole) {
            console.error("Failed to store all required data");
            setError("Error saving login data");
            setLoading(false);
            return;
          }

          setLoading(false);
          console.log("Redirecting to dashboard");
          
          if (roleRef.current === "admin") {
            console.log("Navigating to admin dashboard");
            navigate("/admin-dashboard", { replace: true });
          } else {
            console.log("Navigating to employee dashboard");
            navigate("/employee-dashboard", { replace: true });
          }
        } catch (storageError) {
          console.error("Error storing data in localStorage:", storageError);
          setError("Error saving login data");
          setLoading(false);
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Server error. Please try again.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-primary rounded-2xl animate-spin"></div>
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
          <i className="fa fa-arrow-left"></i>
        </button>
        <h2 className="text-3xl font-bold mb-6 text-center text-primary font-heading animate__animated animate__bounce">
          {isRegistering ? "Register" : "Login"}
        </h2>

        {error && (
          <p className="text-red-500 text-center mb-4 bg-red-100 p-2 rounded-lg">
            {error}
          </p>
        )}

        {!isRegistering && (
          <div className="mb-4">
            <label className="block text-primary font-medium mb-2">
              Select Role
            </label>
            <select
              value={role}
              onChange={handleRoleChange}
              className="w-full p-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="employee">Employee</option>
            </select>
          </div>
        )}

        <div className="input-group">
          <input
            type="number"
            name="employeeId"
            placeholder="Employee ID"
            value={formData.employeeId}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="input-group">
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

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
