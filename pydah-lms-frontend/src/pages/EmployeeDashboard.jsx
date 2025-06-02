import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from 'react-toastify';
import LeaveApplicationForm from "../components/LeaveApplicationForm";
import CCLRequestForm from "../components/CCLRequestForm";
import CCLWorkRequestForm from '../components/CCLWorkRequestForm';
import { createAuthAxios } from '../utils/authAxios';
import config from '../config';

const API_BASE_URL = config.API_BASE_URL;

const EmployeeDashboard = () => {
  const [employee, setEmployee] = useState(null);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showCCLForm, setShowCCLForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [cclHistory, setCclHistory] = useState([]);
  const [cclWork, setCclWork] = useState([]);
  const [cclWorkHistory, setCclWorkHistory] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState(null);

  const navigate = useNavigate();

  const fetchEmployee = useCallback(async () => {
    const token = localStorage.getItem('token');
    const employeeId = localStorage.getItem('employeeId');

    if (!token || !employeeId) {
      navigate('/login', { replace: true });
      return;
    }

    try {
      const authAxios = createAuthAxios(token);
      const response = await authAxios.get(`/employee/${employeeId}`);

      if (response.data) {
        setEmployee(response.data);
        // Sort leave requests by date, most recent first
        const sortedLeaves = (response.data.leaveRequests || []).sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setLeaveHistory(sortedLeaves);
        setError('');
      }
    } catch (error) {
      console.error('Error fetching employee details:', error);
      const errorMsg = error.response?.data?.message || 'Failed to fetch employee details';
      setError(errorMsg);
      toast.error(errorMsg);
      
      if (error.response?.status === 401) {
        localStorage.clear();
        navigate('/login', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const fetchCCLHistory = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const authAxios = createAuthAxios(token);
      const response = await authAxios.get('/employee/ccl-history');
      if (response.data.success) {
        setCclHistory(response.data.data.cclHistory || []);
        setCclWork(response.data.data.cclWork || []);
      }
    } catch (error) {
      console.error('Error fetching CCL history:', error);
      toast.error('Failed to fetch CCL history');
    }
  }, []);

  const fetchCclWorkHistory = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const authAxios = createAuthAxios(token);
      const response = await authAxios.get('/employee/ccl-work-history');
      console.log('CCL Work History Response:', response.data); // Debug log
      
      if (response.data.success) {
        const workHistory = response.data.data || [];
        console.log('Setting CCL Work History:', workHistory); // Debug log
        setCclWorkHistory(workHistory);
      }
    } catch (error) {
      console.error('Error fetching CCL work history:', error);
      toast.error('Failed to fetch CCL work history');
    }
  }, []);

  useEffect(() => {
    fetchEmployee();
    fetchCCLHistory();
    fetchCclWorkHistory();
  }, [fetchEmployee, fetchCCLHistory, fetchCclWorkHistory]);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.clear();
      navigate('/login', { replace: true });
    }
  };

  const handleLeaveSubmit = (newLeaveRequest) => {
    setLeaveHistory(prev => [newLeaveRequest, ...prev]);
    setShowLeaveForm(false);
  };

  const handleCCLSubmit = async (newCCLWork) => {
    try {
      // Close the form
      setShowCCLForm(false);
      
      // Show success message
      toast.success('CCL work request submitted successfully');
      
      // Refresh both CCL history and work history
      await Promise.all([
        fetchCCLHistory(),
        fetchCclWorkHistory()
      ]);
    } catch (error) {
      console.error('Error handling CCL submission:', error);
      toast.error('Failed to refresh CCL history');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-primary rounded-2xl animate-spin"></div>
          <p className="mt-4 text-lg font-semibold text-gray-700">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-2 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-secondary rounded-neumorphic shadow-outerRaised p-6 gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-primary mb-1">Welcome, {employee?.name}</h1>
            <p className="text-gray-600 text-sm">
              Employee ID: <span className="font-medium">{employee?.employeeId}</span> | Department: <span className="font-medium">{employee?.department}</span>
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6 flex items-center gap-4">
            <div className="bg-primary/10 rounded-full p-3">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#3B82F6" opacity="0.2"/><path d="M8 12h8M12 8v8" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-primary">Leave Balance</h2>
              <div className="text-2xl font-bold text-gray-800">{employee?.leaveBalance || 0} days</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 flex items-center gap-4">
            <div className="bg-green-500/10 rounded-full p-3">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#22C55E" opacity="0.2"/><path d="M8 12h8" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-green-600">CCL Balance</h2>
              <div className="text-2xl font-bold text-gray-800">{employee?.cclBalance || 0} days</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setShowLeaveForm(true)}
            className="w-full px-6 py-3 bg-primary text-white rounded-lg shadow hover:bg-primary-dark transition-colors text-lg font-semibold"
          >
            Apply for Leave
          </button>
          <button
            onClick={() => setShowCCLForm(true)}
            className="w-full px-6 py-3 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 transition-colors text-lg font-semibold"
          >
            Submit CCL Work
          </button>
        </div>

        {/* CCL Work History */}
        <div className="bg-secondary rounded-neumorphic shadow-outerRaised p-6">
          <h2 className="text-xl font-semibold text-primary mb-4">CCL Work History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HOD Remarks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Principal Remarks</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cclWorkHistory && cclWorkHistory.length > 0 ? (
                  cclWorkHistory.map((work) => (
                    <tr key={work._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {work.date ? new Date(work.date).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'short', day: 'numeric'
                        }) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {work.assignedTo || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {work.reason || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${work.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                            work.status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'}`}>
                          {work.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {work.hodRemarks || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {work.principalRemarks || '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                      No CCL work history found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Leave History */}
        <div className="bg-secondary rounded-neumorphic shadow-outerRaised p-6">
          <h2 className="text-xl font-semibold text-primary mb-4">Leave History</h2>
          {leaveHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied On</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaveHistory.map((leave, index) => (
                    <tr key={index} className="cursor-pointer hover:bg-blue-50 transition" onClick={() => setSelectedLeave(leave)}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{leave.leaveType}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                        {leave.isHalfDay && ' (Half Day)'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${leave.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                            leave.status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'}`}>
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(leave.appliedOn).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No leave history available</p>
          )}
        </div>

        {/* Leave Details Modal */}
        {selectedLeave && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-primary">Leave Request Details</h3>
                <button
                  onClick={() => setSelectedLeave(null)}
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
                      <p className="font-medium">{employee?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Employee ID</p>
                      <p className="font-medium">{employee?.employeeId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{employee?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Department</p>
                      <p className="font-medium">{employee?.department}</p>
                    </div>
                  </div>
                </div>
                {/* Leave Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Leave Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Leave Type</p>
                      <p className="font-medium">{selectedLeave.leaveType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Duration</p>
                      <p className="font-medium">{new Date(selectedLeave.startDate).toLocaleDateString()} to {new Date(selectedLeave.endDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Applied On</p>
                      <p className="font-medium">{selectedLeave.appliedOn ? new Date(selectedLeave.appliedOn).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold
                        ${selectedLeave.status === 'Approved' ? 'bg-green-100 text-green-800' :
                          selectedLeave.status === 'Rejected' ? 'bg-red-100 text-red-800' :
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
                {(selectedLeave.hodRemarks || selectedLeave.principalRemarks) && (
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
                )}
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
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Leave Application Form Modal */}
      {showLeaveForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <LeaveApplicationForm
              onSubmit={handleLeaveSubmit}
              onClose={() => setShowLeaveForm(false)}
              employee={employee}
              loading={loading}
            />
          </div>
        </div>
      )}

      {/* CCL Request Form Modal */}
      {showCCLForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <CCLWorkRequestForm
              onSubmit={handleCCLSubmit}
              onClose={() => setShowCCLForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
