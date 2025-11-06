const Geofence = require('../models/Geofence');
const { formatGeoJSON, isPointInCircle } = require('../utils/geoUtils');

/**
 * @desc    Crear nueva geofence
 * @route   POST /api/geofences
 * @access  Private
 */
const createGeofence = async (req, res, next) => {
  try {
    const { name, description, latitude, longitude, radius, type, polygon, alerts, users } = req.body;

    const geofenceData = {
      name,
      description,
      creator: req.user.id,
      center: formatGeoJSON(longitude, latitude),
      radius,
      type: type || 'circle',
      alerts: alerts || {},
      users: users || []
    };

    // Si es polígono, agregar coordenadas del polígono
    if (type === 'polygon' && polygon) {
      geofenceData.polygon = {
        type: 'Polygon',
        coordinates: polygon
      };
    }

    const geofence = await Geofence.create(geofenceData);

    res.status(201).json({
      success: true,
      message: 'Zona geográfica creada exitosamente',
      data: geofence
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener todas las geofences del usuario
 * @route   GET /api/geofences
 * @access  Private
 */
const getGeofences = async (req, res, next) => {
  try {
    const { isActive, type } = req.query;

    const query = {
      $or: [
        { creator: req.user.id },
        { users: req.user.id }
      ]
    };

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (type) {
      query.type = type;
    }

    const geofences = await Geofence.find(query)
      .populate('creator', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: geofences.length,
      data: geofences
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener geofence por ID
 * @route   GET /api/geofences/:id
 * @access  Private
 */
const getGeofence = async (req, res, next) => {
  try {
    const geofence = await Geofence.findById(req.params.id)
      .populate('creator', 'name email')
      .populate('users', 'name email');

    if (!geofence) {
      return res.status(404).json({
        success: false,
        message: 'Zona geográfica no encontrada'
      });
    }

    // Verificar acceso
    const hasAccess = geofence.creator._id.toString() === req.user.id ||
                     geofence.users.some(user => user._id.toString() === req.user.id);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a esta zona geográfica'
      });
    }

    res.status(200).json({
      success: true,
      data: geofence
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Actualizar geofence
 * @route   PUT /api/geofences/:id
 * @access  Private
 */
const updateGeofence = async (req, res, next) => {
  try {
    let geofence = await Geofence.findById(req.params.id);

    if (!geofence) {
      return res.status(404).json({
        success: false,
        message: 'Zona geográfica no encontrada'
      });
    }

    // Verificar que sea el creador
    if (geofence.creator.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para actualizar esta zona'
      });
    }

    const { name, description, latitude, longitude, radius, isActive, alerts, users } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (latitude && longitude) {
      updateData.center = formatGeoJSON(longitude, latitude);
    }
    if (radius) updateData.radius = radius;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (alerts) updateData.alerts = alerts;
    if (users) updateData.users = users;

    geofence = await Geofence.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Zona geográfica actualizada exitosamente',
      data: geofence
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Eliminar geofence
 * @route   DELETE /api/geofences/:id
 * @access  Private
 */
const deleteGeofence = async (req, res, next) => {
  try {
    const geofence = await Geofence.findById(req.params.id);

    if (!geofence) {
      return res.status(404).json({
        success: false,
        message: 'Zona geográfica no encontrada'
      });
    }

    // Verificar que sea el creador
    if (geofence.creator.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar esta zona'
      });
    }

    await geofence.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Zona geográfica eliminada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verificar si una ubicación está dentro de una geofence
 * @route   POST /api/geofences/:id/check
 * @access  Private
 */
const checkGeofence = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitud y longitud son requeridas'
      });
    }

    const geofence = await Geofence.findById(req.params.id);

    if (!geofence) {
      return res.status(404).json({
        success: false,
        message: 'Zona geográfica no encontrada'
      });
    }

    const isInside = isPointInCircle(
      [longitude, latitude],
      geofence.center.coordinates,
      geofence.radius
    );

    res.status(200).json({
      success: true,
      data: {
        isInside,
        geofence: {
          id: geofence._id,
          name: geofence.name
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGeofence,
  getGeofences,
  getGeofence,
  updateGeofence,
  deleteGeofence,
  checkGeofence
};