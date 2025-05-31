import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import config from '../config';

// Base URL for all API calls
const API_BASE_URL = config.API_BASE_URL;

const EmployeeLogin = () => {
  const [formData, setFormData] = useState({
    employeeId: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Auto-fill employeeId if coming from registration
  useEffect(() => {
    const lastRegisteredId = sessionStorage.getItem('lastRegisteredId');
    if (lastRegisteredId) {
      setFormData(prev => ({ ...prev, employeeId: lastRegisteredId }));
      sessionStorage.removeItem('lastRegisteredId'); // Clear it after use
    }
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Ensure employeeId is a string
      const loginData = {
        employeeId: formData.employeeId.toString(),
        password: formData.password
      };

      console.log('Attempting login with:', { employeeId: loginData.employeeId });
      
      const response = await axios.post(
        `${API_BASE_URL}/employee/login`,
        loginData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Login response:', response.data);

      if (response.data && response.data.token && response.data.user) {
        const { token, user } = response.data;
        
        try {
          // Store all necessary user data
          localStorage.setItem('token', token);
          localStorage.setItem('role', 'employee');
          localStorage.setItem('employeeId', user.employeeId);
          localStorage.setItem('campus', user.campus);
          localStorage.setItem('department', user.department);
          localStorage.setItem('name', user.name);
          localStorage.setItem('email', user.email);
          
          // Set default authorization header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Navigate to dashboard
          toast.success('Login successful!');
          navigate('/employee-dashboard', { replace: true });
        } catch (error) {
          console.error('Error setting up session:', error);
          localStorage.clear();
          delete axios.defaults.headers.common['Authorization'];
          setError('Error setting up session. Please try logging in again.');
          toast.error('Error setting up session. Please try again.');
        }
      } else {
        console.error('Invalid server response:', response.data);
        setError('Invalid login response from server');
        toast.error('Login failed: Invalid server response');
      }
    } catch (error) {
      console.error('Login error:', error.response?.data || error);
      setError(error.response?.data?.msg || 'Login failed. Please try again.');
      toast.error(error.response?.data?.msg || 'Login failed');
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-secondary rounded-neumorphic shadow-outerRaised p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-primary">Employee Login</h2>
          <p className="text-gray-600 mt-2">Access your leave management portal</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Employee ID
            </label>
            <input
              type="text"
              name="employeeId"
              value={formData.employeeId}
              onChange={handleChange}
              className="w-full p-3 rounded-neumorphic shadow-innerSoft bg-background
                       focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter your Employee ID"
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

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <span
              onClick={() => navigate('/employee-register')}
              className="text-primary cursor-pointer hover:underline"
            >
              Register here
            </span>
          </p>
        </div>

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

export default EmployeeLogin; 