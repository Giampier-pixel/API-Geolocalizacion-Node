/**
 * Calcula la distancia entre dos puntos geográficos usando la fórmula de Haversine
 * @param {number} lat1 - Latitud del punto 1
 * @param {number} lon1 - Longitud del punto 1
 * @param {number} lat2 - Latitud del punto 2
 * @param {number} lon2 - Longitud del punto 2
 * @returns {number} Distancia en metros
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Radio de la Tierra en metros
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distancia en metros
};

/**
 * Verifica si un punto está dentro de un círculo
 * @param {Array} point - [longitude, latitude]
 * @param {Array} center - [longitude, latitude]
 * @param {number} radius - Radio en metros
 * @returns {boolean}
 */
const isPointInCircle = (point, center, radius) => {
  const [lon1, lat1] = point;
  const [lon2, lat2] = center;
  
  const distance = calculateDistance(lat1, lon1, lat2, lon2);
  return distance <= radius;
};

/**
 * Verifica si un punto está dentro de un polígono
 * @param {Array} point - [longitude, latitude]
 * @param {Array} polygon - Array de coordenadas del polígono
 * @returns {boolean}
 */
const isPointInPolygon = (point, polygon) => {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect = ((yi > y) !== (yj > y)) &&
                     (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }

  return inside;
};

/**
 * Formatea coordenadas para GeoJSON
 * @param {number} longitude
 * @param {number} latitude
 * @returns {Object}
 */
const formatGeoJSON = (longitude, latitude) => {
  return {
    type: 'Point',
    coordinates: [parseFloat(longitude), parseFloat(latitude)]
  };
};

/**
 * Valida coordenadas
 * @param {number} longitude
 * @param {number} latitude
 * @returns {boolean}
 */
const validateCoordinates = (longitude, latitude) => {
  return !isNaN(longitude) && 
         !isNaN(latitude) &&
         longitude >= -180 && longitude <= 180 &&
         latitude >= -90 && latitude <= 90;
};

module.exports = {
  calculateDistance,
  isPointInCircle,
  isPointInPolygon,
  formatGeoJSON,
  validateCoordinates
};