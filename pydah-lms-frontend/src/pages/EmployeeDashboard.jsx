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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
      {/* Header */}
        <div className="bg-secondary p-6 rounded-neumorphic shadow-outerRaised mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-primary">Welcome, {employee?.name}</h1>
              <p className="text-gray-600 mt-1">
                Employee ID: {employee?.employeeId} | Department: {employee?.department}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Leave Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-secondary p-6 rounded-neumorphic shadow-outerRaised">
            <h2 className="text-xl font-semibold text-primary mb-4">Leave Balance</h2>
            <div className="text-3xl font-bold text-gray-800">{employee?.leaveBalance || 0}</div>
            <p className="text-gray-600 mt-2">Available Leave Days</p>
          </div>
          <div className="bg-secondary p-6 rounded-neumorphic shadow-outerRaised">
            <h2 className="text-xl font-semibold text-primary mb-4">CCL Balance</h2>
            <div className="text-3xl font-bold text-gray-800">{employee?.cclBalance || 0}</div>
            <p className="text-gray-600 mt-2">Available CCL Days</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setShowLeaveForm(true)}
            className="px-6 py-3 bg-primary text-white rounded-neumorphic shadow-outerRaised 
                     hover:shadow-innerSoft transition-all duration-300"
          >
            Apply for Leave
          </button>
          <button
            onClick={() => setShowCCLForm(true)}
            className="px-6 py-3 bg-green-500 text-white rounded-neumorphic shadow-outerRaised 
                     hover:shadow-innerSoft transition-all duration-300"
          >
            Submit CCL Work
          </button>
      </div>

        {/* CCL Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">CCL Management</h2>
            <button
              onClick={() => setShowCCLForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Submit CCL Work
            </button>
              </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CCL Balance */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">CCL Balance</h3>
              <p className="text-3xl font-bold text-blue-600">{employee?.cclBalance || 0} days</p>
            </div>

            {/* CCL History */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Recent CCL History</h3>
              <div className="space-y-2">
                {cclHistory.slice(0, 5).map((record, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                      {new Date(record.date).toLocaleDateString()}
                    </span>
                    <span className={`font-medium ${record.type === 'earned' ? 'text-green-600' : 'text-red-600'}`}>
                      {record.type === 'earned' ? '+' : '-'}{record.days} days
                    </span>
                  </div>
                ))}
              </div>
              </div>
            </div>

          {/* CCL Work History */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">CCL Work History</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned BY</th>
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
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
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
        </div>

        {/* Leave History */}
        <div className="bg-secondary p-6 rounded-neumorphic shadow-outerRaised">
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
                    <tr key={index}>
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
      </div>

      {/* Leave Application Form Modal */}
      {showLeaveForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
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
