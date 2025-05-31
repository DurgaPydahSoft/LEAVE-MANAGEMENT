import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import config from '../config';

const API_BASE_URL = config.API_BASE_URL;

const LEAVE_TYPES = [
  { code: 'CL', label: 'Casual Leave' },
  { code: 'CCL', label: 'Cost Casual Leave' },
  { code: 'Medical', label: 'Medical Leave' },
  { code: 'Maternity', label: 'Maternity Leave' },
  { code: 'OD', label: 'On Duty' },
  { code: 'Others', label: 'Other Leave' }
];

const PERIODS = [1, 2, 3, 4, 5, 6, 7];

const LeaveApplicationForm = ({ onSubmit, onClose, employee, loading }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    leaveType: '',
    isHalfDay: false,
    session: '',
    startDate: '',
    endDate: '',
    reason: '',
    alternateSchedule: [],
    employeeId: employee?._id || '',
    employeeModel: 'Employee',
    department: employee?.department || '',
    campus: employee?.campus || ''
  });
  const [facultyList, setFacultyList] = useState([]);
  const [error, setError] = useState('');
  const [leaveBalance, setLeaveBalance] = useState({ leaveBalance: 0, cclBalance: 0 });
  const [currentDay, setCurrentDay] = useState(0);
  const [selectedPeriods, setSelectedPeriods] = useState({});
  const [showPeriodForm, setShowPeriodForm] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState({
    periodNumber: '',
    substituteFaculty: '',
    assignedClass: ''
  });

  // Fetch leave balance
  useEffect(() => {
    const fetchLeaveBalance = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/employee/leave-balance`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch leave balance');
        const data = await response.json();
        setLeaveBalance(data);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to fetch leave balance');
      }
    };
    fetchLeaveBalance();
  }, []);

  // Fetch faculty list
  useEffect(() => {
    const fetchFaculty = async () => {
      if (!employee) {
        console.log('Employee data not available yet');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/employee/faculty-list/${employee.campus}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch faculty list');
        const data = await response.json();
        setFacultyList(data.filter(f => 
          f.campus === employee.campus && 
          f.department === employee.department &&
          f._id !== employee._id
        ));
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to fetch faculty list');
      }
    };
    fetchFaculty();
  }, [employee]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'isHalfDay') {
      setFormData(prev => ({
        ...prev,
        isHalfDay: checked,
        session: '',
        startDate: '',
        endDate: '',
        numberOfDays: 0,
        alternateSchedule: []
      }));
      setCurrentDay(0);
      setSelectedPeriods({});
    } else if (name === 'session') {
      setFormData(prev => ({
        ...prev,
        session: value
      }));
    } else if (name === 'startDate' || name === 'endDate') {
      const startDate = name === 'startDate' ? value : formData.startDate;
      const endDate = name === 'endDate' ? value : formData.endDate;

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (formData.isHalfDay && start.getTime() !== end.getTime()) {
          toast.error('For half-day leave, start and end date must be the same');
          return;
        }

        if (end < start) {
          toast.error('End date cannot be before start date');
          return;
        }

        setFormData(prev => ({
          ...prev,
          [name]: value,
          numberOfDays: prev.isHalfDay ? 0.5 : Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePeriodInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentPeriod(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getAvailablePeriods = () => {
    const usedPeriods = selectedPeriods[currentDay] || [];
    let availablePeriods = PERIODS.filter(p => !usedPeriods.includes(p));
    
    // Filter periods based on session for half-day leave
    if (formData.isHalfDay) {
      availablePeriods = availablePeriods.filter(p => 
        formData.session === 'morning' ? p <= 4 : p >= 5
      );
    }
    
    return availablePeriods;
  };

  const handleAddPeriod = () => {
    if (!currentPeriod.periodNumber || !currentPeriod.substituteFaculty || !currentPeriod.assignedClass) {
      toast.error('Please fill all period details');
      return;
    }

    // Check if period is already assigned
    if (selectedPeriods[currentDay]?.includes(parseInt(currentPeriod.periodNumber))) {
      toast.error('This period is already assigned');
      return;
    }

    const periodNumber = parseInt(currentPeriod.periodNumber);

    // Update form data with new period
    setFormData(prev => {
      const newSchedule = [...prev.alternateSchedule];
      const daySchedule = newSchedule[currentDay];
      
      // Check if period already exists
      const existingPeriodIndex = daySchedule.periods.findIndex(p => p.periodNumber === periodNumber);
      
      if (existingPeriodIndex === -1) {
        // Add new period
        daySchedule.periods.push({
          periodNumber,
          substituteFaculty: currentPeriod.substituteFaculty,
          assignedClass: currentPeriod.assignedClass
        });
      }
      
      return { ...prev, alternateSchedule: newSchedule };
    });

    // Update selected periods
    setSelectedPeriods(prev => {
      const currentDayPeriods = prev[currentDay] || [];
      if (!currentDayPeriods.includes(periodNumber)) {
        return {
          ...prev,
          [currentDay]: [...currentDayPeriods, periodNumber]
        };
      }
      return prev;
    });

    // Reset form and hide it
    setCurrentPeriod({
      periodNumber: '',
      substituteFaculty: '',
      assignedClass: ''
    });
    setShowPeriodForm(false);
  };

  const handleRemovePeriod = (periodNumber) => {
    setFormData(prev => {
      const newSchedule = [...prev.alternateSchedule];
      newSchedule[currentDay].periods = newSchedule[currentDay].periods
        .filter(p => p.periodNumber !== periodNumber);
      return { ...prev, alternateSchedule: newSchedule };
    });

    setSelectedPeriods(prev => ({
      ...prev,
      [currentDay]: prev[currentDay].filter(p => p !== periodNumber)
    }));
  };

  const handleNextDay = async () => {
    if (formData.alternateSchedule[currentDay].periods.length === 0) {
      toast.error('Please add at least one period');
      return;
    }

    try {
      // Validate faculty availability for the current day
      const token = localStorage.getItem('token');
      const currentDaySchedule = formData.alternateSchedule[currentDay];
      
      // Check availability for each assigned faculty
      for (const period of currentDaySchedule.periods) {
        const response = await fetch(`${API_BASE_URL}/api/employee/check-faculty-availability`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            facultyId: period.substituteFaculty,
            date: currentDaySchedule.date,
            periods: [period.periodNumber]
          })
        });

        if (!response.ok) {
          const data = await response.json();
          toast.error(data.message || 'Failed to validate faculty availability');
          return;
        }
      }

      setCurrentDay(prev => prev + 1);
      setShowPeriodForm(false);
    } catch (error) {
      console.error('Error validating schedule:', error);
      toast.error('Failed to validate schedule');
    }
  };

  const handlePreviousDay = () => {
    setCurrentDay(prev => prev - 1);
    setShowPeriodForm(false);
  };

  const validateBasicDetails = () => {
    if (!formData.leaveType) return 'Please select leave type';
    if (!formData.startDate) return 'Please select start date';
    if (!formData.isHalfDay && !formData.endDate) return 'Please select end date';
    if (formData.isHalfDay && !formData.session) return 'Please select session for half-day leave';
    if (!formData.reason) return 'Please provide a reason';
    return null;
  };

  const handleNextStep = () => {
    const error = validateBasicDetails();
    if (error) {
      toast.error(error);
      return;
    }

    try {
      // Check CCL balance if leave type is CCL
      if (formData.leaveType === 'CCL') {
        const requestedDays = formData.isHalfDay ? 0.5 : 
          Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24)) + 1;
        
        if (requestedDays > leaveBalance.cclBalance) {
          toast.error(`Insufficient CCL balance. Available: ${leaveBalance.cclBalance} days, Requested: ${requestedDays} days`);
          return;
        }
      }

      // For half-day leave
      if (formData.isHalfDay) {
        // Ensure end date is same as start date
        const updatedFormData = {
          ...formData,
          endDate: formData.startDate,
          numberOfDays: 0.5,
          alternateSchedule: [{
            date: formData.startDate,
            periods: []
          }]
        };
        
        console.log('Updating form data for half-day leave:', updatedFormData);
        setFormData(updatedFormData);
        setCurrentDay(0);
        setSelectedPeriods({});
        setStep(2);
        return;
      }

      // For full-day leave
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const dates = [];
      const currentDate = new Date(start);
      
      while (currentDate <= end) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const updatedFormData = {
        ...formData,
        numberOfDays: Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1,
        alternateSchedule: dates.map(date => ({
          date: date,
          periods: []
        }))
      };

      console.log('Updating form data for full-day leave:', updatedFormData);
      setFormData(updatedFormData);
      setCurrentDay(0);
      setSelectedPeriods({});
    setStep(2);
    } catch (error) {
      console.error('Error in handleNextStep:', error);
      toast.error('An error occurred while processing your request');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentDay < formData.alternateSchedule.length - 1) {
      toast.error('Please complete alternate schedule for all days');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Calculate number of days
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const numberOfDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      
      // Format dates and schedule data
      const formattedData = {
        ...formData,
        employeeId: employee._id,
        employeeModel: 'Employee',
        department: employee.department,
        campus: employee.campus,
        startDate: formData.startDate,
        endDate: formData.endDate,
        numberOfDays: formData.isHalfDay ? 0.5 : numberOfDays,
        alternateSchedule: formData.alternateSchedule.map(day => ({
          date: day.date,
          periods: day.periods.map(period => ({
            periodNumber: parseInt(period.periodNumber),
            substituteFaculty: period.substituteFaculty,
            assignedClass: period.assignedClass
          }))
        }))
      };

      // Debug log
      console.log('Submitting leave request with data:', formattedData);

      const response = await fetch(`${API_BASE_URL}/api/employee/leave-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formattedData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.msg || 'Failed to submit leave request');
      }

      const data = await response.json();
      toast.success('Leave request submitted successfully');
      onSubmit(data.leaveRequest);
    } catch (error) {
      console.error('Error submitting leave request:', error);
      toast.error(error.message || 'Failed to submit leave request');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Apply for Leave</h2>
            <p className="text-sm text-gray-500 mt-1">
              {step === 1 ? 'Step 1: Basic Details' : 'Step 2: Alternate Schedule'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 ? (
            /* Step 1: Basic Details */
            <div className="space-y-6">
              {/* Leave Type */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                  <select
                    name="leaveType"
                    value={formData.leaveType}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Leave Type</option>
                    {LEAVE_TYPES.map(type => (
                      <option key={type.code} value={type.code}>{type.label}</option>
                    ))}
                  </select>
                  {formData.leaveType && (
                    <div className="mt-2">
                      {formData.leaveType === 'CCL' ? (
                        <div className={`text-sm ${leaveBalance.cclBalance <= 0 ? 'text-red-500' : leaveBalance.cclBalance < 1 ? 'text-yellow-500' : 'text-green-500'}`}>
                          Available CCL Balance: <strong>{leaveBalance.cclBalance}</strong> days
                          {formData.isHalfDay && (
                            <span className="block text-xs mt-1">
                              (Half-day leave will use 0.5 days)
                            </span>
                          )}
                        </div>
                      ) : formData.leaveType === 'CL' ? (
                        <div className={`text-sm ${leaveBalance.leaveBalance <= 0 ? 'text-red-500' : leaveBalance.leaveBalance < 4 ? 'text-yellow-500' : 'text-green-500'}`}>
                          Available Casual Leave Balance: <strong>{leaveBalance.leaveBalance}</strong> days
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isHalfDay"
                    name="isHalfDay"
                    checked={formData.isHalfDay}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isHalfDay" className="ml-2 block text-sm text-gray-700">
                    Half Day Leave
                  </label>
                </div>
              </div>

              {/* Session Selection for Half Day */}
              {formData.isHalfDay && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
                  <select
                    name="session"
                    value={formData.session}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Session</option>
                    <option value="morning">Morning Session (Periods 1-4)</option>
                    <option value="afternoon">Afternoon Session (Periods 5-7)</option>
                  </select>
                </div>
              )}

              {/* Date Selection */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.isHalfDay ? 'Date' : 'Start Date'}
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                {!formData.isHalfDay && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      min={formData.startDate || new Date().toISOString().split('T')[0]}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Leave</label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  rows="3"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Please provide detailed reason for your leave request"
                  required
                />
              </div>

              {/* Navigation */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Next: Alternate Schedule
                </button>
              </div>
            </div>
          ) : (
            /* Step 2: Alternate Schedule */
            <div className="space-y-6">
              {/* Current Day Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900">
                  Day {currentDay + 1} of {formData.alternateSchedule.length}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(formData.alternateSchedule[currentDay].date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              {/* Added Periods List */}
              <div className="space-y-4">
                {formData.alternateSchedule[currentDay].periods.map((period, idx) => (
                  <div key={idx} className="bg-white border rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">Period {period.periodNumber}</h4>
                      <p className="text-sm text-gray-500">
                        Faculty: {facultyList.find(f => f._id === period.substituteFaculty)?.name}
                      </p>
                      <p className="text-sm text-gray-500">Class: {period.assignedClass}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePeriod(period.periodNumber)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Period Form */}
              {!showPeriodForm ? (
                <button
                  type="button"
                  onClick={() => setShowPeriodForm(true)}
                  className="w-full py-2 px-4 border border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  + Add Period
                </button>
              ) : (
                <div className="border rounded-lg p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                    <select
                      name="periodNumber"
                      value={currentPeriod.periodNumber}
                      onChange={handlePeriodInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Period</option>
                      {getAvailablePeriods().map(period => (
                        <option key={period} value={period}>Period {period}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Substitute Faculty</label>
                    <select
                      name="substituteFaculty"
                      value={currentPeriod.substituteFaculty}
                      onChange={handlePeriodInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Faculty</option>
                      {facultyList.map(faculty => (
                        <option key={faculty._id} value={faculty._id}>{faculty.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Class</label>
                    <input
                      type="text"
                      name="assignedClass"
                      value={currentPeriod.assignedClass}
                      onChange={handlePeriodInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter class (e.g. CSE-A)"
                      required
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={handleAddPeriod}
                      className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Add Period
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPeriodForm(false);
                        setCurrentPeriod({
                          periodNumber: '',
                          substituteFaculty: '',
                          assignedClass: ''
                        });
                      }}
                      className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-4 border-t">
                <div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Back to Details
                  </button>
                </div>
                <div className="flex space-x-3">
                  {currentDay > 0 && (
                    <button
                      type="button"
                      onClick={handlePreviousDay}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Previous Day
                    </button>
                  )}
                  {currentDay < formData.alternateSchedule.length - 1 ? (
                    <button
                      type="button"
                      onClick={handleNextDay}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Next Day
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 ${
                        loading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {loading ? 'Submitting...' : 'Submit Leave Request'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default LeaveApplicationForm; 