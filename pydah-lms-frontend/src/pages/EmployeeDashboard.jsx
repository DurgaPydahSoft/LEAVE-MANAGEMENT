import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LeaveForm from "../components/LeaveForm";

const EmployeeDashboard = () => {
  const [employee, setEmployee] = useState(null);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const fetchEmployee = async () => {
      const token = localStorage.getItem("token");
      const employeeId = localStorage.getItem("employeeId");

      if (!token || !employeeId) return navigate("/login");

      try {
        const response = await fetch(`https://pydah-lms-backend.onrender.com/api/employee/${employeeId}`, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to fetch employee details");

        const data = await response.json();

        // Sort leave requests by status priority
        if (data.leaveRequests) {
          const order = ["Pending", "Forwarded by HOD", "Approved", "Rejected"];
          data.leaveRequests.sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
        }

        setEmployee(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchEmployee();
    setLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("employeeId");
      navigate("/login");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col items-center">
          {/* Animated Loader */}
          <div className="w-16 h-16 border-4 border-primary  rounded-2xl animate-spin"></div>

          <p className="mt-4 text-lg font-semibold text-gray-700">
            Processing Your Request, please wait...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-row md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-primary">Employee Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded shadow-lg transition-all duration-300 hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      {employee && (
        <div className="bg-secondary p-6 rounded-neumorphic shadow-outerRaised mb-6">
          <h2 className="text-xl font-semibold mb-4 text-primary">Employee Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(employee)
              .filter(([key]) => key !== "leaveRequests")
              .map(([key, value]) => (
                <div key={key} className="border-b pb-2 text-textDark">
                  <strong className="capitalize">{key.replace(/__v/g, "Applied Leave Requests").replace(/_/g, " ")}</strong>: {value}
                </div>

              ))}
            <div className="border-b pb-2 text-textDark">
              <p>
                <strong className="text-textDark">Approved Leaves:</strong> {12 - employee.leaveBalance} days
              </p></div>
          </div>
        </div>
      )}

      {/* Apply Leave Button */}
      <button
        onClick={() => setShowLeaveForm(true)}
        className="bg-primary text-white px-4 py-2 rounded shadow-lg transition-all duration-300 hover:bg-darkGold mb-6 w-full sm:w-auto"
      >
        Apply Leave
      </button>

      {/* Leave Form */}
      {showLeaveForm && (
        <div className="bg-secondary p-6 rounded-neumorphic shadow-outerRaised mb-6">
          <LeaveForm onClose={() => setShowLeaveForm(false)} employeeId={employee.employeeId} leaveBalance={employee.leaveBalance} />
        </div>
      )}

      {/* Leave Requests */}
      {employee?.leaveRequests && (
        <div className="bg-secondary p-6 rounded-neumorphic shadow-outerRaised">
          <h2 className="text-xl font-semibold mb-4 text-primary">Leave Requests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employee.leaveRequests.map((leave) => (
              <div
                key={leave._id}
                className={`p-5 rounded-lg shadow-lg cursor-pointer transition-all duration-300 transform hover:scale-105 border-l-8 ${leave.status === "Pending"
                    ? "border-yellow-500 bg-yellow-100"
                    : leave.status === "Forwarded by HOD"
                      ? "border-blue-500 bg-blue-100"
                      : leave.status === "Approved"
                        ? "border-green-500 bg-green-100"
                        : "border-red-500 bg-red-100"
                  }`}
                onClick={() => setSelectedLeave(leave)}
              >
                <p className="font-semibold text-lg text-textDark">{employee.name}</p>
                <p><strong>Start:</strong> {new Date(leave.startDate).toDateString()}</p>
                <p><strong>End:</strong> {new Date(leave.endDate).toDateString()}</p>
                <p><strong>Reason:</strong> {leave.reason}</p>
                <p className="mt-2 text-sm font-semibold uppercase">{leave.status}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedLeave && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-2 sm:p-4">
          <div className="bg-secondary p-4 sm:p-6 rounded-neumorphic  w-full max-w-md sm:max-w-lg md:max-w-3xl lg:max-w-4xl h-auto max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-primary text-center">Leave Details</h2>

            {/* Main Content Wrapper */}
            <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
              {/* Left Side: Leave Details */}
              <div className="w-full md:w-1/2">
                <div className="grid grid-cols-1 gap-3 text-sm sm:text-base text-textDark">
                  <p><strong>Employee:</strong> {employee.name}</p>
                  <p><strong>Department:</strong> {employee.department}</p>
                  <p><strong>Leave Type:</strong> {selectedLeave.leaveType}</p>
                  <p><strong>Status:</strong> {selectedLeave.status}</p>
                  <p><strong>Start Date:</strong> {new Date(selectedLeave.startDate).toDateString()}</p>
                  <p><strong>End Date:</strong> {new Date(selectedLeave.endDate).toDateString()}</p>
                  <p><strong>Reason:</strong> {selectedLeave.reason}</p>
                  <p><strong>Remarks:</strong> {selectedLeave.remarks || "N/A"}</p>
                </div>
              </div>

              {/* Right Side: Alternate Schedule */}
              {selectedLeave.alternateSchedule && selectedLeave.alternateSchedule.length > 0 && (
                <div className="w-full md:w-1/2">
                  <h3 className="text-md sm:text-lg font-semibold mb-2 text-primary">Alternate Schedule</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border border-blue-500 text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-green-300 text-textDark">
                          <th className="border p-1 sm:p-2">Period</th>
                          <th className="border p-1 sm:p-2">Lecturer</th>
                          <th className="border p-1 sm:p-2">Class</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedLeave.alternateSchedule
                          .slice()
                          .sort((a, b) => a.periodNumber - b.periodNumber)
                          .map((schedule, index) => {
                            const isAssigned =
                              schedule.lecturerName &&
                              schedule.lecturerName.toLowerCase() !== "leisure" &&
                              schedule.classAssigned;
                            return (
                              <tr
                                key={index}
                                className={`text-center ${isAssigned
                                    ? "bg-green-200 text-green-800 font-semibold"
                                    : "bg-red-200 text-red-700 font-semibold"
                                  }`}
                              >
                                <td className="border p-1 sm:p-2">Period {schedule.periodNumber}</td>
                                <td className="border p-1 sm:p-2">{schedule.lecturerName || "Not Assigned"}</td>
                                <td className="border p-1 sm:p-2">{schedule.classAssigned || "N/A"}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => setSelectedLeave(null)}
              className="mt-4 w-full bg-primary text-white px-3 sm:px-4 py-2 rounded text-sm sm:text-base transition-all duration-300 hover:bg-darkGold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>

  );
};

export default EmployeeDashboard;
