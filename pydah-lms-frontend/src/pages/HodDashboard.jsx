import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import HodLeaveForm from "../components/HodLeaveForm";
import PasswordResetModal from "../components/PasswordResetModal";
import RemarksModal from "../components/RemarksModal";
import { toast } from 'react-toastify';
import { createAuthAxios } from '../utils/authAxios';
import config from '../config';

const API_BASE_URL = config.API_BASE_URL;

const HodDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [hod, setHod] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [hodLeaveRequests, setHodLeaveRequests] = useState([]);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(false);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    designation: '',
    status: ''
  });
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [selectedEmployeeForReset, setSelectedEmployeeForReset] = useState(null);
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [cclWorkRequests, setCclWorkRequests] = useState([]);
  const [selectedCCLWork, setSelectedCCLWork] = useState(null);
  const [showCCLRemarksModal, setShowCCLRemarksModal] = useState(false);
  const [cclRemarks, setCclRemarks] = useState('');

  const navigate = useNavigate();
  const campus = localStorage.getItem('campus');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${API_BASE_URL}/hod/dashboard`,
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('Dashboard data:', response.data);
        
        if (!response.data || !response.data.hod) {
          throw new Error('Invalid dashboard data received');
        }

        setDashboardData(response.data);
        setHod(response.data.hod);
        setLeaveRequests(response.data.departmentLeaves);
        setHodLeaveRequests(response.data.hod.hodLeaveRequests || []);
        setEmployees(response.data.employees || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        const errorMessage = error.response?.data?.msg || error.message || 'Failed to fetch dashboard data';
        setError(errorMessage);
        toast.error(errorMessage);
        
        if (error.response?.status === 401 || error.response?.status === 403) {
          handleLogout();
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [refreshTrigger, token, navigate]);

  const fetchCCLWorkRequests = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      console.log('Fetching CCL work requests...');
      const authAxios = createAuthAxios(token);
      const response = await authAxios.get('/hod/ccl-work-requests');
      console.log('CCL work requests response:', response.data);
      
      if (response.data && response.data.success && response.data.data) {
        setCclWorkRequests(response.data.data);
      } else {
        console.log('No CCL work requests found or invalid response format');
        setCclWorkRequests([]);
      }
    } catch (error) {
      console.error('Error fetching CCL work requests:', error);
      toast.error('Failed to fetch CCL work requests');
      setCclWorkRequests([]);
    }
  }, []);

  useEffect(() => {
    fetchCCLWorkRequests();
  }, [fetchCCLWorkRequests]);

  const handleCCLWorkApproval = async (workId, status) => {
      try {
      console.log('Updating CCL work request:', { workId, status });
      
      const remarks = status === 'Forwarded to Principal' 
        ? 'Forwarded to Principal for approval'
        : 'Rejected by HOD';

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication token not found');
        return;
      }

      const response = await axios.put(
        `${API_BASE_URL}/hod/ccl-work-requests/${workId}`,
        { status, remarks },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('CCL work request update response:', response.data);

      if (response.data.success) {
        setCclWorkRequests(prevRequests => 
          prevRequests.map(request => 
            request._id === workId 
              ? { 
                  ...request, 
                  status, 
                  hodRemarks: remarks,
                  hodApprovalDate: new Date().toISOString()
                }
              : request
          )
        );
        toast.success(response.data.message);
      }
      } catch (error) {
      console.error('Error updating CCL work request:', error);
      toast.error(error.response?.data?.message || 'Failed to update CCL work request');
        }
  };

  const handleAction = async (status) => {
    try {
      setLoading(true);
      if (!selectedLeave) return;
  
      const response = await axios.put(
        `${API_BASE_URL}/hod/leaves/${selectedLeave.employeeId}/${selectedLeave._id}`,
        {
          action: status === "Forwarded" ? "forward" : "reject",
          remarks: remarks || (status === "Forwarded" ? "Forwarded to Principal" : "Rejected by HOD")
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      if (response.data) {
        // Update the leave request in the state
        setLeaveRequests((prev) =>
          prev.map((leave) =>
            leave._id === selectedLeave._id 
              ? { 
                  ...leave, 
                  status: status === "Forwarded" ? "Forwarded by HOD" : "Rejected",
                  hodRemarks: remarks || (status === "Forwarded" ? "Forwarded to Principal" : "Rejected by HOD"),
                  hodApprovalDate: new Date().toISOString()
                } 
              : leave
          )
        );
  
        setSelectedLeave(null);
        setRemarks("");
        setShowRemarksModal(false);
        setRefreshTrigger(prev => !prev);
        toast.success(response.data.msg || 'Leave request updated successfully');
      }
    } catch (error) {
      console.error('Error updating leave request:', error);
      const errorMsg = error.response?.data?.msg || 'Failed to update leave request';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRemarksSubmit = (remarks) => {
    setRemarks(remarks);
    handleAction(selectedAction === 'forward' ? "Forwarded" : "Rejected");
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('campus');
    localStorage.removeItem('branchCode');
    navigate('/');
  };

  const handleEditClick = (employee) => {
    setSelectedEmployee(employee);
    setEditForm({
      name: employee.name,
      email: employee.email,
      phoneNumber: employee.phoneNumber,
      designation: employee.designation,
      status: employee.status
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate email format
      const emailRegex = /^[^\s@]{5,}@[^\s@]{2,}\.[^\s@]{2,}$/;
      if (!emailRegex.test(editForm.email)) {
        toast.error('Please enter a valid email address');
        return;
      }

      // Validate phone number
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(editForm.phoneNumber)) {
        toast.error('Please enter a valid 10-digit phone number');
        return;
      }

      setLoading(true);
      const response = await axios.put(
        `${API_BASE_URL}/hod/employees/${selectedEmployee.employeeId}`,
        editForm,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Update employees list with the returned data
      setEmployees(prevEmployees => 
        prevEmployees.map(emp => 
          emp.employeeId === selectedEmployee.employeeId 
            ? response.data.employee 
            : emp
        )
      );

      setShowEditModal(false);
      toast.success(response.data.msg || 'Employee details updated successfully');
    } catch (error) {
      console.error('Error updating employee:', error);
      const errorMsg = error.response?.data?.msg || 'Failed to update employee details';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = (employeeId) => {
    setSelectedEmployeeForReset(employeeId);
    setShowPasswordResetModal(true);
  };

  const handleCCLWorkAction = async (status) => {
    try {
      if (!selectedCCLWork) return;

      const response = await axios.put(
        `http://localhost:5000/api/hod/ccl-work-requests/${selectedCCLWork._id}`,
        {
          status,
          remarks: cclRemarks || `${status} by HOD`
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data) {
        // Update the CCL work request in the state
        setCclWorkRequests(prev =>
          prev.map(work =>
            work._id === selectedCCLWork._id
              ? {
                  ...work,
                  status,
                  hodRemarks: cclRemarks || `${status} by HOD`,
                  hodApprovalDate: new Date().toISOString()
                }
              : work
          )
        );

        setSelectedCCLWork(null);
        setCclRemarks('');
        setShowCCLRemarksModal(false);
        toast.success(response.data.msg || 'CCL work request updated successfully');
      }
    } catch (error) {
      console.error('Error updating CCL work request:', error);
      toast.error(error.response?.data?.msg || 'Failed to update CCL work request');
    }
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
          <div>
            <h1 className="text-3xl font-bold text-primary">
              HOD Dashboard - {campus ? campus.charAt(0).toUpperCase() + campus.slice(1) : ''} Campus
            </h1>
            <p className="text-gray-600 mt-2">
              {hod?.department?.name || hod?.branchCode} Department
            </p>
          </div>
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

        {/* Dashboard Stats */}
        {dashboardData?.stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-secondary p-6 rounded-neumorphic shadow-outerRaised">
              <h3 className="text-lg font-semibold text-primary mb-2">Total Employees</h3>
              <p className="text-3xl font-bold">{dashboardData.stats.totalEmployees}</p>
            </div>
            <div className="bg-secondary p-6 rounded-neumorphic shadow-outerRaised">
              <h3 className="text-lg font-semibold text-primary mb-2">Pending Leaves</h3>
              <p className="text-3xl font-bold">{dashboardData.stats.pendingLeaves}</p>
            </div>
            <div className="bg-secondary p-6 rounded-neumorphic shadow-outerRaised">
              <h3 className="text-lg font-semibold text-primary mb-2">Approved Leaves</h3>
              <p className="text-3xl font-bold">{dashboardData.stats.approvedLeaves}</p>
            </div>
            <div className="bg-secondary p-6 rounded-neumorphic shadow-outerRaised">
              <h3 className="text-lg font-semibold text-primary mb-2">Your Leave Balance</h3>
              <p className="text-3xl font-bold">{hod?.leaveBalance || 12}</p>
            </div>
          </div>
        )}

        {/* CCL Work Requests */}
        <div className="bg-secondary p-6 rounded-neumorphic shadow-outerRaised mb-8">
          <h2 className="text-xl font-semibold text-primary mb-4">CCL Work Requests</h2>
          {cclWorkRequests && cclWorkRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cclWorkRequests.map((request) => (
                    <tr key={request._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{request.employeeName}</div>
                        <div className="text-sm text-gray-500">{request.employeeEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(request.date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.assignedTo}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{request.reason}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                            request.status === 'Forwarded to Principal' ? 'bg-blue-100 text-blue-800' :
                            request.status === 'Approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {request.status === 'Pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleCCLWorkApproval(request._id, 'Forwarded to Principal')}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Forward to Principal
                            </button>
                            <button
                              onClick={() => handleCCLWorkApproval(request._id, 'Rejected')}
                              className="text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No CCL work requests available</p>
          )}
        </div>

        {/* Leave Management Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-primary">Department Leave Requests</h2>
            <button
              onClick={() => setShowLeaveForm(true)}
              className="bg-primary text-white px-4 py-2 rounded-neumorphic
                       hover:shadow-innerSoft transition-all duration-300"
            >
              Apply for Leave
            </button>
          </div>

          <div className="space-y-6">
            {leaveRequests.map((request) => (
              <div
                key={request._id}
                className="bg-secondary p-6 rounded-neumorphic shadow-outerRaised"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-primary mb-2">
                      {request.employeeName || 'Unknown Employee'}
                    </h3>
                    <p className="text-gray-600">Employee ID: {request.employeeEmployeeId || 'N/A'}</p>
                    <p className="text-gray-600">Email: {request.employeeEmail || 'N/A'}</p>
                    <p className="text-gray-600">Department: {request.employeeDepartment || 'N/A'}</p>
                    <p className="text-gray-600">
                      Leave Type: {request.leaveType.charAt(0).toUpperCase() + request.leaveType.slice(1)}
                    </p>
                    <p className="text-gray-600">
                      Duration: {new Date(request.startDate).toLocaleDateString()} to{' '}
                      {new Date(request.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-gray-600">
                      Applied On: {new Date(request.appliedOn).toLocaleDateString()}
                    </p>
                    <p className="text-gray-600">
                      Status: <span className={`font-semibold ${
                        request.status === 'Approved' ? 'text-green-600' :
                        request.status === 'Rejected' ? 'text-red-600' :
                        request.status === 'Forwarded by HOD' ? 'text-blue-600' :
                        'text-yellow-600'
                      }`}>{request.status}</span>
                    </p>
                    {request.isHalfDay && (
                      <p className="text-gray-600">
                        <span className="font-semibold">Half Day Leave</span>
                      </p>
                    )}
                    {request.reason && (
                      <p className="text-gray-600 mt-2">
                        <span className="font-semibold">Reason:</span> {request.reason}
                      </p>
                    )}
                    {request.remarks && (
                      <p className="text-gray-600 mt-2">
                        <span className="font-semibold">Remarks:</span> {request.remarks}
                      </p>
                    )}
                    {request.alternateSchedule && request.alternateSchedule.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-lg font-semibold mb-2">Alternate Schedule</h4>
                        <div className="space-y-4">
                        {request.alternateSchedule.map((schedule, index) => (
                            <div key={index} className="bg-gray-50 p-4 rounded-lg">
                              <div className="mb-2">
                                <span className="font-medium">Date:</span>{' '}
                                {new Date(schedule.date).toLocaleDateString()}
                              </div>
                              {schedule.periods && schedule.periods.length > 0 ? (
                                <div className="space-y-2">
                            {schedule.periods.map((period, pIndex) => (
                                    <div key={pIndex} className="bg-white p-3 rounded-md">
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <span className="font-medium">Period:</span> {period.periodNumber}
                                        </div>
                                        <div>
                                          <span className="font-medium">Class:</span> {period.assignedClass}
                                        </div>
                                        <div className="col-span-2">
                                          <span className="font-medium">Substitute Faculty:</span> {period.substituteFaculty}
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
                  </div>
                  <div className="flex flex-col justify-between">
                {request.status === 'Pending' && (
                      <div className="space-y-2">
                    <button
                      onClick={() => {
                          setSelectedLeave(request);
                            setSelectedAction('forward');
                            setShowRemarksModal(true);
                      }}
                          className="w-full bg-blue-500 text-white px-4 py-2 rounded-neumorphic hover:shadow-innerSoft transition-all"
                    >
                      Forward to Principal
                    </button>
                    <button
                      onClick={() => {
                          setSelectedLeave(request);
                            setSelectedAction('reject');
                            setShowRemarksModal(true);
                      }}
                          className="w-full bg-red-500 text-white px-4 py-2 rounded-neumorphic hover:shadow-innerSoft transition-all"
                    >
                      Reject
                    </button>
                  </div>
                )}
                  </div>
                </div>
              </div>
            ))}

            {leaveRequests.length === 0 && (
              <div className="text-center text-gray-600 py-8">
                No leave requests found in your department
              </div>
            )}
          </div>
        </div>

        {/* HOD's Own Leave Requests */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-primary mb-6">Your Leave Requests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hodLeaveRequests.map((request) => (
              <div
                key={request._id}
                className="bg-secondary p-6 rounded-neumorphic shadow-outerRaised"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-primary">
                    {request.leaveType.charAt(0).toUpperCase() + request.leaveType.slice(1)}
                  </h3>
                  <p className="text-gray-600">
                    {new Date(request.startDate).toLocaleDateString()} to{' '}
                    {new Date(request.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="mb-4">
                  <p className="text-gray-700"><strong>Reason:</strong></p>
                  <p className="text-gray-600">{request.reason}</p>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`px-3 py-1 rounded-full text-white text-sm
                    ${request.status === 'Approved' ? 'bg-green-500' :
                      request.status === 'Rejected' ? 'bg-red-500' :
                      'bg-yellow-500'}`}>
                    {request.status}
                  </span>
                  {request.remarks && (
                    <span className="text-gray-600 text-sm">
                      Remarks: {request.remarks}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {hodLeaveRequests.length === 0 && (
              <div className="text-center text-gray-600 py-8 col-span-3">
                You haven't applied for any leaves yet
              </div>
            )}
          </div>
        </div>

        {/* Employees Table */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-primary mb-6">Department Employees</h2>
          <div className="bg-secondary p-6 rounded-neumorphic shadow-outerRaised overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Employee ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Phone</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Leave Balance</th>
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
                    <td className="px-4 py-3 text-sm text-gray-900">{employee.phoneNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{employee.leaveBalance} days</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold
                        ${employee.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'}`}
                      >
                        {employee.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm space-x-2">
                      <button
                        onClick={() => handleEditClick(employee)}
                        className="bg-blue-500 text-white px-3 py-1 rounded-md text-xs hover:bg-blue-600 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleResetPassword(employee.employeeId)}
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

      {/* Leave Application Form Modal */}
      {showLeaveForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-secondary rounded-neumorphic shadow-outerRaised p-8 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-primary">Apply for Leave</h2>
              <button
                onClick={() => setShowLeaveForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <HodLeaveForm
              onClose={() => {
                setShowLeaveForm(false);
                setRefreshTrigger(prev => !prev);
              }}
              hodId={hod?._id}
            />
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Edit Employee Details</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                  pattern="[^\s@]{5,}@[^\s@]{2,}\.[^\s@]{2,}"
                  title="Please enter a valid email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={editForm.phoneNumber}
                  onChange={(e) => setEditForm({...editForm, phoneNumber: e.target.value})}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                  pattern="[6-9]\d{9}"
                  title="Please enter a valid 10-digit phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Designation <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.designation}
                  onChange={(e) => setEditForm({...editForm, designation: e.target.value})}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 
                    ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      <PasswordResetModal
        show={showPasswordResetModal}
        onClose={() => {
          setShowPasswordResetModal(false);
          setSelectedEmployeeForReset(null);
        }}
        employeeId={selectedEmployeeForReset}
        token={token}
        loading={loading}
        setLoading={setLoading}
      />

      {/* Add RemarksModal */}
      <RemarksModal
        show={showRemarksModal}
        onClose={() => {
          setShowRemarksModal(false);
          setSelectedAction(null);
        }}
        onSubmit={handleRemarksSubmit}
        action={selectedAction}
      />

      {/* CCL Work Request Remarks Modal */}
      {showCCLRemarksModal && selectedCCLWork && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
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
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCCLWorkAction('Approved')}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
              >
                Approve
              </button>
              <button
                onClick={() => handleCCLWorkAction('Rejected')}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
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

export default HodDashboard;
