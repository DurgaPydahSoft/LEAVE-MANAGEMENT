import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from 'react-toastify';
import LeaveApplicationForm from "../components/LeaveApplicationForm";
import CCLRequestForm from "../components/CCLRequestForm";
import CCLWorkRequestForm from '../components/CCLWorkRequestForm';
import { createAuthAxios } from '../utils/authAxios';
import config from '../config';
import { FaUserCircle, FaRegCalendarCheck, FaHistory } from 'react-icons/fa';
import { MdOutlineLogout, MdOutlineWorkHistory } from 'react-icons/md';
import { BsFillPersonLinesFill } from 'react-icons/bs';
import Loading from '../components/Loading';

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
    return <Loading />;
  }

  return (
    <div className="min-h-screen py-8 px-2 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8 ">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-secondary rounded-neumorphic shadow-outerRaised p-6 gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="bg-primary/10 rounded-full p-3 flex items-center justify-center">
              <FaUserCircle className="text-primary text-4xl sm:text-5xl" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-1">Welcome, {employee?.name}</h1>
              <p className="text-gray-600 text-xs sm:text-sm">
                <span className="font-medium">{employee?.employeeId}</span> &bull; {employee?.department}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 sm:mt-0 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <MdOutlineLogout className="text-lg" /> Logout
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
            <div className="bg-primary/10 rounded-full p-3 flex items-center justify-center">
              <FaRegCalendarCheck className="text-primary text-3xl" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-primary">Leave Balance</h2>
              <div className="text-2xl font-bold text-gray-800">{employee?.leaveBalance || 0} days</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
            <div className="bg-green-500/10 rounded-full p-3 flex items-center justify-center">
              <MdOutlineWorkHistory className="text-green-600 text-3xl" />
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
            className="w-full px-6 py-3 bg-primary text-white rounded-lg shadow hover:bg-primary-dark transition-colors text-lg font-semibold flex items-center justify-center gap-2"
          >
            <FaRegCalendarCheck className="text-xl" /> Apply for Leave
          </button>
          <button
            onClick={() => setShowCCLForm(true)}
            className="w-full px-6 py-3 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 transition-colors text-lg font-semibold flex items-center justify-center gap-2"
          >
            <MdOutlineWorkHistory className="text-xl" /> Submit CCL Work
          </button>
        </div>

        {/* CCL Work History */}
        <div className="bg-secondary rounded-neumorphic shadow-outerRaised p-6">
          <div className="flex items-center gap-2 mb-4">
            <MdOutlineWorkHistory className="text-primary text-xl" />
            <h2 className="text-xl font-semibold text-primary">CCL Work History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Assigned By</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">HOD Remarks</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Principal Remarks</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cclWorkHistory && cclWorkHistory.length > 0 ? (
                  cclWorkHistory.map((work) => (
                    <tr key={work._id}>
                      <td className="px-6 py-4 whitespace-nowrap">{work.date ? new Date(work.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{work.assignedTo || '-'}</td>
                      <td className="px-6 py-4">{work.reason || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${work.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                            work.status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'}`}>{work.status || 'Pending'}</span>
                      </td>
                      <td className="px-6 py-4">{work.hodRemarks || '-'}</td>
                      <td className="px-6 py-4">{work.principalRemarks || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No CCL work history found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Leave History */}
        <div className="bg-secondary rounded-neumorphic shadow-outerRaised p-6">
          <div className="flex items-center gap-2 mb-4">
            <FaHistory className="text-primary text-xl" />
            <h2 className="text-xl font-semibold text-primary">Leave History</h2>
          </div>
          {leaveHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Leave Type</th>
                    <th className="px-4 py-2 text-left">Start Date</th>
                    <th className="px-4 py-2 text-left">End Date</th>
                    <th className="px-4 py-2 text-left">Days</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Applied On</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveHistory.map((leave) => (
                    <tr
                      key={leave._id}
                      className="border-t cursor-pointer hover:bg-blue-50 transition"
                      onClick={() => setSelectedLeave(leave)}
                    >
                      <td className="px-4 py-2">{leave.leaveType}</td>
                      <td className="px-4 py-2">{new Date(leave.startDate).toLocaleDateString()}</td>
                      <td className="px-4 py-2">{new Date(leave.endDate).toLocaleDateString()}</td>
                      <td className="px-4 py-2">{leave.numberOfDays}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold
                          ${leave.status === 'Approved' ? 'bg-green-100 text-green-800' :
                            leave.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                            leave.status === 'Forwarded by HOD' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'}`}>{leave.status}</span>
                      </td>
                      <td className="px-4 py-2">{new Date(leave.appliedOn).toLocaleDateString()}</td>
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-3 sm:p-6 w-full max-w-lg sm:max-w-2xl max-h-[90vh] overflow-y-auto relative">
              {/* Close button absolutely positioned top right */}
              <button
                onClick={() => setSelectedLeave(null)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl p-1 z-10"
                aria-label="Close"
              >
                ✕
              </button>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-primary">Leave Request Details</h3>
              </div>
              <div className="space-y-4">
                {/* Show Request ID at the top */}
                <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-100 mb-2 flex flex-col items-start">
                  <p className="text-sm text-gray-600 font-semibold mb-1">Request ID</p>
                  <p className="font-mono text-base text-primary break-all">{selectedLeave.leaveRequestId}</p>
                </div>
                {/* Employee Information */}
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Employee Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium break-words">{employee?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Employee ID</p>
                      <p className="font-medium break-words">{employee?.employeeId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium break-words">{employee?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Department</p>
                      <p className="font-medium break-words">{employee?.department}</p>
                    </div>
                  </div>
                </div>
                {/* Leave Details */}
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Leave Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Leave Type</p>
                      <p className="font-medium break-words">{selectedLeave.leaveType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Duration</p>
                      <p className="font-medium break-words">{new Date(selectedLeave.startDate).toLocaleDateString()} to {new Date(selectedLeave.endDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Applied On</p>
                      <p className="font-medium break-words">{selectedLeave.appliedOn ? new Date(selectedLeave.appliedOn).toLocaleDateString() : 'N/A'}</p>
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
                      <div className="col-span-1 sm:col-span-2">
                        <p className="text-sm text-gray-600">Half Day Leave</p>
                      </div>
                    )}
                    <div className="col-span-1 sm:col-span-2">
                      <p className="text-sm text-gray-600">Reason</p>
                      <p className="font-medium break-words">{selectedLeave.reason || 'No reason provided'}</p>
                    </div>
                  </div>
                </div>
                {/* Remarks */}
                {(selectedLeave.hodRemarks || selectedLeave.principalRemarks) && (
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Remarks</h4>
                    <div className="space-y-2">
                      {selectedLeave.hodRemarks && (
                        <div>
                          <p className="text-sm text-gray-600">HOD Remarks</p>
                          <p className="font-medium break-words">{selectedLeave.hodRemarks}</p>
                        </div>
                      )}
                      {selectedLeave.principalRemarks && (
                        <div>
                          <p className="text-sm text-gray-600">Principal Remarks</p>
                          <p className="font-medium break-words">{selectedLeave.principalRemarks}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* Alternate Schedule */}
                {selectedLeave.alternateSchedule && selectedLeave.alternateSchedule.length > 0 && (
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Alternate Schedule</h4>
                    <div className="space-y-4">
                      {selectedLeave.alternateSchedule.map((schedule, index) => (
                        <div key={index} className="bg-white p-2 sm:p-3 rounded-md">
                          <p className="font-medium mb-2">
                            Date: {schedule.date ? new Date(schedule.date).toLocaleDateString() : 'N/A'}
                          </p>
                          {schedule.periods && schedule.periods.length > 0 ? (
                            <div className="space-y-2">
                              {schedule.periods.map((period, pIndex) => (
                                <div key={pIndex} className="bg-gray-50 p-2 rounded">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div>
                                      <span className="text-sm text-gray-600">Period:</span>{' '}
                                      <span className="font-medium">{period.periodNumber || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-sm text-gray-600">Class:</span>{' '}
                                      <span className="font-medium">{period.assignedClass || 'N/A'}</span>
                                    </div>
                                    <div className="col-span-1 sm:col-span-2">
                                      <span className="text-sm text-gray-600">Substitute Faculty:</span>{' '}
                                      <span className="font-medium text-sm sm:text-base break-words">
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
