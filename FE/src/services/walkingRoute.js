/**
 * walkingRoute.js
 * Tuyến đường đi bộ: OSRM foot profile + polyline mint green + cảnh báo vỉa hè.
 * Không phải React component — gọi trực tiếp từ MapView.jsx hoặc App.jsx.
 */

import L from "leaflet";
import { registerRouteLayer } from "./routeManager";

// ─── Config ───────────────────────────────────────────────────────────────────
const OSRM_BASE_URL =
  import.meta.env.VITE_OSRM_BASE_URL ?? "https://router.project-osrm.org";

const WALK_POLYLINE_OPTIONS = {
  color   : "#06D6A0",
  weight  : 4,
  opacity : 0.9,
  lineJoin: "round",
  lineCap : "round",
};

const STEP_LENGTH_METERS = 0.762; // bước chân trung bình

// Pattern detect đường nguy hiểm từ tên bước OSRM
const HAZARDOUS_PATTERNS = [
  /motorway/i,
  /highway/i,
  /expressway/i,
  /quốc lộ/i,
  /cao tốc/i,
];

// ─── State ────────────────────────────────────────────────────────────────────
/** @type {L.Polyline|null} */
let _walkingLayer = null;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Vẽ tuyến đường đi bộ lên bản đồ Leaflet
 * @param {L.Map}                       map        - Leaflet map instance
 * @param {{ lat: number, lng: number }} startLatLng
 * @param {{ lat: number, lng: number }} endLatLng
 * @returns {Promise<{
 *   steps: number,
 *   km: string,
 *   minutes: number,
 *   hasWarning: boolean,
 *   warningSegments: string[]
 * }>}
 */
export async function drawWalkingRoute(map, startLatLng, endLatLng) {
  const start = `${startLatLng.lng},${startLatLng.lat}`;
  const end   = `${endLatLng.lng},${endLatLng.lat}`;

  const url =
    `${OSRM_BASE_URL}/route/v1/foot/${start};${end}` +
    `?overview=full&geometries=geojson&steps=true&annotations=false`;

  const res  = await fetch(url);
  const data = await res.json();

  if (data.code !== "Ok" || !data.routes?.length) {
    throw new Error(`OSRM foot routing thất bại: ${data.message ?? data.code}`);
  }

  const route          = data.routes[0];
  const distanceMeters = route.distance;
  const durationSec    = route.duration;

  // ── Vẽ polyline ───────────────────────────────────────────────────────────
  const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

  if (_walkingLayer && map.hasLayer(_walkingLayer)) {
    map.removeLayer(_walkingLayer);
  }

  _walkingLayer = L.polyline(coords, WALK_POLYLINE_OPTIONS).addTo(map);
  registerRouteLayer(_walkingLayer);
  map.fitBounds(_walkingLayer.getBounds(), { padding: [40, 40] });

  // ── Tính bước chân ────────────────────────────────────────────────────────
  const steps = Math.round(distanceMeters / STEP_LENGTH_METERS);

  // ── Detect đoạn nguy hiểm ─────────────────────────────────────────────────
  const warningSegments = _detectHazardousSegments(route.legs ?? []);
  const hasWarning      = warningSegments.length > 0;

  return {
    steps,
    km          : (distanceMeters / 1000).toFixed(1),
    minutes     : Math.ceil(durationSec / 60),
    hasWarning,
    warningSegments,
  };
}

/** Trả về layer reference hiện tại */
export function getWalkingLayer() {
  return _walkingLayer;
}

// ─── Private Helpers ──────────────────────────────────────────────────────────

function _detectHazardousSegments(legs) {
  const hazardous = [];
  for (const leg of legs) {
    for (const step of leg.steps ?? []) {
      const combined = `${step.name ?? ""} ${step.ref ?? ""}`.trim();
      const isHazardous =
        HAZARDOUS_PATTERNS.some((p) => p.test(combined)) || step.mode === "ferry";
      if (isHazardous && combined) hazardous.push(combined);
    }
  }
  return [...new Set(hazardous)];
}
