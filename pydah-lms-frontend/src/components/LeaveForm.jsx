import React, { useState } from "react";
import axios from "axios";

const LeaveForm = ({ onClose, employeeId, leaveBalance }) => {
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [periods, setPeriods] = useState([]);
  const [message, setMessage] = useState("");
  const [isCheckingLeaves, setIsCheckingLeaves] = useState(false);

  const leaveTypes = [
    "Casual Leave",
    "Cost Casual Leave",
    "Medical Leave",
    "Paid Leave",
    "On Duty"
  ];

  const addPeriod = () => {
    setPeriods([...periods, { periodNumber: "", lecturerName: "", classAssigned: "" }]);
  };

  const removePeriod = (index) => {
    setPeriods(periods.filter((_, i) => i !== index));
  };

  const handlePeriodChange = (index, field, value) => {
    const updatedPeriods = [...periods];
    updatedPeriods[index][field] = value;
    setPeriods(updatedPeriods);
  };

  const processAlternateSchedule = () => {
    const periodMap = new Map();
    periods.forEach(({ periodNumber, lecturerName, classAssigned }) => {
      if (periodNumber) {
        periodMap.set(Number(periodNumber), { lecturerName, classAssigned });
      }
    });

    for (let i = 1; i <= 7; i++) {
      if (!periodMap.has(i)) {
        periodMap.set(i, { lecturerName: "Leisure", classAssigned: "Not Assigned" });
      }
    }

    return Array.from(periodMap, ([periodNumber, details]) => ({
      periodNumber,
      lecturerName: details.lecturerName,
      classAssigned: details.classAssigned
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsCheckingLeaves(true);
    setMessage("");

    const employeeToken = localStorage.getItem("token");

    if (!employeeToken) {
      setMessage("Employee is not logged in. Please log in and try again.");
      setIsCheckingLeaves(false);
      return;
    }

    const alternateSchedule = processAlternateSchedule();

    try {
      const response = await axios.post(
        `https://pydah-lms-backend.onrender.com/api/employee/${employeeId}/leave-request`,
        { leaveType, startDate, endDate, reason, alternateSchedule },
        { headers: { "Content-Type": "application/json", Authorization: `Bearer ${employeeToken}` } }
      );
    
      setMessage("Leave request submitted successfully!");
      setStartDate("");
      setEndDate("");
      setReason("");
      setPeriods([]);
    
      // Check if the response contains a warning and show an alert
      if (response.data.warning) {
        alert(response.data.warning);
      }
    
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setMessage(error.response?.data?.msg || "Failed to submit leave request");
    }
    
    setIsCheckingLeaves(false);
  };    

  return (
    <div className="max-w-2xl mx-auto bg-secondary shadow-outerRaised rounded-neumorphic p-6 mt-20">
    <h2 className="text-2xl font-semibold text-primary text-center">Apply for Leave</h2>
    {message && <p className="text-center text-red-500 mt-2">{message}</p>}
  
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div
        className={`text-sm font-semibold ${
          leaveBalance <= 0
            ? "text-red-500"
            : leaveBalance < 4
            ? "text-yellow-500"
            : "text-green-500"
        }`}
      >
        Available Leaves: <strong>{leaveBalance}</strong>
      </div>
  
      {/* Leave Type */}
      <div>
        <label className="block text-primary font-medium">Leave Type:</label>
        <select
          className="w-full mt-1 p-3 border border-gray-300 rounded-neumorphic focus:ring-2 focus:ring-blue-500 shadow-inner bg-background text-textDark"
          value={leaveType}
          onChange={(e) => setLeaveType(e.target.value)}
          required
        >
          <option value="">Select Leave Type</option>
          {leaveTypes.map((type, index) => (
            <option key={index} value={type}>{type}</option>
          ))}
        </select>
      </div>
  
      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-primary font-medium">Start Date:</label>
          <input
            type="date"
            className="w-full mt-1 p-3 border border-gray-300 rounded-neumorphic focus:ring-2 focus:ring-blue-500 shadow-inner bg-background text-textDark"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-primary font-medium">End Date:</label>
          <input
            type="date"
            className="w-full mt-1 p-3 border border-gray-300 rounded-neumorphic focus:ring-2 focus:ring-blue-500 shadow-inner bg-background text-textDark"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
      </div>
  
      {/* Reason */}
      <div>
        <label className="block text-primary font-medium">Reason:</label>
        <textarea
          className="w-full mt-1 p-3 border border-gray-300 rounded-neumorphic focus:ring-2 focus:ring-blue-500 shadow-inner bg-background text-textDark"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />
      </div>
  
      {/* Periods Section */}
      <div className="bg-gray-100 p-4 rounded-neumorphic shadow-inner">
        <h3 className="text-lg font-semibold text-gray-700">Alternate Schedule</h3>
        {periods.map((period, index) => (
          <div key={index} className="mt-3 bg-secondary p-3 rounded-neumorphic shadow-outerRaised">
            <label className="block text-gray-600 font-medium">Period Number:</label>
            <input
              type="number"
              min="1"
              max="7"
              className="w-full p-3 border border-gray-300 rounded-neumorphic bg-background shadow-inner text-textDark"
              value={period.periodNumber}
              onChange={(e) => handlePeriodChange(index, "periodNumber", e.target.value)}
              required
            />
  
            <label className="block text-gray-600 font-medium mt-2">Lecturer Name:</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-neumorphic bg-background shadow-inner text-textDark"
              value={period.lecturerName}
              onChange={(e) => handlePeriodChange(index, "lecturerName", e.target.value)}
              required
            />
  
            <label className="block text-gray-600 font-medium mt-2">Class Assigned:</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-neumorphic bg-background shadow-inner text-textDark"
              value={period.classAssigned}
              onChange={(e) => handlePeriodChange(index, "classAssigned", e.target.value)}
              required
            />
  
            <button
              onClick={() => removePeriod(index)}
              className="mt-2 text-red-500 hover:text-red-700 shadow-inner transition-all"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addPeriod}
          className="mt-4 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-neumorphic transition-all shadow-outerRaised"
        >
          Add Period
        </button>
      </div>
  
      {/* Submit */}
      <button
        type="submit"
        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-neumorphic shadow-outerRaised transition-all focus:ring-2 focus:ring-blue-500"
        disabled={isCheckingLeaves}
      >
        {isCheckingLeaves ? "Checking..." : "Submit Leave Request"}
      </button>
    </form>
  </div>
  
  );
};

export default LeaveForm;
