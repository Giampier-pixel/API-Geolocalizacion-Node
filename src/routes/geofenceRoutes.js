const express = require('express');
const router = express.Router();
const {
  createGeofence,
  getGeofences,
  getGeofence,
  updateGeofence,
  deleteGeofence,
  checkGeofence
} = require('../controllers/geofenceController');
const { protect } = require('../middleware/auth');
const {
  validateCreateGeofence,
  validateId
} = require('../validators/locationValidator');

// Rutas protegidas
router.post('/', protect, validateCreateGeofence, createGeofence);
router.get('/', protect, getGeofences);
router.get('/:id', protect, validateId, getGeofence);
router.put('/:id', protect, validateId, updateGeofence);
router.delete('/:id', protect, validateId, deleteGeofence);
router.post('/:id/check', protect, validateId, checkGeofence);

module.exports = router;