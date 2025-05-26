import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";
const AdminDashboard = () => {
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [hodLeaveRequests, setHodLeaveRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [filteredHodRequests, setFilteredHodRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPopup, setShowPopup] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [remarks, setRemarks] = useState("");
    const [showFilter, setShowFilter] = useState(false);
    const [filterStatus, setFilterStatus] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [showHodRequests, setShowHodRequests] = useState(false);
    const [excelFile, setExcelFile] = useState(null);
    // const [allFilteredLeaves, setAllFilteredLeaves] = useState([]);
    const navigate = useNavigate();


  
    useEffect(() => {
        const fetchLeaveRequests = async () => {
          try {
            const facultyResponse = await fetch("https://pydah-lms-backend.onrender.com/api/admin/leave-requests");
            const facultyData = await facultyResponse.json();
            
            const hodResponse = await fetch("https://pydah-lms-backend.onrender.com/api/admin/hod-leave-requests");
            const hodData = await hodResponse.json();
      
            // 🔍 Debugging: Log API responses
            console.log("Faculty Data:", facultyData);
            console.log("HOD Data:", hodData);
      
            // Ensure facultyData and hodData are arrays before mapping
            if (!Array.isArray(facultyData)) {
              console.error("Error: facultyData is not an array", facultyData);
              return;
            }
            if (!Array.isArray(hodData)) {
              console.error("Error: hodData is not an array", hodData);
              return;
            }
      
            // Function to format dates to YYYY-MM-DD
            const formatDate = (dateString) => new Date(dateString).toISOString().split("T")[0];
      
            const formattedFacultyData = facultyData.map((request) => ({
              ...request,
              leaveRequest: {
                ...request.leaveRequest,
                startDate: formatDate(request.leaveRequest.startDate),
                endDate: formatDate(request.leaveRequest.endDate),
              },
            }));
      
            const formattedHodData = hodData.map((request) => ({
              ...request,
              leaveRequest: {
                ...request.leaveRequest,
                startDate: formatDate(request.leaveRequest.startDate),
                endDate: formatDate(request.leaveRequest.endDate),
              },
            }));
      
            setLeaveRequests(formattedFacultyData);
            setHodLeaveRequests(formattedHodData);
            setLoading(false);
            
          } catch (error) {
            console.error("Error fetching leave requests:", error);
          }
        };
      
        fetchLeaveRequests();
      }, []);
      

  const handleOpenPopup = (employeeId, leaveRequestId, status, isHodRequest = false) => {
    setSelectedRequest({
      employeeId,
      leaveRequestId,
      status,
      isHodRequest, // Identifies whether it's a HOD request or faculty request
    });
  
    setRemarks(""); // Reset remarks input
    setShowPopup(true); // Show the popup
  };
  

  const handleConfirmUpdate = async () => {
    setLoading(true);
    if (!selectedRequest) return;
  
    const { employeeId, leaveRequestId, status, isHodRequest } = selectedRequest;
  
    // Set default remarks if none provided
    const finalRemarks = remarks.trim() || (status === "Approved" ? "Approved by admin" : "Rejected by admin");
  
    // API URL based on whether it's an HOD request or Faculty request
    const url = isHodRequest
      ? "http://localhost:5000/api/admin/hod-update-leave-request"
      : "http://localhost:5000/api/admin/update-leave-request";
  
    try {
      const response = await axios.put(url, {
        employeeId,
        leaveRequestId,
        status,
        remarks: finalRemarks,
      });
  
      if (response.status === 200) {
        alert("Leave request updated successfully!");
  
        // Update frontend state based on request type (HOD or Faculty)
        if (isHodRequest) {
          setHodLeaveRequests((prev) =>
            prev.map((req) =>
              req.leaveRequest._id === leaveRequestId
                ? { ...req, leaveRequest: { ...req.leaveRequest, status, remarks: finalRemarks } }
                : req
            )
          );
        } else {
          setLeaveRequests((prev) =>
            prev.map((req) =>
              req.leaveRequest._id === leaveRequestId
                ? { ...req, leaveRequest: { ...req.leaveRequest, status, remarks: finalRemarks } }
                : req
            )
          );
        }
        
        setShowPopup(false); // Close the remarks popup after updating
        setLoading(false);
      } else {
        alert("Error updating leave request!");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error updating leave request:", error);
      alert("Error updating leave request!");
      setLoading(false);
    }
  };

  const applyFilters = () => {
    setLoading(true);
    let filteredFaculty = leaveRequests; // Faculty leave requests
    let filteredHod = hodLeaveRequests; // HOD leave requests
  
    // Filter by Status
    if (filterStatus) {
      filteredFaculty = filteredFaculty.filter(
        (req) => req.leaveRequest?.status === filterStatus
      );
      filteredHod = filteredHod.filter(
        (req) => req.leaveRequest?.status === filterStatus
      );
    }
  
    // Filter by Start & End Date (Only Year-Month-Day)
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
  
      filteredFaculty = filteredFaculty.filter((req) => {
        const leaveStartDate = req.leaveRequest ? new Date(req.leaveRequest.startDate) : null;
        return leaveStartDate && leaveStartDate.toISOString().split("T")[0] >= start.toISOString().split("T")[0] &&
               leaveStartDate.toISOString().split("T")[0] <= end.toISOString().split("T")[0];
      });
  
      filteredHod = filteredHod.filter((req) => {
        const leaveStartDate = req.leaveRequest ? new Date(req.leaveRequest.startDate) : null;
        return leaveStartDate && leaveStartDate.toISOString().split("T")[0] >= start.toISOString().split("T")[0] &&
               leaveStartDate.toISOString().split("T")[0] <= end.toISOString().split("T")[0];
      });
    }
  
    // Update the state with filtered data
    setFilteredRequests(filteredFaculty);
    setFilteredHodRequests(filteredHod);
    setShowFilter(false);
    setLoading(false);
  };

  const categorizeRequestsByStatus = (requests) => {
    return {
      forwardedByHod: requests.filter((req) => req.leaveRequest?.status === "Forwarded by HOD"),
      approved: requests.filter((req) => req.leaveRequest?.status === "Approved"),
      rejected: requests.filter((req) => req.leaveRequest?.status === "Rejected"),
    };
  };
  
  const formatLeaveRequests = (requests) => {
    return requests.map((req) => ({
      ...req,
      leaveRequest: {
        ...req.leaveRequest,
        startDate: new Date(req.leaveRequest.startDate).toISOString().split("T")[0],
        endDate: new Date(req.leaveRequest.endDate).toISOString().split("T")[0],
      },
    }));
  };
  
  // Format leave requests for employees
  const formattedEmployeeRequests = formatLeaveRequests(leaveRequests);

  const { forwardedByHod, approved, rejected } = categorizeRequestsByStatus(formattedEmployeeRequests);
  
  // ✅ Fixed Export to Excel with Correct Data Structure
  const exportToExcel = () => {
    setLoading(true);
    let allFilteredLeaves = [...filteredRequests, ...filteredHodRequests];
  
    // ✅ Filter to include only approved requests
    let approvedRequests = allFilteredLeaves.filter(
      (req) => req.leaveRequest?.status === "Approved"
    );
  
    // ✅ Sorting by Department and Name
    approvedRequests.sort((a, b) => {
      if (!a.department) return 1;
      if (!b.department) return -1;
      if (a.department < b.department) return -1;
      if (a.department > b.department) return 1;
  
      const nameA = a.name || "";
      const nameB = b.name || "";
      return nameA.localeCompare(nameB);
    });
  
    // ✅ Prepare the data for Excel export
    const excelData = approvedRequests.map((req, index) => {
      const { leaveRequest } = req;
      const startDate = new Date(leaveRequest.startDate).toISOString().split("T")[0];
      const endDate = new Date(leaveRequest.endDate).toISOString().split("T")[0];
  
      const diffTime = new Date(leaveRequest.endDate) - new Date(leaveRequest.startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24)); // Convert to days
  
      return {
        "Serial No": index + 1,
        "Name": req.name || "N/A",
        "Department": req.department || "N/A",
        "Employee ID": req.employeeId || req.hodId || "N/A",
        "Leave Type": leaveRequest.leaveType || "N/A",  // ✅ Ensured correct placement
        "On Leave Period": `${startDate} - ${endDate}`,
        "No. of Days": diffDays + 1,
        "Reason": leaveRequest.reason || "N/A",
        "Remarks": leaveRequest.remarks || "No remarks",
      };
    });
  
    // ✅ Create Excel file
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Approved Leave Requests");
  
    // ✅ Generate Excel file and create a downloadable URL
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const fileBlob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const fileURL = URL.createObjectURL(fileBlob);
  
    // ✅ Revoke previous URL to free memory
    if (excelFile) {
      URL.revokeObjectURL(excelFile);
    }
  
    setExcelFile(fileURL); // Store file URL in state
    setLoading(false);
  };
  
  // ✅ Improved Loader UI for Better User Experience
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col items-center">
          {/* Animated Loader */}
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-2xl animate-spin"><div className="w-10 h-10 border-4 m-4 border-blue-500 border-t-transparent rounded-xl animate-spin"></div></div>
          
          <p className="mt-4 text-lg font-semibold text-gray-700">Fetching data, please wait...</p>
        </div>
      </div>
    );
  }
  
  const handleLogout = () => {
    localStorage.removeItem("token");
  
    // Show a confirmation message before navigating
    if (window.confirm("Are you sure you want to log out?")) {
      navigate("/login");
    }
  };
  

  

  return (
    <div className="container mx-auto p-4">
    <h1 className="text-2xl font-bold text-center mb-4">Admin Dashboard</h1>
  
    {/* Filter Section */}
    <div className="flex justify-between mb-4">
      <button onClick={() => setShowFilter(!showFilter)} className="bg-blue-500 text-white px-4 py-2 rounded">
        {showFilter ? "Hide Filters" : "Show Filters"}
      </button>
      <button onClick={exportToExcel} className="bg-green-500 text-white px-4 py-2 rounded">
        Export to Excel
      </button>
      <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded">
        Logout
      </button>
    </div>
  
    {showFilter && (
      <div className="bg-gray-100 p-4 mb-4 rounded">
        <label className="block mb-2">Filter by Status:</label>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border p-2 w-full mb-2">
          <option value="">All</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Forwarded by HOD">Forwarded by HOD</option>
        </select>
  
        <label className="block mb-2">Filter by Date Range:</label>
        <div className="flex gap-2">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border p-2 w-full" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border p-2 w-full" />
        </div>
  
        <button onClick={applyFilters} className="bg-blue-500 text-white px-4 py-2 rounded mt-2">
          Apply Filters
        </button>
      </div>
    )}
  
    {/* HOD Leave Requests */}
    <h2 className="text-xl font-semibold mb-2">HOD Leave Requests</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {hodLeaveRequests.map((req) => (
        <div key={req.leaveRequest._id} 
          className="bg-white p-4 rounded shadow cursor-pointer hover:shadow-lg transition"
          onClick={() => handleOpenPopup(req.hodId, req.leaveRequest._id, req.leaveRequest.status)}
        >
          <p className="font-bold">{req.name} - {req.department}</p>
          <p>Type: {req.leaveRequest.leaveType}</p>
          <p>Start: {req.leaveRequest.startDate}</p>
          <p>End: {req.leaveRequest.endDate}</p>
          <p className="font-semibold">Status: {req.leaveRequest.status}</p>
        </div>
      ))}
    </div>
  
    {/* Employee Leave Requests Categorized */}
    {["Approved", "Rejected", "Forwarded by HOD"].map((status) => (
      <div key={status}>
        <h2 className="text-xl font-semibold mb-2">{status} Leave Requests</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {leaveRequests
            .filter((req) => req.leaveRequest.status === status)
            .map((req) => (
              <div key={req.leaveRequest._id}
                className="bg-white p-4 rounded shadow cursor-pointer hover:shadow-lg transition"
                onClick={() => handleOpenPopup(req.employeeId, req.leaveRequest._id, req.leaveRequest.status)}
              >
                <p className="font-bold">{req.name} - {req.department}</p>
                <p>Type: {req.leaveRequest.leaveType}</p>
                <p>Start: {req.leaveRequest.startDate}</p>
                <p>End: {req.leaveRequest.endDate}</p>
                <p className="font-semibold">Status: {req.leaveRequest.status}</p>
              </div>
            ))}
        </div>
      </div>
    ))}
  
    {/* Remarks Popup */}
    {showPopup && (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
        <div className="bg-white p-6 rounded shadow-lg">
          <h2 className="text-lg font-bold mb-2">Provide Remarks</h2>
          <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)}
            className="border p-2 w-full mb-2" placeholder="Enter remarks here..."></textarea>
          <div className="flex justify-end">
            <button onClick={handleConfirmUpdate} className="bg-blue-500 text-white px-4 py-2 rounded mr-2">
              Confirm
            </button>
            <button onClick={() => setShowPopup(false)} className="bg-gray-500 text-white px-4 py-2 rounded">
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
  
  );
  
};

export default AdminDashboard;
