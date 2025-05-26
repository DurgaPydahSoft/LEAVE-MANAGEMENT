import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaComments, FaFilter } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {jsPDF} from "jspdf";
import autoTable from "jspdf-autotable"; // Import autoTable correctly
import * as XLSX from "xlsx-js-style";


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
  const [customDepartment, setCustomDepartment] = useState("");
  // const [allFilteredLeaves, setAllFilteredLeaves] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(false); // State to trigger re-fetch
  const [filterDepartment, setFilterDepartment] = useState("");
  const token = localStorage.getItem("token");

  const navigate = useNavigate();

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];

    axios
       .get("https://pydah-lms-backend.onrender.com/api/admin/leave-requests", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
      .then((response) => {
        const formattedRequests = response.data.leaveRequests.map(
          (request) => ({
            ...request,
            leaveRequest: {
              ...request.leaveRequest,
              startDate: request.leaveRequest?.startDate
                ? request.leaveRequest.startDate.split("T")[0]
                : "",
              endDate: request.leaveRequest?.endDate
                ? request.leaveRequest.endDate.split("T")[0]
                : "",
            },
          })
        );

        setLeaveRequests(formattedRequests);

        setFilteredRequests(
          formattedRequests.filter(
            (request) =>
              request.leaveRequest?.startDate &&
              request.leaveRequest.startDate >= today
          )
        );
        setLoading(false);
      })
      .catch((error) => console.error("Error fetching leave requests", error));

    axios
      .get(
        "https://pydah-lms-backend.onrender.com/api/admin/hod-leave-requests",{
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
      .then((response) => {
        const formattedHodRequests = response.data.leaveRequests.map(
          (request) => ({
            ...request,
            leaveRequest: {
              ...request.leaveRequest,
              startDate: request.leaveRequest?.startDate
                ? request.leaveRequest.startDate.split("T")[0]
                : "",
              endDate: request.leaveRequest?.endDate
                ? request.leaveRequest.endDate.split("T")[0]
                : "",
            },
          })
        );

        setHodLeaveRequests(formattedHodRequests);


        setFilteredHodRequests(
          formattedHodRequests.filter(
            (request) =>
              request.leaveRequest?.startDate &&
              request.leaveRequest.startDate >= today
          )
        );

        setLoading(false);
      })
      .catch((error) =>
        console.error("Error fetching HOD leave requests", error)
      );
  }, [refreshTrigger]);

  const handleOpenPopup = (
    employeeId,
    leaveRequestId,
    status,
    isHodRequest = false
  ) => {
    setSelectedRequest({ employeeId, leaveRequestId, status, isHodRequest });
    setRemarks("");
    setShowPopup(true);
  };

  const handleConfirmUpdate = async () => {
    setLoading(true);
    if (!selectedRequest) return;

    const { employeeId, leaveRequestId, status, isHodRequest } =
      selectedRequest;

      const finalRemarks =
      (remarks && remarks.trim()) ||
      (status === "Approved" ? "Approved by admin" : "Rejected by admin");
    

    // API URL based on whether it's an HOD request or Faculty request
    const url = isHodRequest
      ? "https://pydah-lms-backend.onrender.com/api/admin/hod-update-leave-request"
      : "https://pydah-lms-backend.onrender.com/api/admin/update-leave-request";

    console.log(employeeId, leaveRequestId, status);

    try {
      const response = await axios.put(url, {
        employeeId,
        leaveRequestId,
        status,
        remarks: finalRemarks,
      });

      if (response.status === 200) {
        alert("Leave request updated successfully!");
        setRefreshTrigger((prev) => !prev);
        setLoading(false);

        // Update frontend state based on request type (HOD or Faculty)
        if (isHodRequest) {
          setHodLeaveRequests((prev) =>
            prev.map((req) =>
              req.leaveRequest._id === leaveRequestId
                ? {
                    ...req,
                    leaveRequest: {
                      ...req.leaveRequest,
                      status,
                      remarks: finalRemarks,
                    },
                  }
                : req
            )
          );
        } else {
          setLeaveRequests((prev) =>
            prev.map((req) =>
              req.leaveRequest._id === leaveRequestId
                ? {
                    ...req,
                    leaveRequest: {
                      ...req.leaveRequest,
                      status,
                      remarks: finalRemarks,
                    },
                  }
                : req
            )
          );
        }

        setShowPopup(false); // Close the remarks popup after updating
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

  const handleDepartmentChange = (e) => {
    const selectedValue = e.target.value;

    if (selectedValue === "Others") {
      setFilterDepartment(""); // Reset selected department
      setCustomDepartment(""); // Clear any previous custom input
    } else {
      setFilterDepartment(selectedValue);
    }
  };
  const handleCustomDepartmentChange = (e) => {
    setCustomDepartment(e.target.value);
    setFilterDepartment(e.target.value); // Store the custom department
  };

  const applyFilters = () => {
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
        const leaveStartDate = req.leaveRequest
          ? new Date(req.leaveRequest.startDate)
          : null;
        return (
          leaveStartDate && leaveStartDate >= start && leaveStartDate <= end
        );
      });

      filteredHod = filteredHod.filter((req) => {
        const leaveStartDate = req.leaveRequest
          ? new Date(req.leaveRequest.startDate)
          : null;
        return (
          leaveStartDate && leaveStartDate >= start && leaveStartDate <= end
        );
      });
    }

    // Filter by Department (Only if a specific department is selected)
    if (filterDepartment && filterDepartment !== "All Departments") {
      filteredFaculty = filteredFaculty.filter(
        (req) => req.department === filterDepartment
      );
      filteredHod = filteredHod.filter(
        (req) => req.department === filterDepartment
      );
    }

    // Update the state with filtered data
    setFilteredRequests(filteredFaculty);
    setFilteredHodRequests(filteredHod);
    setShowFilter(false);
  };

  const exportToExcel = () => {
    let allFilteredLeaves = [...filteredRequests, ...filteredHodRequests];

    // Filter to only include approved requests
    let approvedRequests = allFilteredLeaves.filter(
      (req) => req.leaveRequest && req.leaveRequest.status === "Approved"
    );

    // Sorting by Department and Name
    approvedRequests.sort((a, b) => {
      if (a.department < b.department) return -1;
      if (a.department > b.department) return 1;

      const nameA = a.hodName || a.name;
      const nameB = b.hodName || b.name;
      return nameA.localeCompare(nameB);
    });

    // Prepare the data for Excel export
    const excelData = approvedRequests.map((req, index) => {
      const startDate = new Date(req.leaveRequest.startDate);
      const endDate = new Date(req.leaveRequest.endDate);
      const diffTime = endDate - startDate;
      const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));

      return [
        { v: index + 1, t: "n", s: { alignment: { horizontal: "center" } } }, // Serial No
        {
          v: req.hodName || req.name,
          s: { alignment: { horizontal: "left" } },
        }, // Name
        { v: req.department, s: { alignment: { horizontal: "left" } } }, // Department
        {
          v: req.hodId || req.employeeId,
          s: { alignment: { horizontal: "center" } },
        }, // Employee ID
        {
          v: req.leaveRequest.leaveType,
          s: { alignment: { horizontal: "center" } },
        }, // Leave Type
        {
          v: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
          s: { alignment: { horizontal: "center" } },
        }, // On Leave Period
        { v: diffDays + 1, t: "n", s: { alignment: { horizontal: "center" } } }, // No. of Days
        {
          v: req.leaveRequest.reason,
          s: { alignment: { horizontal: "left" } },
        }, // Reason
        {
          v: req.leaveRequest.remarks || "No remarks",
          s: { alignment: { horizontal: "left" } },
        }, // Remarks
      ];
    });

    // Column Headers with Styling
    const headers = [
      [
        {
          v: "Serial No",
          s: {
            font: { bold: true },
            fill: { fgColor: { rgb: "FFFF00" } },
            alignment: { horizontal: "center" },
          },
        },
        {
          v: "Name of the Faculty",
          s: { font: { bold: true }, fill: { fgColor: { rgb: "FFFF00" } } },
        },
        {
          v: "Department",
          s: { font: { bold: true }, fill: { fgColor: { rgb: "FFFF00" } } },
        },
        {
          v: "Employee ID",
          s: {
            font: { bold: true },
            fill: { fgColor: { rgb: "FFFF00" } },
            alignment: { horizontal: "center" },
          },
        },
        {
          v: "Leave Type",
          s: {
            font: { bold: true },
            fill: { fgColor: { rgb: "FFFF00" } },
            alignment: { horizontal: "center" },
          },
        },
        {
          v: "On Leave Period",
          s: {
            font: { bold: true },
            fill: { fgColor: { rgb: "FFFF00" } },
            alignment: { horizontal: "center" },
          },
        },
        {
          v: "No. of Days",
          s: {
            font: { bold: true },
            fill: { fgColor: { rgb: "FFFF00" } },
            alignment: { horizontal: "center" },
          },
        },
        {
          v: "Reason",
          s: { font: { bold: true }, fill: { fgColor: { rgb: "FFFF00" } } },
        },
        {
          v: "Remarks",
          s: { font: { bold: true }, fill: { fgColor: { rgb: "FFFF00" } } },
        },
      ],
    ];

    // Create worksheet and add headers + data
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...excelData]);

    // **Set Column Widths Dynamically**
    ws["!cols"] = [
      { wch: 10 }, // Serial No
      { wch: 25 }, // Name of the Faculty
      { wch: 20 }, // Department
      { wch: 15 }, // Employee ID
      { wch: 15 }, // Leave Type
      { wch: 25 }, // On Leave Period
      { wch: 10 }, // No. of Days
      { wch: 30 }, // Reason
      { wch: 20 }, // Remarks
    ];

    // Create a new workbook and append worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Approved Leave Requests");

    // Generate Excel file and create a downloadable URL
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const fileBlob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const fileURL = URL.createObjectURL(fileBlob);

    if (excelFile) {
      URL.revokeObjectURL(excelFile); // Revoke old file URL to release memory
    }

    setExcelFile(fileURL); // Store file URL in state
  };

const logoBase64 = "";

const exportToPDF = () => {
  let allFilteredLeaves = [...filteredRequests, ...filteredHodRequests];

  // Filter only approved requests
  let approvedRequests = allFilteredLeaves.filter(
    (req) => req.leaveRequest && req.leaveRequest.status === "Approved"
  );

  if (approvedRequests.length === 0) {
    alert("No approved leave requests available for export.");
    return;
  }

  // Identify if all requests belong to a single department
  let uniqueDepartments = [
    ...new Set(approvedRequests.map((req) => req.department)),
  ];
  let departmentTitle =
    uniqueDepartments.length === 1 ? `${uniqueDepartments[0]}` : "";

  // Identify the month with the most leave days
  let monthCount = {};
  approvedRequests.forEach((req) => {
    let startDate = new Date(req.leaveRequest.startDate);
    let endDate = new Date(req.leaveRequest.endDate);

    while (startDate <= endDate) {
      let monthKey = startDate.toLocaleString("en-US", { month: "long" });
      monthCount[monthKey] = (monthCount[monthKey] || 0) + 1;
      startDate.setDate(startDate.getDate() + 1); // Move to next day
    }
  });

  let mostFrequentMonth = Object.keys(monthCount).reduce((a, b) =>
    monthCount[a] > monthCount[b] ? a : b
  );

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // Prepare table data
  const tableData = approvedRequests.map((req, index) => {
    const startDate = new Date(req.leaveRequest.startDate);
    const endDate = new Date(req.leaveRequest.endDate);
    const diffDays = Math.ceil((endDate - startDate) / (1000 * 3600 * 24));

    return [
      index + 1, // Serial No
      req.hodName || req.name, // Name
      req.department || "N/A", // Department
      req.hodId || req.employeeId, // Employee ID
      req.leaveRequest.leaveType, // Leave Type
      `${formatDate(req.leaveRequest.startDate)} - ${formatDate(req.leaveRequest.endDate)}`, // Leave Period
      diffDays + 1, // No. of Days
      req.leaveRequest.reason, // Reason
      req.leaveRequest.remarks || "No remarks", // Remarks
    ];
  });

  // Column Headers
  const headers = [
    [
      "S. No",
      "Name",
      "Department",
      "Employee ID",
      "Leave Type",
      "On Leave Period",
      "No. of Days",
      "Reason",
      "Remarks",
    ],
  ];

  // Initialize jsPDF in Landscape mode
  const doc = new jsPDF("landscape");

  // ** College Letterhead Details **
  const collegeName = "Pydah College of Engineering";
  const collegeAddress = "An Autonomous Institution Kakinada | Andhra Pradesh | INDIA";
  const contactNumber = "Contact: +91 99513 54444";

  const title = `Approved Leaves ${departmentTitle} - ${mostFrequentMonth} - 2025`;

  // ** Add College Name & Address in Center **
  doc.setFont("times", "bold");
  doc.setTextColor("#333"); // Dark text
  doc.setFontSize(24);
  doc.text(collegeName, doc.internal.pageSize.width / 2, 15, { align: "center" });

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text(collegeAddress, doc.internal.pageSize.width / 2, 22, { align: "center" });

  // ** Add College Logo on the Right **
  const logoUrl =
    "https://static.wixstatic.com/media/bfee2e_7d499a9b2c40442e85bb0fa99e7d5d37~mv2.png"; // Replace with actual URL
  const logoWidth = 60;
  const logoHeight = 30;

  const img = new Image();
  img.src = logoUrl;
  img.onload = function () {
    doc.addImage(img, "PNG", 10, 5, logoWidth, logoHeight);

    // ** Add Title Below Header **
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#D35400"); // Light Orange Theme
    doc.text(title, doc.internal.pageSize.width / 2, 40, { align: "center" });

    // ** Add table using autoTable function **
    autoTable(doc, {
      startY: 50,
      head: headers,
      body: tableData,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: {
        fillColor: [255, 213, 128],
        textColor: [0, 0, 0],
        fontStyle: "bold",
      }, // Light Orange Header
      theme: "grid",
      margin: { left: 10, right: 10 },
      tableWidth: "auto",
      didDrawPage: function (data) {
        // ** Footer with College Name & Contact **
        let pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(10);
        doc.setTextColor("#333");
        doc.text(collegeName, 10, pageHeight - 10);
        doc.text(contactNumber, doc.internal.pageSize.width / 2, pageHeight - 10, {
          align: "center",
        });

        // ** Page Numbers at Bottom Right **
        let pageNumber = doc.internal.getNumberOfPages();
        doc.text(`Page ${pageNumber}`, doc.internal.pageSize.width - 20, pageHeight - 10);
      },
    });
    // ** Add Authorization Signature at Right Bottom **
let signatureY = doc.lastAutoTable.finalY + 30; // Adjust positioning if needed
doc.setFontSize(12);
doc.setFont("helvetica", "bold");
doc.text("Principal Signature", doc.internal.pageSize.width - 60, signatureY);

    // ** Add Timestamp on the Last Page at Bottom Left **
    let finalY = doc.lastAutoTable.finalY + 20;
    let timestamp = new Date().toLocaleString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    doc.setFontSize(10);
    doc.setTextColor("#333");
    doc.text(`Generated on: ${timestamp}`, 10, finalY);

    // ** Save the PDF **
    doc.save(`Approved_Leave_Requests_${mostFrequentMonth}.pdf`);
  };

  // Fallback: If the image doesn't load in time, still generate PDF without it
  setTimeout(() => {
    if (!img.complete) {
      console.warn("Logo image failed to load, generating PDF without it.");
      doc.text(title, doc.internal.pageSize.width / 2, 40, { align: "center" });
      autoTable(doc, { startY: 50, head: headers, body: tableData });
      doc.text(`Generated on: ${timestamp}`, 10, doc.lastAutoTable.finalY + 20);
      doc.save(`Approved_Leave_Requests_${mostFrequentMonth}.pdf`);
    }
  }, 3000);
};


  
  

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // ✅ Improved Loader UI for Better User Experience
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

  // Function to categorize leave requests by status
  const categorizeRequestsByStatus = () => {
    return {
      forwardedByHod: filteredRequests.filter(
        (req) => req.leaveRequest.status === "Forwarded by HOD"
      ),
      approved: filteredRequests.filter(
        (req) => req.leaveRequest.status === "Approved"
      ),
      rejected: filteredRequests.filter(
        (req) => req.leaveRequest.status === "Rejected"
      ),
    };
  };

  const { forwardedByHod, approved, rejected } = categorizeRequestsByStatus();

  return (
    <div className="min-h-screen bg-background p-6 flex flex-col lg:flex-row justify-center items-center w-full">
      <div className=" mx-auto p-6 bg-background rounded-lg shadow-inner w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary text-center sm:text-left">
            Admin Dashboard
          </h1>

          {/* Button Groups (Stacked on small screens) */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <button
              className="bg-primary text-textLight px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition flex items-center gap-2 w-full sm:w-auto justify-center"
              onClick={() => setShowFilter(true)}
            >
              <FaFilter /> Filters
            </button>

            <button
              className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-700 transition w-full sm:w-auto"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
          <button
            onClick={exportToPDF}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Download PDF
          </button>

          {/* Export Buttons (Stacked on small screens) */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <button
              className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700 transition w-full sm:w-auto"
              onClick={exportToExcel}
            >
              Export to Excel
            </button>

            {excelFile && (
              <a
                href={excelFile}
                download="Approved_Leave_Requests.xlsx"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition w-full sm:w-auto text-center"
              >
                Download Excel
              </a>
            )}
          </div>
        </div>

        {/* HOD Leave Requests Section */}
        <div className="mb-6">
          <button
            className="bg-primary text-textLight px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition mb-4"
            onClick={() => setShowHodRequests(!showHodRequests)}
          >
            {showHodRequests ? "Hide" : "Show"} HOD Leave Requests
          </button>

          {showHodRequests && (
            <section>
              <h2 className="text-xl font-semibold text-primary mb-4">
                HOD Leave Requests
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredHodRequests.map((request) => (
                  <div
                    key={request._id}
                    className="bg-white p-6 rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300"
                  >
                    <h2 className="text-xl font-semibold text-primary mb-2">
                      {request.hodName}
                    </h2>
                    <p className="text-gray-600 text-sm mb-2">
                      <span className="font-medium">HOD-ID:</span>{" "}
                      {request.hodId}
                    </p>
                    <p className="text-gray-600 text-sm mb-2">
                      <span className="font-medium">Department:</span>{" "}
                      {request.department}
                    </p>
                    <p className="text-gray-600 text-sm mb-2">
                      <span className="font-medium">Leave Type:</span>{" "}
                      {request.leaveRequest.leaveType}
                    </p>
                    <p className="text-gray-600 text-sm mb-2">
                      <span className="font-medium">Leave:</span>{" "}
                      {request.leaveRequest.startDate} -{" "}
                      {request.leaveRequest.endDate}
                    </p>

                    <p
                      className={`font-semibold text-sm mb-2 ${
                        request.leaveRequest.status === "Approved"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      <span className="font-medium">Status:</span>{" "}
                      {request.leaveRequest.status}
                    </p>

                    <p className="text-gray-600 text-sm mb-4">
                      <span className="font-medium">Remarks:</span>{" "}
                      {request.remarks || "No remarks"}
                    </p>

                    {(request.leaveRequest.status === "Pending" ||
                      request.leaveRequest.status === "Forwarded by HOD") && (
                      <div className="flex gap-3 mt-4">
                        <button
                          className="bg-green-500 text-white px-5 py-2 rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-300 w-full sm:w-auto"
                          onClick={() =>
                            handleOpenPopup(
                              request.hodId,
                              request.leaveRequest._id,
                              "Approved",
                              true
                            )
                          }
                        >
                          Approve
                        </button>

                        <button
                          className="bg-red-500 text-white px-5 py-2 rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-300 w-full sm:w-auto"
                          onClick={() =>
                            handleOpenPopup(
                              request.hodId,
                              request.leaveRequest._id,
                              "Rejected",
                              true
                            )
                          }
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Forwarded by HOD Section */}
        {forwardedByHod.length > 0 ? (
          <section>
            <h2 className="text-xl font-bold text-primary mb-4">
              Forwarded by HOD
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {forwardedByHod.map((request) => (
                <div
                  key={request.leaveRequest._id}
                  className="bg-white p-6 rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200"
                >
                  {/* Leave Request Content */}
                  <h2 className="text-xl font-semibold text-primary mb-2">
                    {request.name}
                  </h2>

                  <p className="text-gray-600 text-sm mb-2">
                    <span className="font-medium">Employee ID:</span>{" "}
                    {request.employeeId}
                  </p>

                  <p className="text-gray-600 text-sm mb-2">
                    <span className="font-medium">Department:</span>{" "}
                    {request.department}
                  </p>

                  <p className="text-gray-600 text-sm mb-2">
                    <span className="font-medium">Leave:</span>{" "}
                    {new Date(
                      request.leaveRequest.startDate
                    ).toLocaleDateString()}{" "}
                    -{" "}
                    {new Date(
                      request.leaveRequest.endDate
                    ).toLocaleDateString()}
                  </p>

                  <p
                    className={`font-semibold text-sm mb-2 ${
                      request.leaveRequest.status === "Approved"
                        ? "text-green-600"
                        : request.leaveRequest.status === "Rejected"
                        ? "text-red-600"
                        : "text-blue-600"
                    }`}
                  >
                    {request.leaveRequest.status}
                  </p>

                  <p className="text-gray-600 text-sm mb-4">
                    <span className="font-medium">Remarks:</span>{" "}
                    {request.leaveRequest.remarks || "No remarks"}
                  </p>

                  <div className="flex gap-3 mt-4">
                    <button
                      className="bg-primary text-textLight px-5 py-2 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-300 w-full sm:w-auto"
                      onClick={() =>
                        handleOpenPopup(
                          request.employeeId,
                          request.leaveRequest._id,
                          "Approved"
                        )
                      }
                    >
                      Approve
                    </button>

                    <button
                      className="bg-red-500 text-white px-5 py-2 rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-300 w-full sm:w-auto"
                      onClick={() =>
                        handleOpenPopup(
                          request.employeeId,
                          request.leaveRequest._id,
                          "Rejected"
                        )
                      }
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <p className="text-gray-500 text-center text-lg mt-6">
            No Forwarded requests
          </p>
        )}

        {/* Approved Section */}
        {approved.length > 0 ? (
          <section>
            <h2 className="text-xl font-bold text-primary m-4 mt-8 ">
              Approved
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {approved.map((request) => (
                <div
                  key={request.leaveRequest._id}
                  className="bg-white p-6 rounded-lg shadow-inner hover:shadow-lg transition-all duration-300 border border-gray-200"
                >
                  {/* Leave Request Content */}
                  <h2 className="text-xl font-semibold text-primary mb-2">
                    {request.name}
                  </h2>

                  <p className="text-gray-600 text-sm mb-2">
                    <span className="font-medium">Employee ID:</span>{" "}
                    {request.employeeId}
                  </p>

                  <p className="text-gray-600 text-sm mb-2">
                    <span className="font-medium">Department:</span>{" "}
                    {request.department}
                  </p>

                  <p className="text-gray-600 text-sm mb-2">
                    <span className="font-medium">Leave:</span>{" "}
                    {new Date(
                      request.leaveRequest.startDate
                    ).toLocaleDateString()}{" "}
                    -{" "}
                    {new Date(
                      request.leaveRequest.endDate
                    ).toLocaleDateString()}
                  </p>

                  <p className="font-semibold text-sm mb-2 text-green-600">
                    {request.leaveRequest.status}
                  </p>

                  <p className="text-gray-600 text-sm mb-4">
                    <span className="font-medium">Remarks:</span>{" "}
                    {request.leaveRequest.remarks || "No remarks"}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <p className="text-gray-500 text-center text-lg mt-6">
            No approved requests
          </p>
        )}

        {/* Rejected Section */}
        {rejected.length > 0 ? (
          <section>
            <h2 className="text-xl font-bold text-primary mb-4">Rejected</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {rejected.map((request) => (
                <div
                  key={request.leaveRequest._id}
                  className="bg-white p-6 rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200"
                >
                  {/* Leave Request Content */}
                  <h2 className="text-xl font-semibold text-primary mb-2">
                    {request.name}
                  </h2>

                  <p className="text-gray-600 text-sm mb-2">
                    <span className="font-medium">Employee ID:</span>{" "}
                    {request.employeeId}
                  </p>

                  <p className="text-gray-600 text-sm mb-2">
                    <span className="font-medium">Department:</span>{" "}
                    {request.department}
                  </p>

                  <p className="text-gray-600 text-sm mb-2">
                    <span className="font-medium">Leave:</span>{" "}
                    {new Date(
                      request.leaveRequest.startDate
                    ).toLocaleDateString()}{" "}
                    -{" "}
                    {new Date(
                      request.leaveRequest.endDate
                    ).toLocaleDateString()}
                  </p>

                  <p className="font-semibold text-sm mb-2 text-red-600">
                    {request.leaveRequest.status}
                  </p>

                  <p className="text-gray-600 text-sm mb-4">
                    <span className="font-medium">Remarks:</span>{" "}
                    {request.leaveRequest.remarks || "No remarks"}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <p className="text-gray-500 text-center text-lg mt-6">
            No rejected requests
          </p>
        )}
      </div>

      {/* Popup for Remarks */}
      {showPopup && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-900 bg-opacity-50 backdrop-blur-sm">
          <div className="bg-background p-6 rounded-xl shadow-2xl w-[90%] sm:w-[400px] relative">
            <h2 className="text-lg font-semibold text-primary mb-4">
              Enter Remarks
            </h2>

            {/* Textarea for Remarks */}
            <textarea
              className="w-full border border-gray-300 rounded-md p-3 bg-white text-gray-700 focus:ring-2 focus:ring-primary focus:outline-none resize-none shadow-sm"
              placeholder="Enter remarks (optional)"
              rows="4"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-4">
              <button
                className="bg-gray-400 text-white px-5 py-2 rounded-lg shadow-md hover:bg-gray-500 transition focus:ring-2 focus:ring-gray-400"
                onClick={() => setShowPopup(false)}
              >
                Cancel
              </button>

              <button
                className="bg-primary text-light px-5 py-2 rounded-lg shadow-md hover:bg-[#315428] transition focus:ring-2 focus:ring-primary"
                onClick={handleConfirmUpdate}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Popup */}
      {showFilter && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-900 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Apply Filters
            </h2>

            {/* Status Filter */}
            <label className="block mb-2 text-gray-700 font-medium">
              Status:
            </label>
            <select
              className="w-full border rounded-lg p-2 mb-4 bg-gray-100 focus:ring-2 focus:ring-blue-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All</option>
              <option value="Forwarded by HOD">Forwarded by HOD</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>

            {/* Department Filter */}
            <label className="block mb-2 text-gray-700 font-medium">
              Department:
            </label>
            <div className="input-group">
              <select
                className="w-full border rounded-lg p-2 mb-4 bg-gray-100 focus:ring-2 focus:ring-blue-500"
                value={
                  filterDepartment === customDepartment
                    ? "Others"
                    : filterDepartment
                }
                onChange={handleDepartmentChange}
              >
                <option value="">All Departments</option>
                <option value="CSE">CSE</option>
                <option value="Agriculture">Agriculture</option>
                <option value="ECE">ECE</option>
                <option value="Mech">Mech</option>
                <option value="Civil">Civil</option>
                <option value="Non-Teaching">Non-Teaching</option>
                <option value="Others">Others</option>
              </select>
            </div>

            {/* Show input field if "Others" is selected */}
            {filterDepartment === customDepartment && (
              <div className="input-group mt-2">
                <input
                  type="text"
                  placeholder="Please specify department"
                  value={customDepartment}
                  onChange={handleCustomDepartmentChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Start Date Filter */}
            <label className="block mb-2 text-gray-700 font-medium">
              Start Date:
            </label>
            <input
              type="date"
              className="w-full border rounded-lg p-2 mb-4 bg-gray-100 focus:ring-2 focus:ring-blue-500"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            {/* End Date Filter */}
            <label className="block mb-2 text-gray-700 font-medium">
              End Date:
            </label>
            <input
              type="date"
              className="w-full border rounded-lg p-2 mb-4 bg-gray-100 focus:ring-2 focus:ring-blue-500"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />

            {/* Buttons */}
            <div className="flex justify-between gap-3">
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition w-full"
                onClick={() => setShowFilter(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition w-full"
                onClick={applyFilters}
              >
                Apply Filters
              </button>
              <button
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition w-full"
                onClick={() => {
                  setFilterStatus("");
                  setFilterDepartment(""); // Reset department filter
                  setStartDate("");
                  setEndDate("");
                  applyFilters(); // Reapply default filters
                }}
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
