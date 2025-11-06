const Location = require('../models/Location');
const User = require('../models/User');
const { formatGeoJSON } = require('../utils/geoUtils');
const { emitLocationUpdate, checkGeofenceAlerts, emitNearbyUsers } = require('../utils/socketHandler');

/**
 * @desc    Crear nueva ubicación
 * @route   POST /api/locations
 * @access  Private
 */
const createLocation = async (req, res, next) => {
  try {
    const { latitude, longitude, accuracy, altitude, speed, heading, battery, isMoving } = req.body;

    const locationData = {
      user: req.user.id,
      location: formatGeoJSON(longitude, latitude),
      accuracy,
      altitude,
      speed,
      heading,
      battery,
      isMoving
    };

    const location = await Location.create(locationData);

    // Actualizar última ubicación del usuario
    await User.findByIdAndUpdate(req.user.id, {
      lastLocation: {
        type: 'Point',
        coordinates: [longitude, latitude],
        timestamp: new Date()
      }
    });

    // Emitir ubicación en tiempo real
    emitLocationUpdate(req.user.id, location);

    // Verificar alertas de geofencing
    await checkGeofenceAlerts(req.user.id, [longitude, latitude]);

    // Emitir usuarios cercanos
    await emitNearbyUsers(req.user.id, [longitude, latitude]);

    res.status(201).json({
      success: true,
      message: 'Ubicación registrada exitosamente',
      data: location
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener historial de ubicaciones del usuario
 * @route   GET /api/locations/history
 * @access  Private
 */
const getLocationHistory = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 100, page = 1 } = req.query;

    const query = { user: req.user.id };

    // Filtrar por rango de fechas
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const locations = await Location.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Location.countDocuments(query);

    res.status(200).json({
      success: true,
      count: locations.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: locations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener última ubicación del usuario
 * @route   GET /api/locations/last
 * @access  Private
 */
const getLastLocation = async (req, res, next) => {
  try {
    const location = await Location.findOne({ user: req.user.id })
      .sort({ createdAt: -1 });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'No se encontraron ubicaciones'
      });
    }

    res.status(200).json({
      success: true,
      data: location
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Buscar ubicaciones cercanas
 * @route   GET /api/locations/nearby
 * @access  Private
 */
const getNearbyLocations = async (req, res, next) => {
  try {
    const { latitude, longitude, radius = 1000 } = req.query;

    const locations = await Location.find({
      user: { $ne: req.user.id },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(radius)
        }
      },
      createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) } // Últimos 10 minutos
    })
    .populate('user', 'name email')
    .limit(50);

    res.status(200).json({
      success: true,
      count: locations.length,
      radius: parseInt(radius),
      data: locations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener ubicación de un usuario específico (Admin)
 * @route   GET /api/locations/user/:userId
 * @access  Private/Admin
 */
const getUserLocation = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const location = await Location.findOne({ user: userId })
      .sort({ createdAt: -1 })
      .populate('user', 'name email');

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró ubicación para este usuario'
      });
    }

    res.status(200).json({
      success: true,
      data: location
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Eliminar historial de ubicaciones
 * @route   DELETE /api/locations/history
 * @access  Private
 */
const deleteLocationHistory = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const query = { user: req.user.id };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const result = await Location.deleteMany(query);

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} ubicaciones eliminadas`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLocation,
  getLocationHistory,
  getLastLocation,
  getNearbyLocations,
  getUserLocation,
  deleteLocationHistory
};