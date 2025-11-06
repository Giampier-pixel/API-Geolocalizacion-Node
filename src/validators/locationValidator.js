const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware para manejar errores de validación
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * Validaciones para crear ubicación
 */
const validateCreateLocation = [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitud debe estar entre -90 y 90'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitud debe estar entre -180 y 180'),
  body('accuracy')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La precisión debe ser un número positivo'),
  body('altitude')
    .optional()
    .isFloat()
    .withMessage('La altitud debe ser un número'),
  body('speed')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La velocidad debe ser un número positivo'),
  body('heading')
    .optional()
    .isFloat({ min: 0, max: 360 })
    .withMessage('El rumbo debe estar entre 0 y 360'),
  body('battery')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('La batería debe estar entre 0 y 100'),
  handleValidationErrors
];

/**
 * Validaciones para crear geofence
 */
const validateCreateGeofence = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ max: 100 })
    .withMessage('El nombre no puede exceder 100 caracteres'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitud debe estar entre -90 y 90'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitud debe estar entre -180 y 180'),
  body('radius')
    .isFloat({ min: 10, max: 50000 })
    .withMessage('El radio debe estar entre 10 y 50000 metros'),
  body('type')
    .optional()
    .isIn(['circle', 'polygon'])
    .withMessage('Tipo debe ser circle o polygon'),
  handleValidationErrors
];

/**
 * Validaciones para consultar ubicaciones cercanas
 */
const validateNearbyQuery = [
  query('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitud debe estar entre -90 y 90'),
  query('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitud debe estar entre -180 y 180'),
  query('radius')
    .optional()
    .isFloat({ min: 1, max: 100000 })
    .withMessage('El radio debe estar entre 1 y 100000 metros'),
  handleValidationErrors
];

/**
 * Validaciones para parámetros de ID
 */
const validateId = [
  param('id')
    .isMongoId()
    .withMessage('ID inválido'),
  handleValidationErrors
];

module.exports = {
  validateCreateLocation,
  validateCreateGeofence,
  validateNearbyQuery,
  validateId,
  handleValidationErrors
};