// Import all required models and utilities
const { 
  User, 
  Campus, 
  LeaveRequest, 
  Principal, 
  HOD, 
  Employee,
  CCLWorkRequest
} = require('../models');
const jwt = require('jsonwebtoken');
const { validateEmail } = require('../utils/validators');
const { getBranchesForCampus } = require('../config/branchOptions');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// Principal login
exports.login = async (req, res) => {
  try {
    const { email, password, campus } = req.body;

    if (!email || !password || !campus) {
      return res.status(400).json({ msg: 'Please provide all required fields' });
    }

    // First try to find in User model (for principals created by super admin)
    let principal = await User.findOne({ 
      email: email.toLowerCase(),
      role: 'principal'
    });

    // If not found in User model, try Principal model
    if (!principal) {
      principal = await Principal.findOne({ email: email.toLowerCase() });
      if (!principal) {
        return res.status(401).json({ msg: 'Invalid credentials' });
      }

      if (principal.status !== 'active') {
        return res.status(401).json({ msg: 'Account is inactive' });
      }
    } else {
      if (!principal.isActive) {
        return res.status(401).json({ msg: 'Account is inactive' });
      }
    }

    const isMatch = await principal.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ msg: 'Invalid credentials' });
    }

    // Update lastLogin
    principal.lastLogin = Date.now();
    await principal.save();

    // Get campus type with proper capitalization
    const campusType = campus.charAt(0).toUpperCase() + campus.slice(1);

    // Validate that the principal belongs to the requested campus
    if (principal.schema.obj.campus.type === String) {
      // User model - campus is a string
      if (principal.campus.toLowerCase() !== campus.toLowerCase()) {
        return res.status(401).json({ msg: 'Invalid campus for this principal' });
      }
    } else {
      // Principal model - campus is an object
      if (principal.campus.type !== campusType) {
        return res.status(401).json({ msg: 'Invalid campus for this principal' });
      }
    }

    // Create token with campus type
    const token = jwt.sign(
      { 
        id: principal._id, 
        role: 'principal',
        campus: campusType,
        modelType: principal.schema.obj.campus.type === String ? 'User' : 'Principal'
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Prepare response based on model type
    const userResponse = {
      id: principal._id,
      name: principal.name,
      email: principal.email,
      role: 'principal',
      lastLogin: principal.lastLogin
    };

    // Add campus data based on model type
    if (principal.schema.obj.campus.type === String) {
      // User model - campus is a string
      userResponse.campus = campusType.toLowerCase();
    } else {
      // Principal model - campus is an object
      userResponse.campus = {
        type: campusType,
        name: `${campusType} Campus`,
        location: principal.campus?.location || 'Default Location'
      };
    }

    res.json({
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Principal Login Error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Create HOD
exports.createHOD = async (req, res) => {
  try {
    const { name, email, password, HODId, department } = req.body;
    const principalId = req.user.id;

    if (!name || !email || !password || !department || !department.code) {
      return res.status(400).json({ msg: 'Please provide all required fields' });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({ msg: 'Please provide a valid email address' });
    }

    // Check if email already exists
    const existingHOD = await HOD.findOne({ email: email.toLowerCase() });
    if (existingHOD) {
      return res.status(400).json({ msg: 'HOD with this email already exists' });
    }

    // First find the principal in User model
    let principal = await User.findOne({
      _id: principalId,
      role: 'principal'
    });

    const isUserModel = !!principal; // true if found in User model

    // If not in User model, try Principal model
    if (!principal) {
      principal = await Principal.findById(principalId);
      if (!principal) {
        return res.status(404).json({ msg: 'Principal not found in either model' });
      }
    }

    // Get campus type based on model
    const campusType = isUserModel ? 
      principal.campus.charAt(0).toUpperCase() + principal.campus.slice(1) :
      principal.campus.type;

    if (!campusType) {
      return res.status(400).json({ msg: 'Invalid campus type for principal' });
    }

    // Log the campus information for debugging
    console.log('Creating HOD:', {
      principalId,
      principal: {
        id: principal._id,
        model: isUserModel ? 'User' : 'Principal',
        campus: principal.campus
      },
      department,
      isUserModel
    });

    // Create new HOD with required fields
    const hod = new HOD({
      name,
      email: email.toLowerCase(),
      password,
      HODId: HODId || email.toLowerCase(),
      department: {
        name: department.name || department.code,
        code: department.code,
        campusType: campusType
      },
      status: 'active',
      lastLogin: null,
      createdBy: principalId,
      createdByModel: isUserModel ? 'User' : 'Principal',
      campus: principalId,
      campusModel: isUserModel ? 'User' : 'Principal'
    });

    // Log the HOD object before saving
    console.log('HOD to save:', {
      name: hod.name,
      email: hod.email,
      department: hod.department,
      HODId: hod.HODId,
      createdByModel: hod.createdByModel,
      campusModel: hod.campusModel,
      principalId: hod.campus
    });

    const savedHOD = await hod.save();

    // Assign HOD to branch in campus document
    let campusDoc;
    if (isUserModel) {
      campusDoc = await Campus.findOne({ name: principal.campus.toLowerCase() });
    } else {
      campusDoc = await Campus.findOne({ type: principal.campus.type });
    }
    if (campusDoc) {
      const branch = campusDoc.branches.find(b => b.code === department.code);
      if (branch) {
        branch.hodId = savedHOD._id;
        await campusDoc.save();
      }
    }

    res.status(201).json({
      msg: 'HOD created successfully',
      hod: {
        id: savedHOD._id,
        name: savedHOD.name,
        email: savedHOD.email,
        department: savedHOD.department,
        status: savedHOD.status,
        createdByModel: savedHOD.createdByModel,
        campusModel: savedHOD.campusModel
      }
    });
  } catch (error) {
    console.error('Create HOD Error:', error);
    res.status(500).json({ msg: error.message || 'Server error' });
  }
};

// Get all HODs
exports.getAllHODs = async (req, res) => {
  try {
    // Get the principal's ID and campus from the authenticated user
    const principalId = req.user.id;
    const campusType = req.user.campus;
    const modelType = req.user.modelType || (req.principal.constructor.modelName === 'User' ? 'User' : 'Principal');

    console.log('Principal Info:', {
      principalId,
      campusType,
      modelType,
      principal: req.principal
    });

    // Find all HODs where campus matches the principal's ID and campus type matches
    const query = {
      campus: principalId,
      'department.campusType': campusType,
      campusModel: modelType
    };

    console.log('HOD Query:', query);

    const hods = await HOD.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    console.log('Fetched HODs:', {
      principalId,
      campusType,
      modelType,
      hodCount: hods.length,
      hods: hods.map(h => ({
        id: h._id,
        name: h.name,
        department: h.department,
        campusModel: h.campusModel
      }))
    });

    res.json(hods);
  } catch (error) {
    console.error('Get All HODs Error:', error);
    res.status(500).json({ msg: error.message || 'Server error' });
  }
};

// Get single HOD
exports.getHOD = async (req, res) => {
  try {
    const hod = await HOD.findOne({
      _id: req.params.id,
      campus: req.principal._id
    }).select('-password');

    if (!hod) {
      return res.status(404).json({ msg: 'HOD not found' });
    }

    res.json(hod);
  } catch (error) {
    console.error('Get HOD Error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Update HOD
exports.updateHOD = async (req, res) => {
  try {
    const { name, email, department, status } = req.body;
    const hodId = req.params.id;

    const hod = await HOD.findOne({
      _id: hodId,
      campus: req.principal._id
    });

    if (!hod) {
      return res.status(404).json({ msg: 'HOD not found' });
    }

    // If email is being changed, check if new email already exists
    if (email && email !== hod.email) {
      const existingHOD = await HOD.findOne({ email: email.toLowerCase() });
      if (existingHOD) {
        return res.status(400).json({ msg: 'Email already in use' });
      }
      hod.email = email.toLowerCase();
    }

    if (name) hod.name = name;
    if (department) {
      if (department.name) hod.department.name = department.name;
      if (department.code) hod.department.code = department.code;
    }
    if (status) hod.status = status;

    await hod.save();

    res.json({
      msg: 'HOD updated successfully',
      hod: {
        id: hod._id,
        name: hod.name,
        email: hod.email,
        department: hod.department,
        status: hod.status
      }
    });
  } catch (error) {
    console.error('Update HOD Error:', error);
    if (error.message.includes('Invalid department code')) {
      return res.status(400).json({ msg: error.message });
    }
    res.status(500).json({ msg: 'Server error' });
  }
};

// Delete HOD
exports.deleteHOD = async (req, res) => {
  try {
    const hod = await HOD.findOne({
      _id: req.params.id,
      campus: req.principal._id
    });

    if (!hod) {
      return res.status(404).json({ msg: 'HOD not found' });
    }

    await hod.remove();
    res.json({ msg: 'HOD removed' });
  } catch (error) {
    console.error('Delete HOD Error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get departments for campus
exports.getDepartments = async (req, res) => {
  try {
    const departments = getBranchesForCampus(req.principal.campus.type);
    res.json(departments);
  } catch (error) {
    console.error('Get Departments Error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get campus leave requests
exports.getCampusLeaves = async (req, res) => {
  try {
    console.log('Getting campus leaves for:', {
      campus: req.user.campus,
      modelType: req.user.modelType
    });

    // First find the principal to get correct campus type
    let principal;
    let campusType;
    let normalizedCampus;
    
    if (req.user.modelType === 'User') {
      principal = await User.findOne({
        _id: req.user.id,
        role: 'principal'
      });
      campusType = principal.campus.charAt(0).toUpperCase() + principal.campus.slice(1);
      normalizedCampus = principal.campus.toLowerCase();
    } else {
      principal = await Principal.findById(req.user.id);
      campusType = principal.campus.type;
      normalizedCampus = principal.campus.type.toLowerCase();
    }

    if (!principal) {
      return res.status(404).json({ msg: 'Principal not found' });
    }

    // Find all employees in the campus with populated leave requests
    const employees = await Employee.find({
      campus: normalizedCampus
    })
    .select('name email department employeeId leaveRequests')
    .populate({
      path: 'leaveRequests.alternateSchedule.periods.substituteFaculty',
      select: 'name'
    });

    console.log('Found employees:', {
      count: employees.length,
      campus: normalizedCampus
    });

    // Collect all forwarded and approved leave requests with populated faculty details
    const leaveRequests = employees.reduce((acc, employee) => {
      const employeeLeaves = employee.leaveRequests
        .filter(request => request.status === 'Forwarded by HOD' || request.status === 'Approved')
        .map(request => ({
        ...request.toObject(),
          employeeId: employee._id,
          employeeName: employee.name,
          employeeEmail: employee.email,
          employeeEmployeeId: employee.employeeId,
          employeeDepartment: employee.department,
          alternateSchedule: request.alternateSchedule.map(schedule => ({
            date: schedule.date,
            periods: schedule.periods.map(period => ({
              periodNumber: period.periodNumber,
              substituteFaculty: period.substituteFaculty ? period.substituteFaculty.name : 'Unknown Faculty',
              assignedClass: period.assignedClass
            }))
          }))
      }));
      return [...acc, ...employeeLeaves];
    }, []);

    // Sort by creation date, most recent first
    leaveRequests.sort((a, b) => new Date(b.appliedOn) - new Date(a.appliedOn));

    console.log('Found leave requests:', {
      count: leaveRequests.length,
      forwarded: leaveRequests.filter(req => req.status === 'Forwarded by HOD').length,
      approved: leaveRequests.filter(req => req.status === 'Approved').length,
      campus: normalizedCampus
    });

    res.json(leaveRequests);
  } catch (error) {
    console.error('Get Campus Leaves Error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get dashboard data
exports.getDashboard = async (req, res) => {
  try {
    console.log('Getting dashboard data for principal:', {
      id: req.user.id,
      campus: req.user.campus,
      modelType: req.user.modelType
    });

    // First find the principal to get correct campus type
    let principal;
    let campusType;
    
    if (req.user.modelType === 'User') {
      principal = await User.findOne({
        _id: req.user.id,
        role: 'principal'
      });
      campusType = principal.campus.charAt(0).toUpperCase() + principal.campus.slice(1);
    } else {
      principal = await Principal.findById(req.user.id);
      campusType = principal.campus.type;
    }

    if (!principal) {
      return res.status(404).json({ msg: 'Principal not found' });
    }

    // Get HODs from both models
    const [userModelHods, hodModelHods] = await Promise.all([
      User.find({
        role: 'hod',
        campus: principal.campus.toLowerCase()
      }).select('branchCode isActive'),
      HOD.find({
        'department.campusType': campusType,
        campus: principal._id
      }).select('department status')
    ]);

    // Calculate total and active HODs
    const totalHODs = userModelHods.length + hodModelHods.length;
    const activeHODs = 
      userModelHods.filter(h => h.isActive).length +
      hodModelHods.filter(h => h.status === 'active').length;

    // Get pending leave requests
    const pendingLeaveRequests = await LeaveRequest.countDocuments({
      campus: principal.campus.toLowerCase(),
      status: 'Pending'
    });

    // Calculate department distribution
    const departmentDistribution = {};

    // Add User model HODs to distribution
    userModelHods.forEach(hod => {
      const code = hod.branchCode;
      if (!departmentDistribution[code]) {
        departmentDistribution[code] = {
          total: 0,
          active: 0
        };
      }
      departmentDistribution[code].total++;
      if (hod.isActive) {
        departmentDistribution[code].active++;
      }
    });

    // Add HOD model HODs to distribution
    hodModelHods.forEach(hod => {
      const code = hod.department.code;
      if (!departmentDistribution[code]) {
        departmentDistribution[code] = {
          total: 0,
          active: 0
        };
      }
      departmentDistribution[code].total++;
      if (hod.status === 'active') {
        departmentDistribution[code].active++;
      }
    });

    // Get employee statistics
    const totalEmployees = await User.countDocuments({
      role: 'employee',
      campus: principal.campus.toLowerCase()
    });

    // Format department distribution for response
    const formattedDepartments = Object.entries(departmentDistribution).map(([code, stats]) => ({
      code,
      total: stats.total,
      active: stats.active,
      inactive: stats.total - stats.active
    }));

    console.log('Dashboard statistics:', {
      totalHODs,
      activeHODs,
      pendingLeaveRequests,
      departmentCount: formattedDepartments.length,
      totalEmployees
    });

    res.json({
      totalHODs,
      activeHODs,
      inactiveHODs: totalHODs - activeHODs,
      pendingLeaveRequests,
      departments: formattedDepartments,
      totalEmployees,
      campusType
    });
  } catch (error) {
    console.error('Get Dashboard Error:', error);
    res.status(500).json({ 
      msg: error.message || 'Server error',
      timestamp: new Date().toISOString()
    });
  }
};

// Get Campus Details
exports.getCampusDetails = async (req, res) => {
  try {
    const principalId = req.user.id;

    const campus = await Campus.findOne({ principalId })
      .populate('branches.hodId', 'name email lastLogin');

    if (!campus) {
      return res.status(404).json({ msg: 'Campus not found' });
    }

    res.json(campus);
  } catch (error) {
    console.error('Get Campus Details Error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Update Branch
exports.updateBranch = async (req, res) => {
  try {
    const { branchId, name, isActive } = req.body;
    const principalId = req.user.id;

    const campus = await Campus.findOne({ principalId });
    if (!campus) {
      return res.status(404).json({ msg: 'Campus not found' });
    }

    const branch = campus.branches.id(branchId);
    if (!branch) {
      return res.status(404).json({ msg: 'Branch not found' });
    }

    if (name) branch.name = name;
    if (typeof isActive === 'boolean') {
      branch.isActive = isActive;
      // Update HOD status
      if (branch.hodId) {
        await User.findByIdAndUpdate(branch.hodId, { isActive });
      }
    }

    await campus.save();
    res.json({ msg: 'Branch updated successfully' });
  } catch (error) {
    console.error('Update Branch Error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get Leave Requests
exports.getLeaveRequests = async (req, res) => {
  try {
    const { campus } = req.user;
    const { status, startDate, endDate } = req.query;

    let query = { campus };

    if (status) {
      query.status = status;
    }

    if (startDate && endDate) {
      query.startDate = { $gte: new Date(startDate) };
      query.endDate = { $lte: new Date(endDate) };
    }

    const leaveRequests = await LeaveRequest.find(query)
      .populate('employeeId', 'name email')
      .sort('-createdAt');

    res.json(leaveRequests);
  } catch (error) {
    console.error('Get Leave Requests Error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Update Leave Request
exports.updateLeaveRequest = async (req, res) => {
  try {
    const { action, remarks } = req.body;
    const leaveId = req.params.id;

    console.log('Updating leave request:', {
      leaveId,
      action,
      remarks,
      user: {
        id: req.user.id,
        campus: req.user.campus,
        modelType: req.user.modelType
      }
    });

    if (!leaveId || !action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ msg: 'Please provide valid action (approve/reject)' });
    }

    // Find the employee with the leave request
    let leaveRequest;
    let employee;
    try {
      // First try to find the leave request directly
      leaveRequest = await LeaveRequest.findById(leaveId);
      
      // If not found, try to find it in the employee's leave requests
      if (!leaveRequest) {
        console.log('Leave request not found directly, searching in employee documents...');
        
        // Try to find in Employee model
        const employeeWithLeave = await Employee.findOne({
      'leaveRequests._id': leaveId
    });
        
        if (employeeWithLeave) {
          // Get the leave request from the employee document
          leaveRequest = employeeWithLeave.leaveRequests.id(leaveId);
          // Set the employee directly since we found it
          employee = employeeWithLeave;
          console.log('Found leave request in employee document:', {
            employeeId: employeeWithLeave._id,
            leaveRequestId: leaveId,
            employeeName: employeeWithLeave.name
          });
        }
      } else {
        // If found directly, find the employee
        employee = await Employee.findById(leaveRequest.employeeId);
      }

      if (!leaveRequest) {
        console.log('Leave request not found:', {
          leaveId,
          error: 'Leave request not found in database or employee documents'
        });
        return res.status(404).json({ 
          msg: 'Leave request not found',
          details: {
            leaveId,
            error: 'Leave request not found in database or employee documents'
          }
        });
      }

    if (!employee) {
        console.log('Employee not found for leave request:', {
          leaveId,
          employeeId: leaveRequest.employeeId || 'Not found',
          employeeModel: 'Employee'
        });
        return res.status(404).json({ 
          msg: 'Employee not found',
          details: {
            leaveId,
            employeeId: leaveRequest.employeeId || 'Not found',
            employeeModel: 'Employee'
          }
        });
    }
    } catch (error) {
      console.error('Error finding leave request or employee:', {
        leaveId,
        error: error.message,
        stack: error.stack
      });
      return res.status(500).json({ 
        msg: 'Error finding leave request or employee',
        details: {
          leaveId,
          error: error.message
        }
      });
    }

    console.log('Found leave request and employee:', {
      leaveRequest: {
        id: leaveRequest._id,
        type: leaveRequest.leaveType,
        status: leaveRequest.status,
        employeeId: employee._id,
        employeeModel: 'Employee'
      },
      employee: {
        id: employee._id,
        name: employee.name,
        campus: employee.campus,
        cclBalance: employee.cclBalance,
        leaveBalance: employee.leaveBalance
      }
    });

    // Get principal's campus type
    let principalCampus;
    if (req.user.modelType === 'User') {
      const principal = await User.findOne({
        _id: req.user.id,
        role: 'principal'
      });
      principalCampus = principal.campus.toLowerCase();
    } else {
      const principal = await Principal.findById(req.user.id);
      principalCampus = principal.campus.type.toLowerCase();
    }

    // Verify Principal has authority over this campus
    const normalizedEmployeeCampus = employee.campus.toLowerCase();
    const normalizedPrincipalCampus = principalCampus.toLowerCase();

    console.log('Campus comparison:', {
      employeeCampus: normalizedEmployeeCampus,
      principalCampus: normalizedPrincipalCampus,
      match: normalizedEmployeeCampus === normalizedPrincipalCampus
    });

    if (normalizedEmployeeCampus !== normalizedPrincipalCampus) {
      console.log('Campus mismatch:', {
        employeeCampus: normalizedEmployeeCampus,
        principalCampus: normalizedPrincipalCampus
      });
      return res.status(403).json({ 
        msg: 'Not authorized to update this leave request',
        details: {
          employeeCampus: normalizedEmployeeCampus,
          principalCampus: normalizedPrincipalCampus
        }
      });
        }

    // Store previous status for balance adjustment
    const previousStatus = leaveRequest.status;

    // Update the leave request based on action
    if (action === 'approve') {
      // Check if already approved
      if (previousStatus === 'Approved') {
        console.log('Leave request already approved:', {
          leaveId,
          previousStatus,
          employeeId: employee._id
        });
        return res.status(400).json({ msg: 'Leave request is already approved' });
      }

      // Check balance before approving
      if (leaveRequest.leaveType === 'CCL') {
        // Calculate actual days to deduct
        const daysToDeduct = leaveRequest.isHalfDay ? 0.5 : leaveRequest.numberOfDays;
        
        console.log('Checking CCL balance:', {
          employeeId: employee._id,
          employeeName: employee.name,
          currentBalance: employee.cclBalance,
          requestedDays: daysToDeduct,
          isHalfDay: leaveRequest.isHalfDay,
          numberOfDays: leaveRequest.numberOfDays
        });

        // Check if employee has sufficient balance
        if (employee.cclBalance < daysToDeduct) {
          console.log('Insufficient CCL balance:', {
            employeeId: employee._id,
            employeeName: employee.name,
            requestedDays: daysToDeduct,
            availableBalance: employee.cclBalance
          });
          return res.status(400).json({ 
            msg: `Insufficient CCL balance. Available: ${employee.cclBalance} days, Required: ${daysToDeduct} days`
          });
        }
      } else if (leaveRequest.leaveType === 'CL') {
        // For CL, deduct from regular leave balance
        employee.leaveBalance -= leaveRequest.numberOfDays;
        // Add to leave history
        employee.leaveHistory = employee.leaveHistory || [];
        employee.leaveHistory.push({
          type: 'used',
          date: new Date(),
          days: leaveRequest.numberOfDays,
          reference: leaveRequest._id,
          referenceModel: 'LeaveRequest',
          remarks: 'CL leave approved by Principal'
        });
      }
      // For OD, no balance deduction needed

      // Update leave request status
      leaveRequest.status = 'Approved';
      leaveRequest.principalRemarks = remarks || 'Approved by Principal';
      leaveRequest.principalApprovalDate = new Date();
      leaveRequest.approvedBy.principal = true;

      // Handle balance updates for approval
      if (leaveRequest.leaveType === 'CCL') {
        // For CCL, ensure we're using the correct number of days (0.5 for half-day)
        const daysToDeduct = leaveRequest.isHalfDay ? 0.5 : leaveRequest.numberOfDays;
        // Update CCL balance using the schema method
        await employee.updateCCLBalance(
          'used',
          daysToDeduct,
          leaveRequest._id,
          'LeaveRequest',
          `CCL leave approved by Principal${leaveRequest.isHalfDay ? ' (Half-day)' : ''}`
        );
      } else if (leaveRequest.leaveType === 'CL') {
        // For CL, deduct from regular leave balance
        employee.leaveBalance -= leaveRequest.numberOfDays;
        // Add to leave history
        employee.leaveHistory = employee.leaveHistory || [];
        employee.leaveHistory.push({
          type: 'used',
          date: new Date(),
          days: leaveRequest.numberOfDays,
          reference: leaveRequest._id,
          referenceModel: 'LeaveRequest',
          remarks: 'CL leave approved by Principal'
        });
      }

      // Save both employee and leave request
      await Promise.all([
        employee.save(),
        leaveRequest.save()
      ]);

      console.log('Leave request approved:', {
        leaveId: leaveRequest._id,
        leaveType: leaveRequest.leaveType,
        status: leaveRequest.status,
        employeeId: employee._id,
        employeeName: employee.name,
        newBalance: leaveRequest.leaveType === 'CCL' ? employee.cclBalance : employee.leaveBalance
      });

    } else if (action === 'reject') {
      // Check if already rejected
      if (previousStatus === 'Rejected') {
        console.log('Leave request already rejected:', {
          leaveId,
          previousStatus,
          employeeId: employee._id
        });
        return res.status(400).json({ msg: 'Leave request is already rejected' });
      }

      leaveRequest.status = 'Rejected';
      leaveRequest.principalRemarks = remarks || 'Rejected by Principal';
      leaveRequest.principalApprovalDate = new Date();
      leaveRequest.approvedBy.principal = false;

      // Handle balance restoration for rejection if previously approved
      if (previousStatus === 'Approved') {
        if (leaveRequest.leaveType === 'CCL') {
          // For CCL, ensure we're using the correct number of days (0.5 for half-day)
          const daysToRestore = leaveRequest.isHalfDay ? 0.5 : leaveRequest.numberOfDays;
          await employee.updateCCLBalance(
            'restored',
            daysToRestore,
            leaveRequest._id,
            'LeaveRequest',
            `CCL leave rejected by Principal after approval${leaveRequest.isHalfDay ? ' (Half-day)' : ''}`
          );
        } else {
          // For all other leave types, restore regular leave balance
          employee.leaveBalance += leaveRequest.numberOfDays;
          // Add to leave history
          employee.leaveHistory = employee.leaveHistory || [];
          employee.leaveHistory.push({
            type: 'restored',
            date: new Date(),
            days: leaveRequest.numberOfDays,
            reference: leaveRequest._id,
            referenceModel: 'LeaveRequest',
            remarks: `${leaveRequest.leaveType} leave rejected by Principal after approval`
          });
        }
      }

      // Save both employee and leave request
      await Promise.all([
        employee.save(),
        leaveRequest.save()
      ]);

      console.log('Leave request rejected:', {
        leaveId: leaveRequest._id,
        leaveType: leaveRequest.leaveType,
        status: leaveRequest.status,
        employeeId: employee._id,
        employeeName: employee.name,
        newBalance: leaveRequest.leaveType === 'CCL' ? employee.cclBalance : employee.leaveBalance
      });
    }

    res.json({ 
      msg: `Leave request ${action === 'approve' ? 'approved' : 'rejected'}`,
      leaveRequest,
      newBalance: leaveRequest.leaveType === 'CL' ? employee.leaveBalance : employee.cclBalance
    });
  } catch (error) {
    console.error('Update Leave Request Error:', {
      error: error.message,
      stack: error.stack,
      user: req.user
    });
    res.status(500).json({ msg: error.message || 'Server error' });
  }
};

// Get Branches
exports.getBranches = async (req, res) => {
  try {
    const hods = await HOD.find({
      'department.campusType': req.user.campus.charAt(0).toUpperCase() + req.user.campus.slice(1)
    }).select('name email department status lastLogin');

    res.json(hods);
  } catch (error) {
    console.error('Get Branches Error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get HODs for Principal's Campus
exports.getCampusHods = async (req, res) => {
  try {
    console.log('Getting HODs for campus:', {
      campus: req.user.campus,
      principalId: req.user.id,
      modelType: req.user.modelType
    });

    // First find the principal to get correct campus type
    let principal;
    let campusType;
    let normalizedCampus;
    
    if (req.user.modelType === 'User') {
      principal = await User.findOne({
        _id: req.user.id,
        role: 'principal'
      });
      campusType = principal.campus.charAt(0).toUpperCase() + principal.campus.slice(1);
      normalizedCampus = principal.campus.toLowerCase();
    } else {
      principal = await Principal.findById(req.user.id);
      campusType = principal.campus.type;
      normalizedCampus = principal.campus.type.toLowerCase();
    }

    if (!principal) {
      return res.status(404).json({ msg: 'Principal not found' });
    }

    console.log('Principal found:', {
      id: principal._id,
      campusType,
      normalizedCampus,
      modelType: req.user.modelType
    });

    // Find HODs in both User and HOD models
    const userModelHods = await User.find({
      role: 'hod',
      campus: normalizedCampus,
      isActive: true
    }).select('-password');

    // Updated query to match HOD creation format
    const hodModelQuery = {
      'department.campusType': campusType,
      campus: principal._id,
      status: 'active',
      campusModel: req.user.modelType
    };

    console.log('HOD Model Query:', hodModelQuery);

    const hodModelHods = await HOD.find(hodModelQuery).select('-password');

    console.log('HODs found:', {
      userModelCount: userModelHods.length,
      hodModelCount: hodModelHods.length,
      hodModelHods: hodModelHods.map(h => ({
        id: h._id,
        name: h.name,
        department: h.department,
        campusModel: h.campusModel
      }))
    });

    // Combine and format HODs from both models
    const hods = [
      ...userModelHods.map(hod => ({
        ...hod.toObject(),
        model: 'User',
        department: {
          code: hod.branchCode,
          name: hod.branchCode,
          campusType: campusType
        }
      })),
      ...hodModelHods.map(hod => ({
        ...hod.toObject(),
        model: 'HOD'
      }))
    ];

    // Sort HODs by department code
    hods.sort((a, b) => {
      const codeA = a.department.code || a.branchCode;
      const codeB = b.department.code || b.branchCode;
      return codeA.localeCompare(codeB);
    });

    res.json(hods);
  } catch (error) {
    console.error('Get Campus HODs Error:', error);
    res.status(500).json({ 
      msg: error.message || 'Server error',
      timestamp: new Date().toISOString()
    });
  }
};

// Update HOD Details
exports.updateHodDetails = async (req, res) => {
  try {
    const { hodId } = req.params;
    const { model } = req.query;
    const updates = req.body;

    // Verify the HOD exists and belongs to principal's campus
    let hod;
    if (model === 'User') {
      hod = await User.findOne({
        _id: hodId,
        role: 'hod',
        campus: req.user.campus
      });
    } else {
      hod = await HOD.findOne({
        _id: hodId,
        'department.campusType': req.user.campus.charAt(0).toUpperCase() + req.user.campus.slice(1)
      });
    }

    if (!hod) {
      return res.status(404).json({ msg: 'HOD not found' });
    }

    // Remove sensitive fields from updates
    const allowedUpdates = ['name', 'email', 'phoneNumber', 'department', 'status'];
    Object.keys(updates).forEach(key => {
      if (!allowedUpdates.includes(key)) {
        delete updates[key];
      }
    });

    // Validate department update: only allow if it's an object with a non-empty code
    if (
      updates.department &&
      (
        typeof updates.department !== 'object' ||
        !updates.department.code ||
        typeof updates.department.code !== 'string' ||
        updates.department.code.trim() === ''
      )
    ) {
      delete updates.department;
    }

    // Update HOD
    let updatedHod;
    let previousDepartmentCode;
    if (model === 'User') {
      updatedHod = await User.findByIdAndUpdate(
        hodId,
        { $set: updates },
        { new: true }
      ).select('-password');
    } else {
      // Get the previous department code before update
      previousDepartmentCode = hod.department.code;
      updatedHod = await HOD.findByIdAndUpdate(
        hodId,
        { $set: updates },
        { new: true }
      ).select('-password');
    }

    // If department was changed, update campus branch hodId fields
    if (model !== 'User' && updates.department && updates.department.code && previousDepartmentCode !== updates.department.code) {
      // Find the campus document
      const campus = await Campus.findOne({ principalId: req.user.id });
      if (campus) {
        // Clear old branch's hodId
        const oldBranch = campus.branches.find(b => b.code === previousDepartmentCode);
        if (oldBranch && oldBranch.hodId && oldBranch.hodId.toString() === hodId) {
          oldBranch.hodId = null;
        }
        // Set new branch's hodId
        const newBranch = campus.branches.find(b => b.code === updates.department.code);
        if (newBranch) {
          newBranch.hodId = hodId;
        }
        await campus.save();
      }
    }

    res.json({
      msg: 'HOD details updated successfully',
      hod: updatedHod
    });
  } catch (error) {
    console.error('Update HOD Error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ msg: 'Email already exists' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
};

// Reset HOD Password
exports.resetHodPassword = async (req, res) => {
  try {
    const { hodId } = req.params;
    const { model } = req.query;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ msg: 'Please provide a valid password (min 6 characters)' });
    }

    // Find the HOD
    let hod;
    if (model === 'User') {
      hod = await User.findOne({
        _id: hodId,
        role: 'hod',
        campus: req.user.campus
      });
    } else {
      hod = await HOD.findOne({
        _id: hodId,
        'department.campusType': req.user.campus.charAt(0).toUpperCase() + req.user.campus.slice(1)
      });
    }

    if (!hod) {
      return res.status(404).json({ msg: 'HOD not found' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password using findOneAndUpdate to avoid pre-save middleware
    if (model === 'User') {
      await User.findOneAndUpdate(
        { _id: hodId },
        { 
          $set: { 
            password: hashedPassword,
            lastLogin: null // Reset last login to force re-login
          }
        }
      );
    } else {
      await HOD.findOneAndUpdate(
        { _id: hodId },
        { 
          $set: { 
            password: hashedPassword,
            lastLogin: null // Reset last login to force re-login
          }
        }
      );
    }

    res.json({ msg: 'HOD password reset successfully' });
  } catch (error) {
    console.error('Reset HOD Password Error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get Principal Profile
exports.getProfile = async (req, res) => {
  try {
    const principal = await Principal.findById(req.user.id).select('-password');
    if (!principal) {
      return res.status(404).json({ msg: 'Principal not found' });
    }
    res.json(principal);
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Update Principal Profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phoneNumber } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (email) {
      if (!validateEmail(email)) {
        return res.status(400).json({ msg: 'Please provide a valid email' });
      }
      updates.email = email;
    }
    if (phoneNumber) updates.phoneNumber = phoneNumber;

    const principal = await Principal.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true }
    ).select('-password');

    res.json(principal);
  } catch (error) {
    console.error('Update Profile Error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ msg: 'Email already exists' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get Campus Leaves
exports.getCampusLeaves = async (req, res) => {
  try {
    console.log('Getting campus leaves for:', {
      campus: req.user.campus,
      modelType: req.user.modelType
    });

    // First find the principal to get correct campus type
    let principal;
    let campusType;
    let normalizedCampus;
    
    if (req.user.modelType === 'User') {
      principal = await User.findOne({
        _id: req.user.id,
        role: 'principal'
      });
      campusType = principal.campus.charAt(0).toUpperCase() + principal.campus.slice(1);
      normalizedCampus = principal.campus.toLowerCase();
    } else {
      principal = await Principal.findById(req.user.id);
      campusType = principal.campus.type;
      normalizedCampus = principal.campus.type.toLowerCase();
    }

    if (!principal) {
      return res.status(404).json({ msg: 'Principal not found' });
    }

    // Find all employees in the campus with populated leave requests
    const employees = await Employee.find({
      campus: normalizedCampus
    })
    .select('name email department employeeId leaveRequests')
    .populate({
      path: 'leaveRequests.alternateSchedule.periods.substituteFaculty',
      select: 'name'
    });

    console.log('Found employees:', {
      count: employees.length,
      campus: normalizedCampus
    });

    // Collect all forwarded and approved leave requests with populated faculty details
    const leaveRequests = employees.reduce((acc, employee) => {
      const employeeLeaves = employee.leaveRequests
        .filter(request => request.status === 'Forwarded by HOD' || request.status === 'Approved')
        .map(request => ({
          ...request.toObject(),
          employeeId: employee._id,
          employeeName: employee.name,
          employeeEmail: employee.email,
          employeeEmployeeId: employee.employeeId,
          employeeDepartment: employee.department,
          alternateSchedule: request.alternateSchedule.map(schedule => ({
            date: schedule.date,
            periods: schedule.periods.map(period => ({
              periodNumber: period.periodNumber,
              substituteFaculty: period.substituteFaculty ? period.substituteFaculty.name : 'Unknown Faculty',
              assignedClass: period.assignedClass
            }))
          }))
        }));
      return [...acc, ...employeeLeaves];
    }, []);

    // Sort by creation date, most recent first
    leaveRequests.sort((a, b) => new Date(b.appliedOn) - new Date(a.appliedOn));

    console.log('Found leave requests:', {
      count: leaveRequests.length,
      forwarded: leaveRequests.filter(req => req.status === 'Forwarded by HOD').length,
      approved: leaveRequests.filter(req => req.status === 'Approved').length,
      campus: normalizedCampus
    });

    res.json(leaveRequests);
  } catch (error) {
    console.error('Get Campus Leaves Error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Apply for Principal Leave
exports.applyPrincipalLeave = async (req, res) => {
  try {
    const { startDate, endDate, reason, leaveType } = req.body;
    
    if (!startDate || !endDate || !reason || !leaveType) {
      return res.status(400).json({ msg: 'Please provide all required fields' });
    }

    const principal = await Principal.findById(req.user.id);
    if (!principal) {
      return res.status(404).json({ msg: 'Principal not found' });
    }

    const leaveRequest = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      leaveType,
      status: 'Pending'
    };

    principal.leaveRequests.push(leaveRequest);
    await principal.save();

    res.json(leaveRequest);
  } catch (error) {
    console.error('Apply Principal Leave Error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get Principal's Leave Requests
exports.getPrincipalLeaves = async (req, res) => {
  try {
    const principal = await Principal.findById(req.user.id)
      .select('leaveRequests');
    
    res.json(principal.leaveRequests || []);
  } catch (error) {
    console.error('Get Principal Leaves Error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get Campus Stats
exports.getCampusStats = async (req, res) => {
  try {
    const stats = {
      totalHODs: await HOD.countDocuments({
        'department.campusType': req.user.campus
      }),
      totalEmployees: await User.countDocuments({
        role: 'employee',
        campus: req.user.campus
      }),
      pendingLeaves: await LeaveRequest.countDocuments({
        campus: req.user.campus,
        status: 'Pending'
      }),
      departments: await HOD.aggregate([
        {
          $match: {
            'department.campusType': req.user.campus
          }
        },
        {
          $group: {
            _id: '$department.code',
            hodCount: { $sum: 1 },
            activeHods: {
              $sum: {
                $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
              }
            }
          }
        }
      ])
    };

    res.json(stats);
  } catch (error) {
    console.error('Get Campus Stats Error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get Campus Employees
exports.getCampusEmployees = async (req, res) => {
  try {
    const { search, department, status } = req.query;
    
    // Get principal's campus type
    let principal;
    let campusType;
    
    if (req.user.modelType === 'User') {
      principal = await User.findOne({
        _id: req.user.id,
        role: 'principal'
      });
      campusType = principal.campus.toLowerCase();
    } else {
      principal = await Principal.findById(req.user.id);
      campusType = principal.campus.type.toLowerCase();
    }

    if (!principal) {
      return res.status(404).json({ msg: 'Principal not found' });
    }

    // Validate campus type
    const validCampusTypes = ['engineering', 'degree', 'pharmacy', 'diploma'];
    if (!validCampusTypes.includes(campusType)) {
      return res.status(400).json({ msg: 'Invalid campus type' });
    }

    // Build query
    let query = {
      role: {
        $in: [
          // Engineering roles
          'associate_professor',
          'assistant_professor',
          'lab_incharge',
          'technician',
          // Diploma roles
          'senior_lecturer',
          'junior_lecturer',
          // Common roles
          'faculty',
          'employee'
        ]
      },
      campus: campusType
    };

    // Add search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    // Add department filter
    if (department) {
      query.branchCode = department;  // Using branchCode instead of department
    }

    // Add status filter
    if (status) {
      query.status = status;
    }

    console.log('Fetching employees with query:', {
      principalId: req.user.id,
      modelType: req.user.modelType,
      campusType,
      query
    });

    const employees = await Employee.find(query)
      .select('name email employeeId department status phoneNumber designation role branchCode specialPermission')
      .sort({ name: 1 });

    console.log(`Found ${employees.length} employees for campus: ${campusType}`);

    res.json(employees);
  } catch (error) {
    console.error('Get Campus Employees Error:', error);
    res.status(500).json({ msg: error.message || 'Server error' });
  }
};

// Get all leave requests
exports.getAllLeaves = async (req, res) => {
  try {
    console.log('Getting all leaves, token data:', req.user);
    
    if (!req.user || !req.user.id || !req.user.campus || !req.user.model) {
      console.log('Invalid token data:', req.user);
      return res.status(401).json({ msg: 'Invalid token data' });
    }

    // Get all employees in this campus
    const employees = await Employee.find({
      campus: req.user.campus
    }).select('name email department leaveRequests');

    // Collect all leave requests from employees
    const allLeaves = employees.reduce((acc, employee) => {
      const employeeLeaves = employee.leaveRequests.map(leave => ({
        ...leave.toObject(),
        employeeId: employee._id,
        employeeName: employee.name,
        employeeEmail: employee.email,
        department: employee.department
      }));
      return [...acc, ...employeeLeaves];
    }, []);

    // Sort by creation date, most recent first
    allLeaves.sort((a, b) => new Date(b.appliedOn) - new Date(a.appliedOn));

    console.log('Found all leave requests:', {
      count: allLeaves.length,
      campus: req.user.campus
    });

    res.json(allLeaves);
  } catch (error) {
    console.error('Get All Leaves Error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get CCL work requests
exports.getCCLWorkRequests = async (req, res) => {
  try {
    console.log('Getting CCL work requests for Principal:', {
      campus: req.user.campus,
      userId: req.user.id,
      modelType: req.user.modelType
    });

    // Get all CCL work requests that have been forwarded to Principal
    const cclWorkRequests = await CCLWorkRequest.find({
      status: 'Forwarded to Principal'
    })
    .populate({
      path: 'submittedBy',
      select: 'name email employeeId department',
      model: 'Employee'
    })
    .sort({ createdAt: -1 });

    console.log('Found CCL work requests:', {
      count: cclWorkRequests.length,
      requests: cclWorkRequests.map(req => ({
        id: req._id,
        status: req.status,
        submittedBy: req.submittedBy ? {
          id: req.submittedBy._id,
          name: req.submittedBy.name
        } : null
      }))
    });

    // Format the response
    const formattedRequests = cclWorkRequests.map(request => ({
      _id: request._id,
      date: request.date,
      assignedTo: request.assignedTo,
      reason: request.reason,
      status: request.status,
      hodRemarks: request.hodRemarks,
      hodApprovalDate: request.hodApprovalDate,
      employeeName: request.submittedBy?.name || 'Unknown',
      employeeEmail: request.submittedBy?.email || 'N/A',
      employeeDepartment: request.submittedBy?.department || 'N/A',
      employeeEmployeeId: request.submittedBy?.employeeId || 'N/A'
    }));

    res.json({
      success: true,
      data: formattedRequests
    });
  } catch (error) {
    console.error('Get CCL Work Requests Error:', {
      error: error.message,
      stack: error.stack,
      user: {
        id: req.user.id,
        campus: req.user.campus,
        modelType: req.user.modelType
      }
    });
    res.status(500).json({ 
      success: false,
      message: error.message || 'Server error',
      data: []
    });
  }
};

// Update CCL work request status
exports.updateCCLWorkRequestStatus = async (req, res) => {
  try {
    const { workId } = req.params;
    const { status, remarks } = req.body;

    console.log('Updating CCL work request:', {
      workId,
      status,
      remarks,
      user: req.user
    });

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid status. Must be either "Approved" or "Rejected".'
      });
    }

    // Find the CCL work request
    const cclWorkRequest = await CCLWorkRequest.findById(workId)
      .populate('submittedBy', 'name email employeeId department');

    if (!cclWorkRequest) {
      return res.status(404).json({ 
        success: false,
        message: 'CCL work request not found'
      });
    }

    // Verify the request is in the correct status
    if (cclWorkRequest.status !== 'Forwarded to Principal') {
      return res.status(400).json({ 
        success: false,
        message: 'CCL work request must be in "Forwarded to Principal" status to be updated'
      });
    }

    // Update the CCL work request
    cclWorkRequest.status = status;
    cclWorkRequest.principalRemarks = remarks || `${status} by Principal`;
    cclWorkRequest.principalApprovalDate = new Date();

    // If approved, update the employee's CCL balance
    if (status === 'Approved') {
      const employee = await Employee.findById(cclWorkRequest.submittedBy);
      if (employee) {
        // Use the schema's updateCCLBalance method with correct reference model
        await employee.updateCCLBalance(
          'earned',
          1, // 1 CCL day
          cclWorkRequest._id,
          'CCLWork', // Changed from 'CCLWorkRequest' to 'CCLWork' to match schema enum
          'CCL earned from extra duty'
        );
        
        console.log('Updated employee CCL balance:', {
          employeeId: employee._id,
          newBalance: employee.cclBalance,
          requestId: cclWorkRequest._id
        });
      }
    }

    await cclWorkRequest.save();

    console.log('CCL work request updated:', {
      id: cclWorkRequest._id,
      status: cclWorkRequest.status,
      principalRemarks: cclWorkRequest.principalRemarks,
      principalApprovalDate: cclWorkRequest.principalApprovalDate
    });

    res.json({
      success: true,
      message: `CCL work request ${status.toLowerCase()}`,
      data: {
        _id: cclWorkRequest._id,
        date: cclWorkRequest.date,
        assignedTo: cclWorkRequest.assignedTo,
        reason: cclWorkRequest.reason,
        status: cclWorkRequest.status,
        hodRemarks: cclWorkRequest.hodRemarks,
        hodApprovalDate: cclWorkRequest.hodApprovalDate,
        principalRemarks: cclWorkRequest.principalRemarks,
        principalApprovalDate: cclWorkRequest.principalApprovalDate,
        employeeName: cclWorkRequest.submittedBy?.name || 'Unknown',
        employeeEmail: cclWorkRequest.submittedBy?.email || 'N/A',
        employeeDepartment: cclWorkRequest.submittedBy?.department || 'N/A',
        employeeEmployeeId: cclWorkRequest.submittedBy?.employeeId || 'N/A'
      }
    });
  } catch (error) {
    console.error('Update CCL Work Request Status Error:', {
      error: error.message,
      stack: error.stack,
      user: req.user
    });
    res.status(500).json({ 
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// Create Branch for Campus
exports.createBranch = async (req, res) => {
  try {
    const principalId = req.user.id;
    const { name, code } = req.body;
    if (!name || !code) {
      return res.status(400).json({ msg: 'Branch name and code are required' });
    }
    // Find campus for this principal
    const campus = await Campus.findOne({ principalId });
    if (!campus) {
      return res.status(404).json({ msg: 'Campus not found' });
    }
    // Check for duplicate branch code
    const exists = campus.branches.some(
      branch => branch.code.toUpperCase() === code.toUpperCase()
    );
    if (exists) {
      return res.status(400).json({ msg: 'Branch code already exists in this campus' });
    }
    // Add new branch
    campus.branches.push({
      name,
      code: code.toUpperCase(),
      isActive: true
    });
    await campus.save();
    res.status(201).json({ msg: 'Branch created successfully', branches: campus.branches });
  } catch (error) {
    console.error('Create Branch Error:', error);
    res.status(500).json({ msg: error.message || 'Server error' });
  }
};

// List all branches for the principal's campus
exports.listBranches = async (req, res) => {
  try {
    const principalId = req.user.id;
    const campus = await Campus.findOne({ principalId });
    if (!campus) {
      return res.status(404).json({ msg: 'Campus not found' });
    }
    res.json({ branches: campus.branches });
  } catch (error) {
    console.error('List Branches Error:', error);
    res.status(500).json({ msg: error.message || 'Server error' });
  }
};

// Edit a branch for the principal's campus
exports.editBranch = async (req, res) => {
  try {
    const principalId = req.user.id;
    const { branchId } = req.params;
    const { name, code, isActive } = req.body;
    const campus = await Campus.findOne({ principalId });
    if (!campus) {
      return res.status(404).json({ msg: 'Campus not found' });
    }
    const branch = campus.branches.id(branchId);
    if (!branch) {
      return res.status(404).json({ msg: 'Branch not found' });
    }
    if (name) branch.name = name;
    if (code) branch.code = code.toUpperCase();
    if (typeof isActive === 'boolean') branch.isActive = isActive;
    await campus.save();
    res.json({ msg: 'Branch updated successfully', branch });
  } catch (error) {
    console.error('Edit Branch Error:', error);
    res.status(500).json({ msg: error.message || 'Server error' });
  }
};

// Delete a branch from the campus
exports.deleteBranch = async (req, res) => {
  try {
    const principalId = req.user.id;
    let campusDoc;
    if (req.user.modelType === 'User') {
      const principal = await User.findOne({ _id: principalId, role: 'principal' });
      if (!principal) return res.status(404).json({ msg: 'Principal not found' });
      campusDoc = await Campus.findOne({ name: principal.campus.toLowerCase() });
    } else {
      const principal = await Principal.findById(principalId);
      if (!principal) return res.status(404).json({ msg: 'Principal not found' });
      campusDoc = await Campus.findOne({ type: principal.campus.type });
    }
    if (!campusDoc) return res.status(404).json({ msg: 'Campus not found' });

    const { branchId } = req.params;
    const branchIndex = campusDoc.branches.findIndex(b => b._id.toString() === branchId);
    if (branchIndex === -1) {
      return res.status(404).json({ msg: 'Branch not found' });
    }
    const deletedBranch = campusDoc.branches[branchIndex];
    const branchCode = deletedBranch.code;
    const campusName = campusDoc.name;
    campusDoc.branches.splice(branchIndex, 1);
    await campusDoc.save();

    // Cascade delete HODs and Employees
    const hodDeleteResult = await HOD.deleteMany({
      'department.code': branchCode,
      'department.campusType': campusDoc.type
    });
    const employeeDeleteResult = await Employee.deleteMany({
      branchCode: branchCode,
      campus: campusName
    });

    res.json({
      msg: 'Branch deleted successfully',
      deletedHODs: hodDeleteResult.deletedCount,
      deletedEmployees: employeeDeleteResult.deletedCount
    });
  } catch (error) {
    console.error('Delete Branch Error:', error);
    res.status(500).json({ msg: error.message || 'Server error' });
  }
};

// Update Employee Details (Principal)
exports.updateEmployeeDetails = async (req, res) => {
  try {
    const employeeId = req.params.id;
    const updates = req.body;

    // Find employee
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ msg: 'Employee not found' });
    }

    // Get principal's campus type
    let principal;
    let campusType;
    if (req.user.modelType === 'User') {
      principal = await User.findOne({ _id: req.user.id, role: 'principal' });
      campusType = principal.campus.toLowerCase();
    } else {
      principal = await Principal.findById(req.user.id);
      campusType = principal.campus.type.toLowerCase();
    }

    // Check campus match
    if (employee.campus.toLowerCase() !== campusType) {
      return res.status(403).json({ msg: 'Not authorized to update this employee' });
    }

    // Allowed fields to update
    const allowedFields = ['name', 'email', 'phoneNumber', 'status', 'specialPermission'];
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        employee[field] = updates[field];
      }
    });
    // Department/branchCode
    if (updates.department) {
      employee.branchCode = updates.department;
      employee.department = updates.department; // Ensure department is a string for HOD dashboard compatibility
      // Optionally update department object if your schema uses it
      if (employee.department && typeof employee.department === 'object') {
        employee.department.code = updates.department;
      }
    }

    await employee.save();
    res.json(employee);
  } catch (error) {
    console.error('Principal update employee error:', error);
    res.status(500).json({ msg: error.message || 'Server error' });
  }
}; 