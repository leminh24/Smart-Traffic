// BE/src/services/trafficService.js
const axios = require('axios');

// ── Kho lưu sự cố In-Memory ───────────────────────────────────────────────────
const incidentsDb = [];

const VEHICLE_TIME_CONFIG = {
  foot: {
    routingProfile: 'foot',
    speedKmh: 4.8,
    minStopMinutes: 1,
    trafficMultiplier: { 'Xanh': 1, 'Cam': 1.05, 'Đỏ': 1.15 }
  },
  bike: {
    routingProfile: 'bike',
    speedKmh: 24,
    minStopMinutes: 2,
    trafficMultiplier: { 'Xanh': 1, 'Cam': 1.25, 'Đỏ': 1.7 }
  },
  driving: {
    routingProfile: 'driving',
    speedKmh: 32,
    minStopMinutes: 3,
    trafficMultiplier: { 'Xanh': 1, 'Cam': 1.8, 'Đỏ': 3.2 }
  }
};

function normalizeVehicle(vehicle = 'foot') {
  if (vehicle === 'walk') return 'foot';
  if (vehicle === 'car') return 'driving';
  return VEHICLE_TIME_CONFIG[vehicle] ? vehicle : 'foot';
}

const INCIDENT_LABELS = {
  TAC_DUONG: 'Tắc đường',
  TAI_NAN:   'Tai nạn',
  NGAP_LUT:  'Ngập lụt'
};

// ── Haversine ────────────────────────────────────────────────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Incident CRUD ────────────────────────────────────────────────────────────
async function saveIncident({ lat, lng, type }) {
  const now = Date.now();
  // Dọn dẹp sự cố hết hạn
  const before = incidentsDb.length;
  incidentsDb.splice(0, incidentsDb.length,
    ...incidentsDb.filter(i => new Date(i.expiresAt).getTime() > now)
  );

  const incident = {
    id:        `inc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    lat,
    lng,
    type,
    label:     INCIDENT_LABELS[type] || type,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
  };
  incidentsDb.push(incident);
  return incident;
}

async function getAllIncidents() {
  const now = Date.now();
  return incidentsDb.filter(inc => new Date(inc.expiresAt).getTime() > now);
}

async function getIncidentsNearby(lat, lng, radiusKm = 5) {
  const active = await getAllIncidents();
  return active
    .map(inc => ({ ...inc, distanceKm: haversineKm(lat, lng, inc.lat, inc.lng) }))
    .filter(inc => inc.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

// ── OSRM ─────────────────────────────────────────────────────────────────────
async function getRealRoadCoordinates(oLat, oLng, dLat, dLng, vehicle = 'foot', avoid = '') {
  try {
    const originLat = parseFloat(oLat);
    const originLng = parseFloat(oLng);
    const destLat   = parseFloat(dLat);
    const destLng   = parseFloat(dLng);

    if (isNaN(originLat) || isNaN(originLng) || isNaN(destLat) || isNaN(destLng)) {
      console.error('❌ [OSRM Service] Tọa độ không hợp lệ!');
      return null;
    }

    const config = VEHICLE_TIME_CONFIG[normalizeVehicle(vehicle)];
    let url = `https://router.project-osrm.org/route/v1/${config.routingProfile}/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson&alternatives=true`;

    if (avoid && avoid.trim() !== '') {
      url += `&avoid=${avoid}&exclude=${avoid}`; 
    }

    console.log(`📡 [OSRM Request] ${url}`);

    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Smart-Traffic/1.0' },
      timeout: 8000
    });

    return response.data?.routes?.length > 0 ? response.data.routes : null;
  } catch (error) {
    console.error('❌ [OSRM Error]', error.message);
    return null;
  }
}

// ── Traffic Logic ────────────────────────────────────────────────────────────
function getTrafficStatusByCoordinate(lat, lng) {
  const hash = Math.abs((Math.round(lat * 250) * 17 + Math.round(lng * 250) * 31) % 100);
  if (hash < 10) return 'Đỏ';
  if (hash < 32) return 'Cam';
  return 'Xanh';
}

async function buildRealTrafficSegments(coordinates) {
  if (!coordinates || coordinates.length === 0) return [];
  const activeIncidents = await getAllIncidents();

  const segments = [];
  let currentStatus = getTrafficStatusByCoordinate(coordinates[0].latitude, coordinates[0].longitude);
  let currentCoords = [coordinates[0]];

  for (let i = 1; i < coordinates.length; i++) {
    const pt = coordinates[i];
    const nearIncident = activeIncidents.some(inc =>
      haversineKm(pt.latitude, pt.longitude, inc.lat, inc.lng) <= 0.2
    );

    const status = nearIncident ? 'Đỏ' : getTrafficStatusByCoordinate(pt.latitude, pt.longitude);

    if (status === currentStatus) {
      currentCoords.push(pt);
    } else {
      segments.push({ status: currentStatus, coordinates: currentCoords });
      currentStatus = status;
      currentCoords = [coordinates[i - 1], pt];
    }
  }

  if (currentCoords.length > 0) {
    segments.push({ status: currentStatus, coordinates: currentCoords });
  }
  return segments;
}

function calculateSegmentKm(coordinates = []) {
  let km = 0;
  for (let i = 1; i < coordinates.length; i++) {
    km += haversineKm(
      coordinates[i-1].latitude, coordinates[i-1].longitude,
      coordinates[i].latitude,   coordinates[i].longitude
    );
  }
  return km;
}

function getSegmentMultiplier(status, config) {
  return config.trafficMultiplier[status] ?? 1;
}

function calculateActualTravelTime(routeData, segments, vehicle = 'foot') {
  const normalizedVehicle = normalizeVehicle(vehicle);
  const config = VEHICLE_TIME_CONFIG[normalizedVehicle];
  const routeKm = routeData.distance / 1000;
  const speedBasedMinutes = (routeKm / config.speedKmh) * 60;
  const osrmMinutes = routeData.duration / 60;
  const baseMinutes = normalizedVehicle === 'driving'
    ? Math.max(osrmMinutes, speedBasedMinutes)
    : speedBasedMinutes;

  const totalSegmentKm = segments.reduce((sum, seg) => sum + calculateSegmentKm(seg.coordinates), 0);
  if (totalSegmentKm <= 0) return Math.max(1, Math.round(baseMinutes + config.minStopMinutes));

  const weightedMultiplier = segments.reduce((sum, seg) => {
    const ratio = calculateSegmentKm(seg.coordinates) / totalSegmentKm;
    return sum + ratio * getSegmentMultiplier(seg.status, config);
  }, 0);

  return Math.max(1, Math.round((baseMinutes * weightedMultiplier) + config.minStopMinutes));
}

// ── Main Function ────────────────────────────────────────────────────────────
const getRouteSuggestions = async (oLat, oLng, dLat, dLng, vehicle = 'foot', avoid = '') => {
  const rawRoutes = await getRealRoadCoordinates(oLat, oLng, dLat, dLng, vehicle, avoid);
  if (!rawRoutes || rawRoutes.length === 0) return [];

  const suggestions = [];
  const config = VEHICLE_TIME_CONFIG[normalizeVehicle(vehicle)];

  // Tuyến chính
  const route1Data = rawRoutes[0];
  const coords1 = route1Data.geometry.coordinates.map(c => ({ latitude: c[1], longitude: c[0] }));
  const segments1 = await buildRealTrafficSegments(coords1);
  const duration1 = calculateActualTravelTime(route1Data, segments1, vehicle);

  suggestions.push({
    id: 'route_fastest',
    routeName: 'Tuyến 1: Qua trục chính hệ thống',
    totalDistance: `${(route1Data.distance / 1000).toFixed(1)} km`,
    duration: `${duration1} phút`,
    segments: segments1
  });

  // Tuyến thay thế (nếu có)
  if (rawRoutes.length > 1) {
    const route2Data = rawRoutes[1];
    const coords2 = route2Data.geometry.coordinates.map(c => ({ latitude: c[1], longitude: c[0] }));
    const segments2 = await buildRealTrafficSegments(coords2);
    const duration2 = calculateActualTravelTime(route2Data, segments2, vehicle);
    const saved = duration1 - duration2;

    suggestions.push({
      id: 'route_alternative',
      routeName: saved >= 5
        ? `Tuyến 2: Đường rẽ tối ưu (Nhanh hơn ${saved} phút)`
        : `Tuyến 2: Đường tránh (${saved >= 0 ? 'Nhanh hơn' : 'Chậm hơn'} ${Math.abs(saved)} phút)`,
      totalDistance: `${(route2Data.distance / 1000).toFixed(1)} km`,
      duration: `${duration2} phút`,
      timeSaved: saved,
      segments: segments2
    });
  }

  return suggestions;
};

module.exports = {
  getRouteSuggestions,
  saveIncident,
  getAllIncidents,
  getIncidentsNearby
};