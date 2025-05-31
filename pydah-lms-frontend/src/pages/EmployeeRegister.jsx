import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { BRANCH_OPTIONS } from '../config/branchOptions';
import config from '../config';

// Base URL for all API calls
const API_BASE_URL = config.API_BASE_URL;

const EmployeeRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    employeeId: '',
    phoneNumber: '',
    campus: '',
    department: ''
  });

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  const campuses = [
    { value: 'engineering', label: 'Engineering' },
    { value: 'degree', label: 'Degree' },
    { value: 'pharmacy', label: 'Pharmacy' },
    { value: 'diploma', label: 'Diploma' }
  ];

  // Update departments based on selected campus
  useEffect(() => {
    if (formData.campus) {
      const campusType = formData.campus.charAt(0).toUpperCase() + formData.campus.slice(1);
      const departmentList = BRANCH_OPTIONS[campusType] || [];
      setDepartments(departmentList);
      
      // Reset department selection if campus changes
      if (formData.department && !departmentList.includes(formData.department)) {
        setFormData(prev => ({ ...prev, department: '' }));
      }
    }
  }, [formData.campus]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Validate phone number
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    // Validate campus and department
    const campusType = formData.campus.charAt(0).toUpperCase() + formData.campus.slice(1);
    if (!BRANCH_OPTIONS[campusType]) {
      toast.error('Invalid campus selected');
      return;
    }

    if (!BRANCH_OPTIONS[campusType].includes(formData.department)) {
      toast.error('Invalid department for selected campus');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/employee/register`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email.toLowerCase(),
        password: formData.password,
        employeeId: formData.employeeId,
        phoneNumber: formData.phoneNumber,
        campus: formData.campus.toLowerCase(),
        department: formData.department
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Registration response:', response.data);

      if (response.data) {
        toast.success('Registration successful! Please login with your Employee ID and password.');
        // Store the employeeId temporarily to auto-fill in login
        sessionStorage.setItem('lastRegisteredId', formData.employeeId);
        setTimeout(() => {
          navigate('/employee-login');
        }, 2000);
      }
    } catch (error) {
      console.error('Registration error:', error.response?.data || error);
      const errorMessage = error.response?.data?.msg || 'Registration failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-secondary p-8 rounded-neumorphic shadow-outerRaised">
          <h2 className="text-3xl font-bold text-primary mb-6 text-center">
            Employee Registration
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full p-3 rounded-neumorphic bg-secondary shadow-innerSoft focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full p-3 rounded-neumorphic bg-secondary shadow-innerSoft focus:outline-none"
                />
              </div>
            </div>

            {/* Employee ID */}
            <div>
              <label className="block text-gray-700 mb-2">Employee ID</label>
              <input
                type="text"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-neumorphic bg-secondary shadow-innerSoft focus:outline-none"
              />
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full p-3 rounded-neumorphic bg-secondary shadow-innerSoft focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  pattern="[0-9]{10}"
                  placeholder="10-digit number"
                  className="w-full p-3 rounded-neumorphic bg-secondary shadow-innerSoft focus:outline-none"
                />
              </div>
            </div>

            {/* Campus and Department */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Campus</label>
                <select
                  name="campus"
                  value={formData.campus}
                  onChange={handleChange}
                  required
                  className="w-full p-3 rounded-neumorphic bg-secondary shadow-innerSoft focus:outline-none"
                >
                  <option value="">Select Campus</option>
                  {campuses.map(campus => (
                    <option key={campus.value} value={campus.value}>
                      {campus.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Department</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  disabled={!formData.campus}
                  className="w-full p-3 rounded-neumorphic bg-secondary shadow-innerSoft focus:outline-none"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>
                      {dept.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="6"
                  className="w-full p-3 rounded-neumorphic bg-secondary shadow-innerSoft focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength="6"
                  className="w-full p-3 rounded-neumorphic bg-secondary shadow-innerSoft focus:outline-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-between items-center mt-8">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-3 rounded-neumorphic bg-secondary shadow-outerRaised hover:shadow-innerSoft 
                         transition-all duration-300 text-gray-600"
              >
                Back to Home
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-neumorphic bg-primary text-white shadow-outerRaised 
                         hover:shadow-innerSoft transition-all duration-300 disabled:opacity-50"
              >
                {loading ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeeRegister; 