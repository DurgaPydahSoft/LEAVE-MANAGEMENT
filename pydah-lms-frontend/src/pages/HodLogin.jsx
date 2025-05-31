import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "font-awesome/css/font-awesome.min.css"; // Importing Font Awesome
import { validateEmail } from '../utils/validators';
import config from '../config';

const API_BASE_URL = config.API_BASE_URL;

const BRANCH_OPTIONS = {
  engineering: ['CSE', 'ECE', 'MECH', 'AGRI', 'CIVIL', 'CSE_AI'],
  diploma: ['DCSE', 'DECE', 'DAIML', 'DME', 'DAP', 'D_FISHERIES', 'D_ANIMAL_HUSBANDRY'],
  pharmacy: ['B_PHARMACY', 'PHARM_D', 'PHARM_PB_D', 'PHARMACEUTICAL_ANALYSIS', 'PHARMACEUTICS', 'PHARMA_QUALITY_ASSURANCE'],
  degree: ['AGRICULTURE', 'HORTICULTURE', 'FOOD_TECHNOLOGY', 'FISHERIES', 'FOOD_SCIENCE_NUTRITION']
};

const HodLogin = () => {
  const { campus } = useParams();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    campus: '',
    branchCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
      // Reset branchCode when campus changes
      ...(name === 'campus' && { branchCode: '' })
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate email
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting HOD login with:', {
        email: formData.email,
        password: formData.password,
        campus: formData.campus,
        branchCode: formData.branchCode,
        url: `${API_BASE_URL}/api/hod/login`
      });

      const response = await axios.post(
        `${API_BASE_URL}/api/hod/login`,
        {
          email: formData.email,
          password: formData.password,
          campus: formData.campus,
          branchCode: formData.branchCode
        }
      );

      console.log('Login response:', response.data);

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', 'hod');
      localStorage.setItem('campus', formData.campus);
      localStorage.setItem('branchCode', formData.branchCode);
      navigate('/hod-dashboard');
    } catch (error) {
      console.error('Login error:', error.response || error);
      setError(error.response?.data?.msg || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-primary rounded-2xl animate-spin"></div>
          <p className="mt-4 text-lg font-semibold text-gray-700">
            Processing your request...
          </p>
        </div>
      </div>
    );
  }

  // Get available branches for selected campus
  const availableBranches = BRANCH_OPTIONS[formData.campus] || [];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-secondary rounded-neumorphic shadow-outerRaised p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-primary">HOD Login</h2>
          <p className="text-gray-600 mt-2">Access your department dashboard</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Campus
            </label>
            <select
              name="campus"
              value={formData.campus}
              onChange={handleChange}
              className="w-full p-3 rounded-neumorphic shadow-innerSoft bg-background
                       focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Select Campus</option>
              <option value="engineering">Engineering</option>
              <option value="degree">Degree</option>
              <option value="pharmacy">Pharmacy</option>
              <option value="diploma">Diploma</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Branch Code
            </label>
            <select
              name="branchCode"
              value={formData.branchCode}
              onChange={handleChange}
              className="w-full p-3 rounded-neumorphic shadow-innerSoft bg-background
                       focus:outline-none focus:ring-2 focus:ring-primary"
              required
              disabled={!formData.campus}
            >
              <option value="">Select Branch Code</option>
              {availableBranches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 rounded-neumorphic shadow-innerSoft bg-background
                       focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3 rounded-neumorphic shadow-innerSoft bg-background
                       focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white py-3 rounded-neumorphic
                     hover:shadow-innerSoft transition-all duration-300"
          >
            Login
          </button>
        </form>

        <button
          onClick={() => navigate('/')}
          className="mt-4 w-full text-primary hover:text-blue-800 text-center"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default HodLogin;
