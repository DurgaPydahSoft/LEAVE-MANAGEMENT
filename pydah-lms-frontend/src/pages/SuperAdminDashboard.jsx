import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PREDEFINED_CAMPUSES = [
  { name: 'engineering', displayName: 'PYDAH Engineering College' },
  { name: 'degree', displayName: 'PYDAH Degree College' },
  { name: 'pharmacy', displayName: 'PYDAH College of Pharmacy' },
  { name: 'diploma', displayName: 'PYDAH Polytechnic College' }
];

const SuperAdminDashboard = () => {
  const [campuses, setCampuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    campusName: ''
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchCampuses();
  }, []);

  const fetchCampuses = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        navigate('/');
        return;
      }

      console.log('Fetching campuses...');
      const response = await axios.get(
        'http://localhost:5000/api/super-admin/campuses',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log('Campuses response:', response.data);
      setCampuses(response.data);
    } catch (error) {
      console.error('Error fetching campuses:', error);
      setError(error.response?.data?.msg || 'Failed to fetch campuses');
      if (error.response?.status === 401) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrincipal = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      
      // First create the campus if it doesn't exist
      const selectedCampus = PREDEFINED_CAMPUSES.find(c => c.name === formData.campusName);
      if (!selectedCampus) {
        throw new Error('Invalid campus selected');
      }

      let campusId;
      const existingCampus = campuses.find(c => c.name === formData.campusName);
      
      if (!existingCampus) {
        const campusResponse = await axios.post(
          'http://localhost:5000/api/super-admin/campuses',
          {
            name: selectedCampus.name,
            displayName: selectedCampus.displayName
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        campusId = campusResponse.data.campus._id;
      } else {
        if (existingCampus.principalId) {
          throw new Error('This campus already has a principal assigned');
        }
        campusId = existingCampus._id;
      }

      // Then create the principal
      const principalResponse = await axios.post(
        'http://localhost:5000/api/super-admin/principals',
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          campusId: campusId
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setShowCreateModal(false);
      setFormData({ name: '', email: '', password: '', campusName: '' });
      await fetchCampuses(); // Refresh the campus list
      
    } catch (error) {
      console.error('Error creating principal:', error);
      setError(error.response?.data?.msg || error.message || 'Failed to create principal');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCampusStatus = async (campusId, isActive) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'http://localhost:5000/api/super-admin/campus-status',
        { campusId, isActive },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      fetchCampuses();
    } catch (error) {
      setError(error.response?.data?.msg || 'Failed to update campus status');
    }
  };

  const handleResetPassword = async (principalId) => {
    try {
      const token = localStorage.getItem('token');
      const newPassword = window.prompt('Enter new password for principal:');
      if (!newPassword) return;

      await axios.put(
        'http://localhost:5000/api/super-admin/reset-principal-password',
        { principalId, newPassword },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      alert('Password reset successful');
    } catch (error) {
      setError(error.response?.data?.msg || 'Failed to reset password');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-primary rounded-2xl animate-spin"></div>
          <p className="mt-4 text-lg font-semibold text-gray-700">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Super Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-neumorphic
                     hover:shadow-innerSoft transition-all duration-300"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary text-white px-6 py-3 rounded-neumorphic
                   hover:shadow-innerSoft transition-all duration-300 mb-8"
        >
          Create Principal Account
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PREDEFINED_CAMPUSES.map((predefinedCampus) => {
            const campus = campuses.find(c => c.name === predefinedCampus.name) || predefinedCampus;
            const principal = campus.principalId;
            
            return (
              <div
                key={campus.name}
                className="bg-secondary p-6 rounded-neumorphic shadow-outerRaised"
              >
                <h3 className="text-xl font-semibold text-primary mb-4">
                  {predefinedCampus.displayName}
                </h3>
                
                {principal ? (
                  <div className="space-y-2">
                    <p><strong>Principal:</strong> {principal.name}</p>
                    <p><strong>Email:</strong> {principal.email}</p>
                    <p><strong>Last Login:</strong> {
                      principal.lastLogin
                        ? new Date(principal.lastLogin).toLocaleString()
                        : 'Never'
                    }</p>
                    <p><strong>Status:</strong> <span className={`px-2 py-1 rounded-full text-white text-sm ${principal.isActive ? 'bg-green-500' : 'bg-red-500'}`}>
                      {principal.isActive ? 'Active' : 'Inactive'}
                    </span></p>
                    <div className="flex space-x-2 mt-4">
                      <button
                        onClick={() => handleUpdateCampusStatus(campus._id, !campus.isActive)}
                        className={`px-4 py-2 rounded-neumorphic transition-all duration-300
                                  ${campus.isActive
                                    ? 'bg-red-500 text-white'
                                    : 'bg-green-500 text-white'}`}
                      >
                        {campus.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleResetPassword(principal._id)}
                        className="bg-yellow-500 text-white px-4 py-2 rounded-neumorphic
                                 hover:shadow-innerSoft transition-all duration-300"
                      >
                        Reset Password
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600">No principal assigned</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Principal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-secondary rounded-neumorphic shadow-outerRaised p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-primary mb-6">Create Principal Account</h2>
            
            <form onSubmit={handleCreatePrincipal}>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full p-3 rounded-neumorphic shadow-innerSoft bg-background
                             focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full p-3 rounded-neumorphic shadow-innerSoft bg-background
                             focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full p-3 rounded-neumorphic shadow-innerSoft bg-background
                             focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Campus
                  </label>
                  <select
                    value={formData.campusName}
                    onChange={(e) => setFormData({...formData, campusName: e.target.value})}
                    className="w-full p-3 rounded-neumorphic shadow-innerSoft bg-background
                             focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select a campus</option>
                    {PREDEFINED_CAMPUSES.map((campus) => {
                      const existingCampus = campuses.find(c => c.name === campus.name);
                      if (!existingCampus || !existingCampus.principalId) {
                        return (
                          <option key={campus.name} value={campus.name}>
                            {campus.displayName}
                          </option>
                        );
                      }
                      return null;
                    })}
                  </select>
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-neumorphic bg-gray-500 text-white
                             hover:shadow-innerSoft transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-neumorphic bg-primary text-white
                             hover:shadow-innerSoft transition-all duration-300"
                  >
                    Create Principal
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard; 