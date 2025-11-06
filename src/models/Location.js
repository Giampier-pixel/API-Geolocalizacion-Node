const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Las coordenadas son requeridas'],
      validate: {
        validator: function(coords) {
          return coords.length === 2 &&
                 coords[0] >= -180 && coords[0] <= 180 &&
                 coords[1] >= -90 && coords[1] <= 90;
        },
        message: 'Coordenadas inválidas'
      }
    }
  },
  accuracy: {
    type: Number,
    min: 0,
    default: 0
  },
  altitude: {
    type: Number,
    default: null
  },
  speed: {
    type: Number,
    min: 0,
    default: null
  },
  heading: {
    type: Number,
    min: 0,
    max: 360,
    default: null
  },
  battery: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  isMoving: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Índices
locationSchema.index({ location: '2dsphere' });
locationSchema.index({ user: 1, createdAt: -1 });
locationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // Expira en 30 días

module.exports = mongoose.model('Location', locationSchema);