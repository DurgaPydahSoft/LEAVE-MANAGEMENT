import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { validateEmail } from '../utils/validators';
import { toast } from 'react-toastify';
import HodPasswordResetModal from '../components/HodPasswordResetModal';
import RemarksModal from '../components/RemarksModal';
import PrincipalSidebar from '../components/PrincipalSidebar';
import config from '../config';


const API_BASE_URL = config.API_BASE_URL;

// Add a hook to detect if the screen is mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
}

const PrincipalDashboard = () => {
  const isMobile = useIsMobile();
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
  const [newBranch, setNewBranch] = useState({ name: '', code: '' });
  const [showCreateBranchModal, setShowCreateBranchModal] = useState(false);
  const [showEditBranchModal, setShowEditBranchModal] = useState(false);
  const [editBranchData, setEditBranchData] = useState({ _id: '', name: '', code: '' });
  const [deleteBranchId, setDeleteBranchId] = useState(null);
  const [showDeleteBranchModal, setShowDeleteBranchModal] = useState(false);
  const [showEditEmployeeModal, setShowEditEmployeeModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editEmployeeForm, setEditEmployeeForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    department: '',
    status: ''
  });
  const [leaveFilters, setLeaveFilters] = useState({
    startDate: '',
    endDate: '',
    department: '',
    leaveType: ''
  });

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
        `${API_BASE_URL}/principal/branches`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setBranches(Array.isArray(response.data.branches) ? response.data.branches : []);
    } catch (error) {
      setBranches([]);
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
      // Find the selected branch from branches array
      const selectedBranch = branches.find(branch => branch.code === formData.branchCode);
      if (!selectedBranch) {
        throw new Error('Invalid branch selected');
      }

      await axios.post(
        `${API_BASE_URL}/principal/hods`,
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          HODId: formData.HODId || formData.email.toLowerCase(), // Use email as fallback
          department: {
            name: selectedBranch.name,
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

  // Helper to check if edit form is dirty and valid
  const isEditFormDirty = selectedHod && (
    editForm.name !== selectedHod.name ||
    editForm.email !== selectedHod.email ||
    editForm.phoneNumber !== (selectedHod.phoneNumber || '') ||
    editForm.department !== (selectedHod.department?.code || selectedHod.branchCode || '') ||
    editForm.status !== (selectedHod.status || (selectedHod.isActive ? 'active' : 'inactive'))
  );
  const isEditFormDepartmentValid = branches.some(b => b.code === editForm.department);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!isEditFormDirty || !isEditFormDepartmentValid) return;
    try {
      // Build update payload
      const updatePayload = {
        name: editForm.name,
        email: editForm.email,
        phoneNumber: editForm.phoneNumber,
        status: editForm.status
      };
      // Only include department if it has changed and is valid
      if (
        editForm.department !== (selectedHod.department?.code || selectedHod.branchCode || '') &&
        branches.some(b => b.code === editForm.department)
      ) {
        const branch = branches.find(b => b.code === editForm.department);
        updatePayload.department = {
          name: branch.name,
          code: branch.code,
          campusType: campus.charAt(0).toUpperCase() + campus.slice(1)
        };
      }
      const response = await axios.put(
        `${API_BASE_URL}/principal/hods/${selectedHod._id}?model=${selectedHod.model}`,
        updatePayload,
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

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${API_BASE_URL}/principal/branches`,
        newBranch,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('Branch created successfully');
      setNewBranch({ name: '', code: '' });
      fetchBranches(); // Refresh the branches list
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to create branch');
    }
  };

  const handleEditBranchClick = (branch) => {
    setEditBranchData({ _id: branch._id, name: branch.name, code: branch.code });
    setShowEditBranchModal(true);
  };

  const handleEditBranchSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${API_BASE_URL}/principal/branches/${editBranchData._id}`,
        { name: editBranchData.name, code: editBranchData.code },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Branch updated successfully');
      setShowEditBranchModal(false);
      setEditBranchData({ _id: '', name: '', code: '' });
      fetchBranches();
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to update branch');
    }
  };

  const handleDeleteBranchClick = (branchId) => {
    setDeleteBranchId(branchId);
    setShowDeleteBranchModal(true);
  };

  const handleDeleteBranchConfirm = async () => {
    if (!deleteBranchId) return;
    try {
      await axios.delete(
        `${API_BASE_URL}/principal/branches/${deleteBranchId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Branch deleted successfully');
      setShowDeleteBranchModal(false);
      setDeleteBranchId(null);
      fetchBranches();
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to delete branch');
    }
  };

  const handleEditEmployeeClick = (employee) => {
    setSelectedEmployee(employee);
    setEditEmployeeForm({
      name: employee.name,
      email: employee.email,
      phoneNumber: employee.phoneNumber || '',
      department: employee.branchCode || employee.department || '',
      status: employee.status || 'active'
    });
    setShowEditEmployeeModal(true);
  };

  const handleEditEmployeeSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `${API_BASE_URL}/principal/employees/${selectedEmployee._id}`,
        editEmployeeForm,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Update the employees list
      setEmployees(employees.map(emp => 
        emp._id === selectedEmployee._id ? response.data : emp
      ));

      setShowEditEmployeeModal(false);
      toast.success('Employee details updated successfully');
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error(error.response?.data?.msg || 'Failed to update employee');
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="p-6 mt-4">
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
          <div className="p-6 mt-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-primary">HOD Management</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-primary text-white px-4 py-2 rounded-neumorphic hover:shadow-innerSoft transition-all duration-300"
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
                            <span>{hod.department?.code || hod.branchCode || 'Unknown'}</span>
                            <div className="hidden group-hover:block absolute z-10 bg-black text-white text-xs rounded py-1 px-2 left-0 -bottom-8">
                              {branches.find(b => b.code === (hod.department?.code || hod.branchCode))?.name || hod.department?.name || 'Unknown'}
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

      case 'branches':
        return (
          <div className="p-6 mt-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-primary">Branch Management</h2>
              <button
                onClick={() => setShowCreateBranchModal(true)}
                className="bg-primary text-white px-4 py-2 rounded-neumorphic hover:shadow-innerSoft transition-all duration-300"
              >
                Create Branch
              </button>
            </div>
            <div className="bg-secondary rounded-neumorphic shadow-outerRaised p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg overflow-hidden">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Branch Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Branch Code</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">HOD</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {branches.map((branch) => (
                      <tr key={branch._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{branch.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{branch.code}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold
                            ${branch.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                          >
                            {branch.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {branch.hodId ? (
                            hods.find(hod => hod._id === branch.hodId)?.name || 'N/A'
                          ) : 'No HOD Assigned'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => handleEditBranchClick(branch)}
                            className="bg-blue-500 text-white px-3 py-1 rounded-md text-xs hover:bg-blue-600 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteBranchClick(branch._id)}
                            className="bg-red-500 text-white px-3 py-1 rounded-md text-xs hover:bg-red-600 transition-colors ml-2"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Edit Branch Modal */}
            {showEditBranchModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                  <h3 className="text-lg font-semibold text-primary mb-4">Edit Branch</h3>
                  <form onSubmit={handleEditBranchSubmit} className="space-y-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">Branch Name</label>
                      <input
                        type="text"
                        value={editBranchData.name}
                        onChange={e => setEditBranchData({ ...editBranchData, name: e.target.value })}
                        className="w-full p-2 rounded-neumorphic shadow-innerSoft bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">Branch Code</label>
                      <input
                        type="text"
                        value={editBranchData.code}
                        onChange={e => setEditBranchData({ ...editBranchData, code: e.target.value })}
                        className="w-full p-2 rounded-neumorphic shadow-innerSoft bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setShowEditBranchModal(false)} className="bg-gray-500 text-white px-3 py-2 rounded-neumorphic">Cancel</button>
                      <button type="submit" className="bg-primary text-white px-4 py-2 rounded-neumorphic hover:shadow-innerSoft transition-all duration-300">Save Changes</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {/* Delete Branch Modal */}
            {showDeleteBranchModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                  <h3 className="text-lg font-semibold text-primary mb-4">Delete Branch</h3>
                  <p>Are you sure you want to delete this branch? This action cannot be undone.</p>
                  <div className="flex justify-end gap-2 mt-6">
                    <button type="button" onClick={() => setShowDeleteBranchModal(false)} className="bg-gray-500 text-white px-3 py-2 rounded-neumorphic">Cancel</button>
                    <button type="button" onClick={handleDeleteBranchConfirm} className="bg-red-600 text-white px-4 py-2 rounded-neumorphic hover:shadow-innerSoft transition-all duration-300">Delete</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'employees':
        return (
          <div className="p-6 mt-4">
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
                  {branches.map((branch) => (
                    <option key={branch.code} value={branch.code}>{branch.name}</option>
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
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
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
                              {branches.find(b => b.code === (employee.branchCode || employee.department))?.name || employee.department}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}
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
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => handleEditEmployeeClick(employee)}
                            className="bg-blue-500 text-white px-3 py-1 rounded-md text-xs hover:bg-blue-600 transition-colors"
                          >
                            Edit
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

      case 'leaves':
        return (
          <div className="p-6 mt-4 ">
            <h2 className="text-2xl font-bold text-primary mb-6">Leave Requests</h2>
            <div className="bg-secondary rounded-neumorphic shadow-outerRaised p-6">
              {/* Filter UI for leaves */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                  <input
                    type="date"
                    value={leaveFilters.startDate}
                    onChange={e => setLeaveFilters({ ...leaveFilters, startDate: e.target.value })}
                    className="w-full p-2 rounded-neumorphic shadow-innerSoft bg-background border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                  <input
                    type="date"
                    value={leaveFilters.endDate}
                    onChange={e => setLeaveFilters({ ...leaveFilters, endDate: e.target.value })}
                    className="w-full p-2 rounded-neumorphic shadow-innerSoft bg-background border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={leaveFilters.department}
                    onChange={e => setLeaveFilters({ ...leaveFilters, department: e.target.value })}
                    className="w-full p-2 rounded-neumorphic shadow-innerSoft bg-background border border-gray-300"
                  >
                    <option value="">All Departments</option>
                    {branches.map(branch => (
                      <option key={branch.code} value={branch.code}>{branch.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type of Leave</label>
                  <select
                    value={leaveFilters.leaveType}
                    onChange={e => setLeaveFilters({ ...leaveFilters, leaveType: e.target.value })}
                    className="w-full p-2 rounded-neumorphic shadow-innerSoft bg-background border border-gray-300"
                  >
                    <option value="">All Types</option>
                    <option value="casual">Casual</option>
                    <option value="sick">Sick</option>
                    <option value="earned">Earned</option>
                    <option value="ccl">CCL</option>
                    <option value="on_duty">On Duty</option>
                    <option value="maternity">Maternity</option>
                    <option value="paternity">Paternity</option>
                    {/* Add more leave types as needed */}
                  </select>
                </div>
              </div>
              {/* Responsive Table for md+ screens, Cards for small screens */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg overflow-hidden">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Request ID</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Emp ID</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Leave Type</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Dates</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {forwardedLeaves.map((leave) => (
                      <tr key={leave._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-primary">{leave.leaveRequestId}</td>
                        <td className="px-4 py-3">{leave.employee?.name || leave.employeeName || 'Unknown'}</td>
                        <td className="px-4 py-3">{leave.employee?.employeeId || leave.employeeEmployeeId || 'N/A'}</td>
                        <td className="px-4 py-3">{leave.type ? leave.type.charAt(0).toUpperCase() + leave.type.slice(1) : leave.leaveType ? leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1) : 'N/A'}</td>
                        <td className="px-4 py-3">{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold
                            ${leave.status === 'Approved' ? 'bg-green-100 text-green-800' :
                              leave.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                              leave.status === 'Forwarded by HOD' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'}`}
                          >
                            {leave.status || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            className="bg-primary text-white px-3 py-1 rounded-md text-xs hover:bg-primary-dark transition-colors"
                            onClick={() => {
                              setSelectedLeave(leave);
                              setShowLeaveDetailsModal(true);
                            }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Card layout for small screens */}
              <div className="md:hidden grid grid-cols-1 gap-4">
                {forwardedLeaves.map((leave) => (
                  <div
                    key={leave._id}
                    className="bg-white p-4 rounded-lg shadow-innerSoft border border-gray-100"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-mono text-primary text-sm">{leave.leaveRequestId}</span>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold
                        ${leave.status === 'Approved' ? 'bg-green-100 text-green-800' :
                          leave.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                          leave.status === 'Forwarded by HOD' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'}`}
                      >
                        {leave.status || 'N/A'}
                      </span>
                    </div>
                    <div className="mb-1 text-sm"><span className="font-semibold">Name:</span> {leave.employee?.name || leave.employeeName || 'Unknown'}</div>
                    <div className="mb-1 text-sm"><span className="font-semibold">Emp ID:</span> {leave.employee?.employeeId || leave.employeeEmployeeId || 'N/A'}</div>
                    <div className="mb-1 text-sm"><span className="font-semibold">Leave Type:</span> {leave.type ? leave.type.charAt(0).toUpperCase() + leave.type.slice(1) : leave.leaveType ? leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1) : 'N/A'}</div>
                    <div className="mb-1 text-sm"><span className="font-semibold">Dates:</span> {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</div>
                    <div className="flex justify-end mt-2">
                      <button
                        className="bg-primary text-white px-3 py-1 rounded-md text-xs hover:bg-primary-dark transition-colors"
                        onClick={() => {
                          setSelectedLeave(leave);
                          setShowLeaveDetailsModal(true);
                        }}
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Leave Details Modal */}
            {showLeaveDetailsModal && selectedLeave && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
                <div className="bg-white rounded-lg shadow-xl p-3 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg sm:text-xl font-bold text-primary">Leave Request Details</h3>
                    <button
                      onClick={() => setSelectedLeave(null)}
                      className="text-gray-500 hover:text-gray-700 p-1"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    
                    {/* Employee Information */}
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Employee Information</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Name</p>
                          <p className="font-medium text-sm sm:text-base">{selectedLeave.employee?.name || selectedLeave.employeeName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Employee ID</p>
                          <p className="font-medium text-sm sm:text-base">{selectedLeave.employee?.employeeId || selectedLeave.employeeEmployeeId}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium text-sm sm:text-base break-words">{selectedLeave.employee?.email || selectedLeave.employeeEmail}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Department</p>
                          <p className="font-medium text-sm sm:text-base">{selectedLeave.employee?.department?.name || selectedLeave.employeeDepartment}</p>
                        </div>
                      </div>
                    </div>
                    {/* Leave Details */}
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Leave Details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <p className="text-gray-600">Request ID</p>
                          <p className="font-mono text-base text-primary">{selectedLeave.leaveRequestId}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Leave Type</p>
                          <p className="font-medium text-sm sm:text-base">
                            {selectedLeave.type ? selectedLeave.type.charAt(0).toUpperCase() + selectedLeave.type.slice(1) : selectedLeave.leaveType ? selectedLeave.leaveType.charAt(0).toUpperCase() + selectedLeave.leaveType.slice(1) : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Duration</p>
                          <p className="font-medium text-sm sm:text-base">
                            {new Date(selectedLeave.startDate).toLocaleDateString()} to {new Date(selectedLeave.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Applied On</p>
                          <p className="font-medium text-sm sm:text-base">
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
                          <div className="col-span-1 sm:col-span-2">
                            <p className="text-sm text-gray-600">Half Day Leave</p>
                          </div>
                        )}
                        <div className="col-span-1 sm:col-span-2">
                          <p className="text-sm text-gray-600">Reason</p>
                          <p className="font-medium text-sm sm:text-base">{selectedLeave.reason || 'No reason provided'}</p>
                        </div>
                      </div>
                    </div>
                    {/* Remarks */}
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Remarks</h4>
                      <div className="space-y-2">
                        {selectedLeave.hodRemarks && (
                          <div>
                            <p className="text-sm text-gray-600">HOD Remarks</p>
                            <p className="font-medium text-sm sm:text-base">{selectedLeave.hodRemarks}</p>
                          </div>
                        )}
                        {selectedLeave.principalRemarks && (
                          <div>
                            <p className="text-sm text-gray-600">Principal Remarks</p>
                            <p className="font-medium text-sm sm:text-base">{selectedLeave.principalRemarks}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Alternate Schedule */}
                    {selectedLeave.alternateSchedule && selectedLeave.alternateSchedule.length > 0 && (
                      <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">Alternate Schedule</h4>
                        <div className="space-y-3 sm:space-y-4">
                          {selectedLeave.alternateSchedule.map((schedule, index) => (
                            <div key={index} className="bg-white p-2 sm:p-3 rounded-md">
                              <p className="font-medium text-sm sm:text-base mb-2">
                                Date: {schedule.date ? new Date(schedule.date).toLocaleDateString() : 'N/A'}
                              </p>
                              {schedule.periods && schedule.periods.length > 0 ? (
                                <div className="space-y-2">
                                  {schedule.periods.map((period, pIndex) => (
                                    <div key={pIndex} className="bg-gray-50 p-2 rounded">
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <div>
                                          <span className="text-sm text-gray-600">Period:</span>{' '}
                                          <span className="font-medium text-sm sm:text-base">{period.periodNumber || 'N/A'}</span>
                                        </div>
                                        <div>
                                          <span className="text-sm text-gray-600">Class:</span>{' '}
                                          <span className="font-medium text-sm sm:text-base">{period.assignedClass || 'N/A'}</span>
                                        </div>
                                        <div className="col-span-1 sm:col-span-2">
                                          <span className="text-sm text-gray-600">Substitute Faculty:</span>{' '}
                                          <span className="font-medium text-sm sm:text-base">
                                            {typeof period.substituteFaculty === 'object' && period.substituteFaculty?.name
                                              ? period.substituteFaculty.name
                                              : period.substituteFacultyName
                                                ? period.substituteFacultyName
                                                : (typeof period.substituteFaculty === 'string' && period.substituteFaculty)
                                                  ? period.substituteFaculty
                                                  : 'N/A'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-500 italic text-sm sm:text-base">No periods assigned for this day</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cclWorkRequests.map((work) => (
                <div
                  key={work._id}
                  className="bg-secondary p-6 rounded-neumorphic shadow-outerRaised hover:shadow-innerSoft transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-primary">
                        {work.employee?.name || work.employeeName || 'Unknown Employee'}
                      </h3>
                      <p className="text-sm text-gray-600">ID: {work.employee?.employeeId || work.employeeEmployeeId || 'N/A'}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold
                      ${work.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        work.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                        work.status === 'Forwarded to Principal' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'}`}
                    >
                      {work.status || 'Pending'}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-700">
                      <span className="font-medium">Date:</span> {work.date ? new Date(work.date).toLocaleDateString() : 'N/A'}
                    </p>
                    {work.assignedTo && (
                      <p className="text-gray-700">
                        <span className="font-medium">Assigned To:</span> {work.assignedTo}
                      </p>
                    )}
                    <p className="text-gray-700">
                      <span className="font-medium">Reason:</span> {work.reason || 'N/A'}
                    </p>
                    {work.hodRemarks && (
                      <p className="text-gray-700">
                        <span className="font-medium">HOD Remarks:</span> {work.hodRemarks}
                      </p>
                    )}
                  </div>
                  {work.status === 'Forwarded to Principal' && (
                    <div className="mt-4 flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedCCLWork(work);
                          setCclRemarks('');
                          setShowCCLRemarksModal(true);
                        }}
                        className="flex-1 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCCLWork(work);
                          setCclRemarks('');
                          setShowCCLRemarksModal(true);
                        }}
                        className="flex-1 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
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
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-primary">Create New HOD</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateHOD} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-1">HOD ID <span className="text-gray-400 text-xs">(optional)</span></label>
                  <input
                    type="text"
                    value={formData.HODId}
                    onChange={(e) => setFormData({...formData, HODId: e.target.value})}
                    className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition"
                    placeholder="Leave empty to use email as ID"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-1">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-gray-700 text-sm font-semibold mb-1">Branch</label>
                  <select
                    value={formData.branchCode}
                    onChange={(e) => setFormData({...formData, branchCode: e.target.value})}
                    className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition"
                    required
                  >
                    <option value="">Select a branch</option>
                    {(branches || []).map((branch) => (
                      <option key={branch._id || branch.code} value={branch.code}>
                        {isMobile ? branch.code : `${branch.name} (${branch.code})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
                  {error}
                </div>
              )}
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-primary-dark transition"
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
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <select
                    value={editForm.department}
                    onChange={(e) => setEditForm({...editForm, department: e.target.value})}
                    className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition"
                    required
                  >
                    <option value="">Select a branch</option>
                    {branches.filter(b => b.isActive).map(branch => (
                      <option key={branch.code} value={branch.code}>
                        {isMobile
                          ? branch.code
                          : `${branch.name} (${branch.code})`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                    className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition"
                    required
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
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`bg-primary text-white px-3 lg:px-4 py-2 rounded-md hover:bg-primary-dark ${(!isEditFormDirty || !isEditFormDepartmentValid) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!isEditFormDirty || !isEditFormDepartmentValid}
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

      {/* Create Branch Modal */}
      {showCreateBranchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-primary mb-4">Create New Branch</h3>
            <form onSubmit={e => { handleCreateBranch(e); setShowCreateBranchModal(false); }} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Branch Name</label>
                <input
                  type="text"
                  value={newBranch.name}
                  onChange={e => setNewBranch({ ...newBranch, name: e.target.value })}
                  className="w-full p-2 rounded-neumorphic shadow-innerSoft bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Branch Code</label>
                <input
                  type="text"
                  value={newBranch.code}
                  onChange={e => setNewBranch({ ...newBranch, code: e.target.value })}
                  className="w-full p-2 rounded-neumorphic shadow-innerSoft bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowCreateBranchModal(false)} className="bg-gray-500 text-white px-3 py-2 rounded-neumorphic">Cancel</button>
                <button type="submit" className="bg-primary text-white px-4 py-2 rounded-neumorphic hover:shadow-innerSoft transition-all duration-300">Create Branch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditEmployeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-primary">Edit Employee Details</h3>
              <button
                onClick={() => setShowEditEmployeeModal(false)}
                className="text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleEditEmployeeSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-1">Name</label>
                <input
                  type="text"
                  value={editEmployeeForm.name}
                  onChange={(e) => setEditEmployeeForm({...editEmployeeForm, name: e.target.value})}
                  className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-1">Email</label>
                <input
                  type="email"
                  value={editEmployeeForm.email}
                  onChange={(e) => setEditEmployeeForm({...editEmployeeForm, email: e.target.value})}
                  className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editEmployeeForm.phoneNumber}
                  onChange={(e) => setEditEmployeeForm({...editEmployeeForm, phoneNumber: e.target.value})}
                  className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-1">Department</label>
                <select
                  value={editEmployeeForm.department}
                  onChange={(e) => setEditEmployeeForm({...editEmployeeForm, department: e.target.value})}
                  className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition"
                  required
                >
                  <option value="">Select a department</option>
                  {branches.map((branch) => (
                    <option key={branch.code} value={branch.code}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-1">Status</label>
                <select
                  value={editEmployeeForm.status}
                  onChange={(e) => setEditEmployeeForm({...editEmployeeForm, status: e.target.value})}
                  className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition"
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditEmployeeModal(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-primary-dark transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrincipalDashboard; 