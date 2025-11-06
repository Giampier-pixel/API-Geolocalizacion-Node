const express = require('express');
const router = express.Router();
const {
  createLocation,
  getLocationHistory,
  getLastLocation,
  getNearbyLocations,
  getUserLocation,
  deleteLocationHistory
} = require('../controllers/locationController');
const { protect, authorize } = require('../middleware/auth');
const {
  validateCreateLocation,
  validateNearbyQuery,
  validateId
} = require('../validators/locationValidator');

// Rutas protegidas
router.post('/', protect, validateCreateLocation, createLocation);
router.get('/history', protect, getLocationHistory);
router.get('/last', protect, getLastLocation);
router.get('/nearby', protect, validateNearbyQuery, getNearbyLocations);
router.delete('/history', protect, deleteLocationHistory);

// Rutas de administrador
router.get('/user/:userId', protect, authorize('admin'), validateId, getUserLocation);

module.exports = router;