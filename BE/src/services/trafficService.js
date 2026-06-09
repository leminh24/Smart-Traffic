// src/services/trafficService.js
const axios = require('axios');

// ── Kho lưu sự cố In-Memory ───────────────────────────────────────────────────
const incidentsDb = [];

const INCIDENT_LABELS = {
  TAC_DUONG: 'Tắc đường',
  TAI_NAN:   'Tai nạn',
  NGAP_LUT:  'Ngập lụt'
};

// ── Haversine (dùng chung) ────────────────────────────────────────────────────
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

// ── Incident CRUD ─────────────────────────────────────────────────────────────
async function saveIncident({ lat, lng, type }) {
  // Xóa sự cố hết hạn trước khi thêm mới (dọn dẹp bộ nhớ)
  const now = Date.now();
  const before = incidentsDb.length;
  incidentsDb.splice(0, incidentsDb.length,
    ...incidentsDb.filter(i => new Date(i.expiresAt).getTime() > now)
  );
  if (before !== incidentsDb.length)
    console.log(`🧹 [IncidentDB] Đã xóa ${before - incidentsDb.length} sự cố hết hạn`);

  const incident = {
    id:        `inc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    lat,
    lng,
    type,
    label:     INCIDENT_LABELS[type] || type,
    createdAt: new Date().toISOString(),
    // Hiệu lực 1 tiếng theo yêu cầu
    expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString()
  };
  incidentsDb.push(incident);
  console.log(`🗂️  [IncidentDB] Lưu sự cố mới: ${incident.label} tại (${lat}, ${lng}) — hết hạn lúc ${incident.expiresAt}`);
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
    .sort((a, b) => a.distanceKm - b.distanceKm); // Gần nhất lên đầu
}

// ── OSRM ──────────────────────────────────────────────────────────────────────
async function getRealRoadCoordinates(oLat, oLng, dLat, dLng, vehicle = 'foot') {
  try {
    const originLat = parseFloat(oLat);
    const originLng = parseFloat(oLng);
    const destLat   = parseFloat(dLat);
    const destLng   = parseFloat(dLng);

    if (isNaN(originLat) || !originLng || isNaN(destLat) || !destLng) {
      console.error('❌ [OSRM Service] Tọa độ không hợp lệ!', { oLat, oLng, dLat, dLng });
      return null;
    }

    const profile = vehicle === 'foot' ? 'foot' : 'driving';
    const url = `https://router.project-osrm.org/route/v1/${profile}/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson&alternatives=true`;
    console.log(`📡 [OSRM Request] ${url}`);

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      },
      timeout: 7000
    });

    if (response.data?.routes?.length > 0) {
      console.log(`✅ [OSRM] Tìm thấy ${response.data.routes.length} tuyến`);
      return response.data.routes;
    }
  } catch (error) {
    console.error('❌ [OSRM Error]', error.response?.status || error.message);
  }
  return null;
}

function getTrafficStatusByCoordinate(lat, lng) {
  const hash = Math.abs((Math.round(lat * 250) * 17 + Math.round(lng * 250) * 31) % 100);
  if (hash < 10) return 'Đỏ';
  if (hash < 32) return 'Cam';
  return 'Xanh';
}

/**
 * Phân đoạn đường — nếu đoạn nào có sự cố báo cáo trong vòng 200m thì ép thành ĐỎ
 */
async function buildRealTrafficSegments(coordinates) {
  if (!coordinates || coordinates.length === 0) return [];

  // Lấy danh sách sự cố đang active để overlay
  const activeIncidents = await getAllIncidents();

  const segments = [];
  let currentStatus = getTrafficStatusByCoordinate(coordinates[0].latitude, coordinates[0].longitude);
  let currentCoords = [coordinates[0]];

  for (let i = 1; i < coordinates.length; i++) {
    const pt = coordinates[i];

    // Kiểm tra xem điểm này có nằm gần sự cố nào không (200m)
    const nearIncident = activeIncidents.find(inc =>
      haversineKm(pt.latitude, pt.longitude, inc.lat, inc.lng) <= 0.2
    );

    // Nếu gần sự cố => ép màu ĐỎ, bất kể thuật toán hash nói gì
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

function calculateActualTravelTime(baseDurationSeconds, segments) {
  let baseMinutes = baseDurationSeconds / 60;
  let actualMinutes = 0;
  const totalPoints = segments.reduce((sum, seg) => sum + seg.coordinates.length, 0);
  if (totalPoints === 0) return Math.round(baseMinutes);

  segments.forEach(seg => {
    const ratio = seg.coordinates.length / totalPoints;
    let multiplier = 1.0;
    if (seg.status === 'Cam') multiplier = 1.8;
    if (seg.status === 'Đỏ') multiplier = 3.5;
    actualMinutes += baseMinutes * ratio * multiplier;
  });
  return Math.max(1, Math.round(actualMinutes));
}

const getRouteSuggestions = async (oLat, oLng, dLat, dLng, vehicle = 'foot') => {
  const rawRoutes = await getRealRoadCoordinates(oLat, oLng, dLat, dLng, vehicle);
  if (!rawRoutes || rawRoutes.length === 0) return [];

  const suggestions = [];

  const route1Data = rawRoutes[0];
  const coords1 = route1Data.geometry.coordinates.map(c => ({ latitude: c[1], longitude: c[0] }));
  const segments1 = await buildRealTrafficSegments(coords1);
  const duration1 = calculateActualTravelTime(route1Data.duration, segments1);

  suggestions.push({
    id: 'route_fastest',
    routeName: 'Tuyến 1: Qua trục chính hệ thống',
    totalDistance: `${(route1Data.distance / 1000).toFixed(1)} km`,
    duration: `${duration1} phút`,
    segments: segments1
  });

  if (rawRoutes.length > 1) {
    const route2Data = rawRoutes[1];
    const coords2 = route2Data.geometry.coordinates.map(c => ({ latitude: c[1], longitude: c[0] }));
    const segments2 = await buildRealTrafficSegments(coords2);
    const duration2 = calculateActualTravelTime(route2Data.duration, segments2);
    const saved = duration1 - duration2;

    suggestions.push({
      id: 'route_alternative',
      routeName: saved >= 5
        ? `Tuyến 2: Đường rẽ tối ưu (Nhanh hơn ${saved} phút)`
        : saved < 0
          ? `Tuyến 2: Đường tránh phụ (Chậm hơn ${Math.abs(saved)} phút)`
          : `Tuyến 2: Đường tránh (Nhanh hơn ${saved} phút - Ít hiệu quả)`,
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