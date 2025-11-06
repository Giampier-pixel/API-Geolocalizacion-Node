const { getIO } = require('../config/socket');
const Location = require('../models/Location');
const Geofence = require('../models/Geofence');
const { isPointInCircle, isPointInPolygon } = require('./geoUtils');

/**
 * Emite la ubicación en tiempo real a usuarios específicos
 */
const emitLocationUpdate = (userId, locationData) => {
  try {
    const io = getIO();
    
    // Emitir a la sala del usuario
    io.to(`user_${userId}`).emit('location:update', locationData);
    
    // Emitir a administradores o usuarios autorizados
    io.to('admins').emit('location:new', {
      userId,
      ...locationData
    });
  } catch (error) {
    console.error('Error al emitir ubicación:', error);
  }
};

/**
 * Verifica alertas de geofencing
 */
const checkGeofenceAlerts = async (userId, coordinates) => {
  try {
    const [longitude, latitude] = coordinates;
    
    // Buscar geofences activas del usuario
    const geofences = await Geofence.find({
      isActive: true,
      $or: [
        { creator: userId },
        { users: userId }
      ]
    });

    for (const geofence of geofences) {
      let isInside = false;

      // Verificar según el tipo de geofence
      if (geofence.type === 'circle') {
        isInside = isPointInCircle(
          [longitude, latitude],
          geofence.center.coordinates,
          geofence.radius
        );
      } else if (geofence.type === 'polygon' && geofence.polygon) {
        isInside = isPointInPolygon(
          [longitude, latitude],
          geofence.polygon.coordinates[0]
        );
      }

      // Emitir alertas según configuración
      if (isInside && geofence.alerts.onEnter) {
        emitGeofenceAlert(userId, geofence, 'enter');
      } else if (!isInside && geofence.alerts.onExit) {
        emitGeofenceAlert(userId, geofence, 'exit');
      }
    }
  } catch (error) {
    console.error('Error al verificar geofences:', error);
  }
};

/**
 * Emite alerta de geofencing
 */
const emitGeofenceAlert = (userId, geofence, alertType) => {
  try {
    const io = getIO();
    
    const alertData = {
      type: alertType,
      geofence: {
        id: geofence._id,
        name: geofence.name,
        description: geofence.description
      },
      timestamp: new Date()
    };

    // Emitir al usuario
    io.to(`user_${userId}`).emit('geofence:alert', alertData);
    
    // Emitir al creador de la geofence si es diferente
    if (geofence.creator.toString() !== userId.toString()) {
      io.to(`user_${geofence.creator}`).emit('geofence:alert', {
        ...alertData,
        userId
      });
    }
  } catch (error) {
    console.error('Error al emitir alerta de geofence:', error);
  }
};

/**
 * Emite actualización de usuarios cercanos
 */
const emitNearbyUsers = async (userId, coordinates, radius = 1000) => {
  try {
    const io = getIO();
    
    // Buscar ubicaciones cercanas
    const nearbyLocations = await Location.find({
      user: { $ne: userId },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: coordinates
          },
          $maxDistance: radius
        }
      },
      createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Últimos 5 minutos
    }).populate('user', 'name email');

    io.to(`user_${userId}`).emit('nearby:users', {
      count: nearbyLocations.length,
      users: nearbyLocations.map(loc => ({
        userId: loc.user._id,
        name: loc.user.name,
        coordinates: loc.location.coordinates,
        timestamp: loc.createdAt
      }))
    });
  } catch (error) {
    console.error('Error al buscar usuarios cercanos:', error);
  }
};

module.exports = {
  emitLocationUpdate,
  checkGeofenceAlerts,
  emitGeofenceAlert,
  emitNearbyUsers
};