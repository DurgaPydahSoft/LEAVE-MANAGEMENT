const express = require('express');
const router = express.Router();
const { authSuperAdmin } = require('../middleware/auth');
const SuperAdminController = require('../controllers/superAdminController');

// Auth routes
router.post('/login', SuperAdminController.login);

// Protected routes
router.use(authSuperAdmin); // Apply auth middleware to all routes below

// Campus management
router.post('/campuses', SuperAdminController.createCampus);
router.get('/campuses', SuperAdminController.getAllCampuses);
router.put('/campus-status', SuperAdminController.updateCampusStatus);

// Principal management
router.post('/principals', SuperAdminController.createPrincipal);
router.get('/principals', SuperAdminController.getAllPrincipals);
router.get('/principals/:id', SuperAdminController.getPrincipal);
router.put('/principals/:id', SuperAdminController.updatePrincipal);
router.delete('/principals/:id', SuperAdminController.deletePrincipal);

// Password management
router.put('/reset-principal-password', SuperAdminController.resetPrincipalPassword);

// Dashboard
router.get('/dashboard', SuperAdminController.getDashboard);

module.exports = router; 