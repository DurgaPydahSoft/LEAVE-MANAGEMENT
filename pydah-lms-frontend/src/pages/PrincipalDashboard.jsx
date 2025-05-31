import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { validateEmail } from '../utils/validators';
import { toast } from 'react-toastify';
import HodPasswordResetModal from '../components/HodPasswordResetModal';
import RemarksModal from '../components/RemarksModal';
import PrincipalSidebar from '../components/PrincipalSidebar';
import config from '../config';

const BRANCH_OPTIONS = {
  Engineering: ['CSE', 'ECE', 'MECH', 'AGRI', 'CIVIL', 'CSE_AI'],
  Diploma: ['DCSE', 'DECE', 'DAIML', 'DME', 'DAP', 'D_FISHERIES', 'D_ANIMAL_HUSBANDRY'],
  Pharmacy: ['B_PHARMACY', 'PHARM_D', 'PHARM_PB_D', 'PHARMACEUTICAL_ANALYSIS', 'PHARMACEUTICS', 'PHARMA_QUALITY_ASSURANCE'],
  Degree: ['AGRICULTURE', 'HORTICULTURE', 'FOOD_TECHNOLOGY', 'FISHERIES', 'FOOD_SCIENCE_NUTRITION']
};

const BRANCH_NAMES = {
  CSE: 'Computer Science and Engineering',
  ECE: 'Electronics and Communication Engineering',
  MECH: 'Mechanical Engineering',
  AGRI: 'Agricultural Engineering',
  CIVIL: 'Civil Engineering',
  CSE_AI: 'Computer Science and Engineering (AI)',
  DCSE: 'Diploma in Computer Science Engineering',
  DECE: 'Diploma in Electronics and Communication Engineering',
  DAIML: 'Diploma in AI and Machine Learning',
  DME: 'Diploma in Mechanical Engineering',
  DAP: 'Diploma in Agricultural Production',
  D_FISHERIES: 'Diploma in Fisheries',
  D_ANIMAL_HUSBANDRY: 'Diploma in Animal Husbandry',
  B_PHARMACY: 'Bachelor of Pharmacy',
  PHARM_D: 'Doctor of Pharmacy',
  PHARM_PB_D: 'Post Baccalaureate Doctor of Pharmacy',
  PHARMACEUTICAL_ANALYSIS: 'Pharmaceutical Analysis',
  PHARMACEUTICS: 'Pharmaceutics',
  PHARMA_QUALITY_ASSURANCE: 'Pharmaceutical Quality Assurance',
  AGRICULTURE: 'Agriculture',
  HORTICULTURE: 'Horticulture',
  FOOD_TECHNOLOGY: 'Food Technology',
  FISHERIES: 'Fisheries',
  FOOD_SCIENCE_NUTRITION: 'Food Science and Nutrition'
};

const API_BASE_URL = config.API_BASE_URL;

const PrincipalDashboard = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    branchCode: '',
    HODId: ''
  });
  const [hods, setHods] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeeFilters, setEmployeeFilters] = useState({
    search: '',
    department: '',
    status: ''
  });
  const [selectedHod, setSelectedHod] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    department: '',
    status: ''
  });
  const [forwardedLeaves, setForwardedLeaves] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [cclWorkRequests, setCclWorkRequests] = useState([]);
  const [selectedCCLWork, setSelectedCCLWork] = useState(null);
  const [showCCLRemarksModal, setShowCCLRemarksModal] = useState(false);
  const [cclRemarks, setCclRemarks] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showLeaveDetailsModal, setShowLeaveDetailsModal] = useState(false);

  const navigate = useNavigate();
  const campus = localStorage.getItem('campus');
  const token = localStorage.getItem('token');

  // Handle redirection
  useEffect(() => {
    if (shouldRedirect) {
      navigate('/');
    }
  }, [shouldRedirect, navigate]);

  // Check authentication on mount
  useEffect(() => {
    if (!campus || !token) {
      setShouldRedirect(true);
      return;
    }
    fetchBranches();
    fetchHods();
    fetchEmployees();
    fetchForwardedLeaves();
    fetchCCLWorkRequests();
  }, [campus, token]);

  const fetchBranches = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/principal/hods`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setBranches(response.data);
    } catch (error) {
      setError(error.response?.data?.msg || 'Failed to fetch branches');
    } finally {
      setLoading(false);
    }
  };

  const fetchHods = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/principal/hods`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setHods(response.data);
    } catch (error) {
      console.error('Error fetching HODs:', error);
      const errorMsg = error.response?.data?.msg || 'Failed to fetch HODs';
      setError(errorMsg);
      toast.error(errorMsg);

      if (error.response?.status === 401) {
        localStorage.clear();
        setShouldRedirect(true);
      }
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const campus = localStorage.getItem('campus');
      
      console.log('Fetching employees with:', {
        token: token ? 'Present' : 'Missing',
        campus,
        filters: employeeFilters,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const queryParams = new URLSearchParams(employeeFilters).toString();
      const url = `${API_BASE_URL}/principal/employees?${queryParams}`;
      console.log('Request URL:', url);

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Employee fetch response:', {
        status: response.status,
        data: response.data,
        employeeCount: response.data.length
      });

      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      toast.error(error.response?.data?.msg || 'Failed to fetch employees');
    }
  };

  const fetchForwardedLeaves = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/principal/campus-leaves`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log('Fetched forwarded leaves:', response.data);
      if (Array.isArray(response.data)) {
        setForwardedLeaves(response.data);
      } else {
        console.error('Invalid data format received:', response.data);
        setError('Invalid data format received from server');
      }
    } catch (error) {
      console.error('Error fetching forwarded leaves:', error);
      setError('Failed to fetch forwarded leave requests');
    }
  };

  const fetchCCLWorkRequests = async () => {
    try {
      console.log('Fetching CCL work requests...');
      const response = await axios.get(`${API_BASE_URL}/principal/ccl-work-requests`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('CCL work requests response:', response.data);
      
      if (response.data.success && Array.isArray(response.data.data)) {
        setCclWorkRequests(response.data.data);
      } else if (Array.isArray(response.data)) {
        // Handle case where response is just an array
        setCclWorkRequests(response.data);
      } else {
        console.error('Invalid response format:', response.data);
        setCclWorkRequests([]);
        toast.error('Failed to fetch CCL work requests: Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching CCL work requests:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setCclWorkRequests([]);
      toast.error(error.response?.data?.message || 'Failed to fetch CCL work requests');
    }
  };

  const handleLeaveAction = async (action) => {
    if (!selectedLeave) return;

    try {
      console.log('Updating leave request:', {
        leaveId: selectedLeave._id,
        action,
        remarks,
        token: token ? 'Present' : 'Missing',
        campus
      });

      const response = await axios.put(
        `${API_BASE_URL}/principal/leave-request/${selectedLeave._id}`,
        {
          action: action.toLowerCase() === "approved" ? "approve" : "reject",
          remarks: remarks || `${action.toLowerCase()} by Principal`
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.status === 200) {
        toast.success(`Leave request ${action.toLowerCase()} successfully`);
        // Update the local state
        setForwardedLeaves(prev => 
          prev.map(leave => 
            leave._id === selectedLeave._id 
              ? { 
                  ...leave, 
                  status: action,
                  principalRemarks: remarks || `${action.toLowerCase()} by Principal`,
                  principalApprovalDate: new Date().toISOString()
                } 
              : leave
          )
        );
        setSelectedLeave(null);
        setRemarks('');
        // Refresh the leave requests
        fetchForwardedLeaves();
      }
    } catch (error) {
      console.error('Error updating leave request:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        leaveId: selectedLeave._id,
        action,
        campus
      });
      toast.error(error.response?.data?.msg || 'Failed to update leave request');
    }
  };

  useEffect(() => {
    if (campus && token) {
      fetchEmployees();
    }
  }, [employeeFilters, campus, token]);

  const handleCreateHOD = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    // Get campus type with proper capitalization
    const campusType = campus.charAt(0).toUpperCase() + campus.slice(1);

    try {
      await axios.post(
        `${API_BASE_URL}/principal/hods`,
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          HODId: formData.HODId || formData.email.toLowerCase(), // Use email as fallback
          department: {
            name: BRANCH_NAMES[formData.branchCode] || formData.branchCode,
            code: formData.branchCode,
            campusType: campusType
          }
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('HOD created successfully');
      setShowCreateModal(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        branchCode: '',
        HODId: ''
      });
      fetchHods(); // Refresh the HOD list
    } catch (error) {
      console.error('Create HOD Error:', error.response || error);
      const errorMsg = error.response?.data?.msg || 'Failed to create HOD';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (hod) => {
    setSelectedHod(hod);
    setEditForm({
      name: hod.name,
      email: hod.email,
      phoneNumber: hod.phoneNumber || '',
      department: hod.department?.code || hod.branchCode || '',
      status: hod.status || (hod.isActive ? 'active' : 'inactive')
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `${API_BASE_URL}/principal/hods/${selectedHod._id}?model=${selectedHod.model}`,
        editForm,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Update hods list
      setHods(hods.map(hod => 
        hod._id === selectedHod._id 
          ? { ...response.data.hod, model: selectedHod.model }
          : hod
      ));

      setShowEditModal(false);
      toast.success('HOD details updated successfully');
    } catch (error) {
      console.error('Error updating HOD:', error);
      toast.error(error.response?.data?.msg || 'Failed to update HOD');
    }
  };

  const handleResetPassword = (hod) => {
    setSelectedHod(hod);
    setShowPasswordResetModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('campus');
    setShouldRedirect(true);
  };

  const handleAction = (requestId, action) => {
    console.log('handleAction called with:', { requestId, action });
    setSelectedRequestId(requestId);
    setSelectedAction(action);
    setShowRemarksModal(true);
  };

  const handleRemarksSubmit = async (remarks) => {
    if (!selectedRequestId || !selectedAction) {
      console.error('Missing required data:', { selectedRequestId, selectedAction });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found in localStorage');
        toast.error('Authentication token missing. Please login again.');
        setShouldRedirect(true);
        return;
      }

      console.log('Submitting remarks:', {
        requestId: selectedRequestId,
        action: selectedAction,
        remarks,
        token: token ? 'Present' : 'Missing',
        campus
      });

      const response = await axios.put(
        `${API_BASE_URL}/principal/leave-request/${selectedRequestId}`,
        {
          action: selectedAction,
          remarks: remarks || `${selectedAction === 'approve' ? 'Approved' : 'Rejected'} by Principal`
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        // Update the leave request in the state
        setForwardedLeaves(prev => 
          prev.map(leave => 
            leave._id === selectedRequestId 
              ? { 
                  ...leave, 
                  status: selectedAction === 'approve' ? 'Approved' : 'Rejected',
                  principalRemarks: remarks || `${selectedAction === 'approve' ? 'Approved' : 'Rejected'} by Principal`,
                  principalApprovalDate: new Date().toISOString()
                } 
              : leave
          )
        );

        setSelectedRequestId(null);
        setSelectedAction(null);
        setShowRemarksModal(false);
        setRefreshTrigger(prev => !prev);
        toast.success(response.data.msg || 'Leave request updated successfully');
      }
    } catch (error) {
      console.error('Error updating leave request:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        requestId: selectedRequestId,
        action: selectedAction,
        campus
      });
      
      if (error.response?.status === 403) {
        toast.error('You are not authorized to update this leave request. Please check your campus permissions.');
      } else if (error.response?.status === 401) {
        toast.error('Your session has expired. Please login again.');
        setShouldRedirect(true);
      } else {
        toast.error(error.response?.data?.msg || 'Failed to update leave request');
      }
    }
  };

  // Handle CCL work request action
  const handleCCLWorkAction = async (status) => {
    try {
      if (!selectedCCLWork) return;

      console.log('Updating CCL work request:', {
        requestId: selectedCCLWork._id,
        status,
        remarks: cclRemarks || `${status} by Principal`
      });

      const response = await axios.put(
        `${API_BASE_URL}/principal/ccl-work-requests/${selectedCCLWork._id}`,
        {
          status,
          remarks: cclRemarks || `${status} by Principal`
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('CCL work request update response:', response.data);

      if (response.data.success) {
        // Update the CCL work request in the state
        setCclWorkRequests(prev =>
          prev.map(work =>
            work._id === selectedCCLWork._id
              ? response.data.data
              : work
          )
        );

        setSelectedCCLWork(null);
        setCclRemarks('');
        setShowCCLRemarksModal(false);
        toast.success(response.data.message || 'CCL work request updated successfully');
      } else {
        toast.error(response.data.message || 'Failed to update CCL work request');
      }
    } catch (error) {
      console.error('Error updating CCL work request:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error(error.response?.data?.message || 'Failed to update CCL work request');
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-primary mb-6">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Stats Cards */}
              <div className="bg-secondary p-6 rounded-neumorphic shadow-outerRaised">
                <h3 className="text-lg font-semibold text-primary mb-2">Total HODs</h3>
                <p className="text-3xl font-bold">{hods.length}</p>
              </div>
              <div className="bg-secondary p-6 rounded-neumorphic shadow-outerRaised">
                <h3 className="text-lg font-semibold text-primary mb-2">Total Employees</h3>
                <p className="text-3xl font-bold">{employees.length}</p>
              </div>
              <div className="bg-secondary p-6 rounded-neumorphic shadow-outerRaised">
                <h3 className="text-lg font-semibold text-primary mb-2">Pending Leaves</h3>
                <p className="text-3xl font-bold">
                  {forwardedLeaves.filter(leave => leave.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
        );

      case 'hods':
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-primary">HOD Management</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-primary text-white px-4 py-2 rounded-neumorphic
                         hover:shadow-innerSoft transition-all duration-300"
              >
                Create HOD
              </button>
            </div>
            <div className="bg-secondary rounded-neumorphic shadow-outerRaised p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg overflow-hidden">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Department</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Phone</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {hods.map((hod) => (
                      <tr key={hod._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{hod.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{hod.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="group relative">
                            <span>{hod.department?.code || hod.branchCode}</span>
                            <div className="hidden group-hover:block absolute z-10 bg-black text-white text-xs rounded py-1 px-2 left-0 -bottom-8">
                              {hod.department?.name || BRANCH_NAMES[hod.branchCode] || hod.branchCode}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{hod.phoneNumber || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold
                            ${(hod.status === 'active' || hod.isActive)
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'}`}
                          >
                            {hod.status || (hod.isActive ? 'active' : 'inactive')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm space-x-2">
                          <button
                            onClick={() => handleEditClick(hod)}
                            className="bg-blue-500 text-white px-3 py-1 rounded-md text-xs hover:bg-blue-600 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleResetPassword(hod)}
                            className="bg-orange-500 text-white px-3 py-1 rounded-md text-xs hover:bg-orange-600 transition-colors"
                          >
                            Reset Password
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'employees':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-primary mb-6">Employee Management</h2>
            <div className="bg-secondary rounded-neumorphic shadow-outerRaised p-6">
              {/* Employee filters */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Search by name, email, or ID..."
                  value={employeeFilters.search}
                  onChange={(e) => setEmployeeFilters({ ...employeeFilters, search: e.target.value })}
                  className="p-2 rounded-neumorphic shadow-innerSoft bg-background"
                />
                <select
                  value={employeeFilters.department}
                  onChange={(e) => setEmployeeFilters({ ...employeeFilters, department: e.target.value })}
                  className="p-2 rounded-neumorphic shadow-innerSoft bg-background"
                >
                  <option value="">All Departments</option>
                  {Object.entries(BRANCH_NAMES).map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
                <select
                  value={employeeFilters.status}
                  onChange={(e) => setEmployeeFilters({ ...employeeFilters, status: e.target.value })}
                  className="p-2 rounded-neumorphic shadow-innerSoft bg-background"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Employee list */}
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg overflow-hidden">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Employee ID</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Department</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Designation</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Phone</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {employees.map((employee) => (
                      <tr key={employee._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{employee.employeeId}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{employee.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{employee.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="group relative">
                            <span>{employee.branchCode || employee.department}</span>
                            <div className="hidden group-hover:block absolute z-10 bg-black text-white text-xs rounded py-1 px-2 left-0 -bottom-8">
                              {BRANCH_NAMES[employee.branchCode] || BRANCH_NAMES[employee.department] || employee.department}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {employee.designation}
                          {employee.role === 'faculty' && <span className="ml-1 text-xs text-blue-600">(Faculty)</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{employee.phoneNumber || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold
                            ${employee.status === 'active'
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'}`}
                          >
                            {employee.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'leaves':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-primary mb-6">Leave Requests</h2>
            <div className="bg-secondary rounded-neumorphic shadow-outerRaised p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {forwardedLeaves.map((leave) => (
                  <div 
                    key={leave._id} 
                    className="bg-background p-4 rounded-neumorphic shadow-innerSoft cursor-pointer hover:shadow-outerRaised transition-all duration-300"
                    onClick={() => {
                      setSelectedLeave(leave);
                      setShowLeaveDetailsModal(true);
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-primary">
                          {leave.employee?.name || leave.employeeName || 'Unknown Employee'}
                        </h3>
                        <p className="text-gray-600">ID: {leave.employee?.employeeId || leave.employeeEmployeeId || 'N/A'}</p>
                        <p className="text-gray-600">
                          {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-gray-600">
                          Type: {leave.type ? leave.type.charAt(0).toUpperCase() + leave.type.slice(1) : 
                                 leave.leaveType ? leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1) : 'N/A'}
                        </p>
                        <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-semibold
                          ${leave.status === 'Approved' ? 'bg-green-100 text-green-800' :
                            leave.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                            leave.status === 'Forwarded by HOD' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'}`}
                        >
                          {leave.status || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Leave Details Modal */}
            {showLeaveDetailsModal && selectedLeave && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-primary">Leave Request Details</h3>
                    <button
                      onClick={() => {
                        setShowLeaveDetailsModal(false);
                        setSelectedLeave(null);
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Employee Information */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Employee Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Name</p>
                          <p className="font-medium">{selectedLeave.employee?.name || selectedLeave.employeeName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Employee ID</p>
                          <p className="font-medium">{selectedLeave.employee?.employeeId || selectedLeave.employeeEmployeeId}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium">{selectedLeave.employee?.email || selectedLeave.employeeEmail}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Department</p>
                          <p className="font-medium">{selectedLeave.employee?.department?.name || selectedLeave.employeeDepartment}</p>
                        </div>
                      </div>
                    </div>

                    {/* Leave Details */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Leave Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Leave Type</p>
                          <p className="font-medium">
                            {selectedLeave.type ? selectedLeave.type.charAt(0).toUpperCase() + selectedLeave.type.slice(1) : 
                             selectedLeave.leaveType ? selectedLeave.leaveType.charAt(0).toUpperCase() + selectedLeave.leaveType.slice(1) : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Duration</p>
                          <p className="font-medium">
                            {new Date(selectedLeave.startDate).toLocaleDateString()} to {new Date(selectedLeave.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Applied On</p>
                          <p className="font-medium">
                            {selectedLeave.appliedOn ? new Date(selectedLeave.appliedOn).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold
                            ${selectedLeave.status === 'Approved' ? 'bg-green-100 text-green-800' :
                              selectedLeave.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                              selectedLeave.status === 'Forwarded by HOD' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'}`}
                          >
                            {selectedLeave.status || 'N/A'}
                          </span>
                        </div>
                        {selectedLeave.isHalfDay && (
                          <div className="col-span-2">
                            <p className="text-sm text-gray-600">Half Day Leave</p>
                          </div>
                        )}
                        <div className="col-span-2">
                          <p className="text-sm text-gray-600">Reason</p>
                          <p className="font-medium">{selectedLeave.reason || 'No reason provided'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Remarks */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Remarks</h4>
                      <div className="space-y-2">
                        {selectedLeave.hodRemarks && (
                          <div>
                            <p className="text-sm text-gray-600">HOD Remarks</p>
                            <p className="font-medium">{selectedLeave.hodRemarks}</p>
                          </div>
                        )}
                        {selectedLeave.principalRemarks && (
                          <div>
                            <p className="text-sm text-gray-600">Principal Remarks</p>
                            <p className="font-medium">{selectedLeave.principalRemarks}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Alternate Schedule */}
                    {selectedLeave.alternateSchedule && selectedLeave.alternateSchedule.length > 0 && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">Alternate Schedule</h4>
                        <div className="space-y-4">
                          {selectedLeave.alternateSchedule.map((schedule, index) => (
                            <div key={index} className="bg-white p-3 rounded-md">
                              <p className="font-medium mb-2">
                                Date: {schedule.date ? new Date(schedule.date).toLocaleDateString() : 'N/A'}
                              </p>
                              {schedule.periods && schedule.periods.length > 0 ? (
                                <div className="space-y-2">
                                  {schedule.periods.map((period, pIndex) => (
                                    <div key={pIndex} className="bg-gray-50 p-2 rounded">
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <span className="text-sm text-gray-600">Period:</span>{' '}
                                          <span className="font-medium">{period.periodNumber || 'N/A'}</span>
                                        </div>
                                        <div>
                                          <span className="text-sm text-gray-600">Class:</span>{' '}
                                          <span className="font-medium">{period.assignedClass || 'N/A'}</span>
                                        </div>
                                        <div className="col-span-2">
                                          <span className="text-sm text-gray-600">Substitute Faculty:</span>{' '}
                                          <span className="font-medium">{period.substituteFaculty || 'N/A'}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-500 italic">No periods assigned for this day</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {selectedLeave.status === 'Forwarded by HOD' && (
                      <div className="flex justify-end space-x-4 mt-6">
                        <button
                          onClick={() => {
                            setShowLeaveDetailsModal(false);
                            handleAction(selectedLeave._id, 'approve');
                          }}
                          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setShowLeaveDetailsModal(false);
                            handleAction(selectedLeave._id, 'reject');
                          }}
                          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'ccl-work':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-primary mb-6">CCL Work Requests</h2>
            <div className="bg-secondary rounded-neumorphic shadow-outerRaised p-6">
              <div className="grid grid-cols-1 gap-6">
                {cclWorkRequests.map((work) => (
                  <div key={work._id} className="bg-background p-4 rounded-neumorphic shadow-innerSoft">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-primary">{work.employee.name}</h3>
                        <p className="text-gray-600">{work.employee.department?.name}</p>
                        <p className="text-gray-600">Type: {work.type}</p>
                        <p className="text-gray-600">Description: {work.description}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleCCLWorkAction(work._id, 'approve')}
                          className="bg-green-500 text-white px-4 py-2 rounded-neumorphic
                                   hover:shadow-innerSoft transition-all duration-300"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleCCLWorkAction(work._id, 'reject')}
                          className="bg-red-500 text-white px-4 py-2 rounded-neumorphic
                                   hover:shadow-innerSoft transition-all duration-300"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (shouldRedirect) {
    return null;
  }

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
    <div className="min-h-screen bg-background">
      <PrincipalSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      <div className="lg:ml-64 min-h-screen">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg m-4">
            {error}
          </div>
        )}
        <div className="p-4 lg:p-6">
          {renderContent()}
        </div>
      </div>

      {/* Create HOD Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-secondary rounded-neumorphic shadow-outerRaised p-4 lg:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl lg:text-2xl font-bold text-primary mb-6">
              Create New HOD
            </h2>
            
            <form onSubmit={handleCreateHOD}>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full p-2 lg:p-3 rounded-neumorphic shadow-innerSoft bg-background
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
                    className="w-full p-2 lg:p-3 rounded-neumorphic shadow-innerSoft bg-background
                             focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    HOD ID (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.HODId}
                    onChange={(e) => setFormData({...formData, HODId: e.target.value})}
                    className="w-full p-2 lg:p-3 rounded-neumorphic shadow-innerSoft bg-background
                             focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Leave empty to use email as ID"
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
                    className="w-full p-2 lg:p-3 rounded-neumorphic shadow-innerSoft bg-background
                             focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Branch
                  </label>
                  <select
                    value={formData.branchCode}
                    onChange={(e) => setFormData({...formData, branchCode: e.target.value})}
                    className="w-full p-2 lg:p-3 rounded-neumorphic shadow-innerSoft bg-background
                             focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select a branch</option>
                    {Object.keys(BRANCH_NAMES).map((branch) => (
                      <option key={branch} value={branch}>
                        {BRANCH_NAMES[branch]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-gray-500 text-white px-3 lg:px-4 py-2 rounded-neumorphic
                           hover:shadow-innerSoft transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary text-white px-3 lg:px-4 py-2 rounded-neumorphic
                           hover:shadow-innerSoft transition-all duration-300"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit HOD Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-4 lg:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg lg:text-xl font-bold mb-4">Edit HOD Details</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="mt-1 block w-full p-2 lg:p-3 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="mt-1 block w-full p-2 lg:p-3 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="text"
                    value={editForm.phoneNumber}
                    onChange={(e) => setEditForm({...editForm, phoneNumber: e.target.value})}
                    className="mt-1 block w-full p-2 lg:p-3 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department Code</label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={(e) => setEditForm({...editForm, department: e.target.value})}
                    className="mt-1 block w-full p-2 lg:p-3 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                    className="mt-1 block w-full p-2 lg:p-3 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-gray-200 text-gray-700 px-3 lg:px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary text-white px-3 lg:px-4 py-2 rounded-md hover:bg-primary-dark"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      <HodPasswordResetModal
        show={showPasswordResetModal}
        onClose={() => {
          setShowPasswordResetModal(false);
          setSelectedHod(null);
        }}
        hod={selectedHod}
        token={token}
        loading={loading}
        setLoading={setLoading}
      />

      {/* Remarks Modal */}
      <RemarksModal
        show={showRemarksModal}
        onClose={() => {
          setShowRemarksModal(false);
          setSelectedAction(null);
          setSelectedRequestId(null);
        }}
        onSubmit={handleRemarksSubmit}
        action={selectedAction}
      />

      {/* CCL Work Request Remarks Modal */}
      {showCCLRemarksModal && selectedCCLWork && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-4 lg:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Review CCL Work Request
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remarks
              </label>
              <textarea
                value={cclRemarks}
                onChange={(e) => setCclRemarks(e.target.value)}
                rows="3"
                className="w-full p-2 lg:p-3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter your remarks..."
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setSelectedCCLWork(null);
                  setCclRemarks('');
                  setShowCCLRemarksModal(false);
                }}
                className="px-3 lg:px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCCLWorkAction('Approved')}
                className="px-3 lg:px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
              >
                Approve
              </button>
              <button
                onClick={() => handleCCLWorkAction('Rejected')}
                className="px-3 lg:px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrincipalDashboard; 