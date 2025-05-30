const mongoose = require('mongoose');
const { Employee } = require('../models');
require('dotenv').config();

const seedEmployee = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB successfully');

    // Check if test employee exists
    const existingEmployee = await Employee.findOne({ email: 'faculty@pydah.edu.in' });
    
    if (!existingEmployee) {
      const employee = new Employee({
        name: 'Test Faculty',
        email: 'faculty@pydah.edu.in',
        password: 'faculty123',
        employeeId: 'FAC001',
        phoneNumber: '1234567890',
        designation: 'Faculty',
        role: 'faculty',
        department: 'CSE',
        campus: 'diploma',
        branchCode: 'CSE',
        status: 'active',
        leaveBalance: 12,
        cclBalance: 0
      });

      await employee.save();
      console.log('Test employee account created successfully');
    } else {
      console.log('Test employee account already exists');
    }

    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding employee:', error);
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed after error');
    } catch (closeError) {
      console.error('Error closing MongoDB connection:', closeError);
    }
    process.exit(1);
  }
};

// Add proper error handling for unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

seedEmployee(); 