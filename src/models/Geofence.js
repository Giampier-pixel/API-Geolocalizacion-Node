const mongoose = require('mongoose');

const geofenceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre de la zona es requerido'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  description: {
    type: String,
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  center: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  radius: {
    type: Number,
    required: [true, 'El radio es requerido'],
    min: [10, 'El radio mínimo es 10 metros'],
    max: [50000, 'El radio máximo es 50km']
  },
  type: {
    type: String,
    enum: ['circle', 'polygon'],
    default: 'circle'
  },
  polygon: {
    type: {
      type: String,
      enum: ['Polygon']
    },
    coordinates: {
      type: [[[Number]]] // Array de arrays de coordenadas
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  alerts: {
    onEnter: {
      type: Boolean,
      default: true
    },
    onExit: {
      type: Boolean,
      default: true
    },
    onDwell: {
      type: Boolean,
      default: false
    },
    dwellTime: {
      type: Number,
      default: 300 // segundos
    }
  }
}, {
  timestamps: true
});

// Índices geoespaciales
geofenceSchema.index({ center: '2dsphere' });
geofenceSchema.index({ polygon: '2dsphere' });
geofenceSchema.index({ creator: 1 });

module.exports = mongoose.model('Geofence', geofenceSchema);