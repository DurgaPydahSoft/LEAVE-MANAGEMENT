// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// require('dotenv').config();

// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Import routes
// const superAdminRoutes = require('./routes/superAdminRoutes');
// const principalRoutes = require('./routes/principalRoutes');
// const hodRoutes = require('./routes/hodRoutes');
// const employeeRoutes = require('./routes/employeeRoutes');
// const cclRoutes = require('./routes/cclRoutes');

// // Use routes
// app.use('/api/super-admin', superAdminRoutes);
// app.use('/api/principal', principalRoutes);
// app.use('/api/hod', hodRoutes);
// app.use('/api/employee', employeeRoutes);
// app.use('/api/ccl', cclRoutes);

// // Root route
// app.get('/', (req, res) => {
//   res.json({
//     message: 'PYDAH Leave Management System API',
//     availableRoutes: [
//       '/api/super-admin',
//       '/api/principal',
//       '/api/hod',
//       '/api/employee',
//       '/api/ccl'
//     ]
//   });
// });

// // Connect to MongoDB
// mongoose.connect(process.env.MONGODB_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// })
// .then(() => console.log('MongoDB Connected'))
// .catch(err => console.error('MongoDB connection error:', err));

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({ msg: 'Something broke!', error: err.message });
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
//   console.log('Available routes:');
//   console.log('- /api/super-admin');
//   console.log('- /api/principal');
//   console.log('- /api/hod');
//   console.log('- /api/employee');
//   console.log('- /api/ccl');
// });

// module.exports = app; 