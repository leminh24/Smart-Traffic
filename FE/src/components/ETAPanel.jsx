/**
 * ETAPanel.jsx
 * So sánh thời gian di chuyển 3 phương tiện song song qua OSRM
 * Hiển thị: icon – km – phút ước tính
 */

import { useState, useEffect } from "react";

// ─── Config ───────────────────────────────────────────────────────────────────
const OSRM_BASE_URL =
  import.meta.env.VITE_OSRM_BASE_URL ?? "https://router.project-osrm.org";

const VEHICLE_META = [
  { id: "walk", icon: "🚶", label: "Đi bộ",  profile: "foot",    applyRushHour: false },
  { id: "bike", icon: "🛵", label: "Xe máy", profile: "bike",    applyRushHour: false },
  { id: "car",  icon: "🚗", label: "Ô tô",   profile: "driving", applyRushHour: true  },
];

// ─── Core fetch (export để dùng ngoài component nếu cần) ─────────────────────

/**
 * Gọi OSRM 3 lần song song, trả về object { walk, bike, car }
 * @param {{ lat: number, lng: number }} startCoords
 * @param {{ lat: number, lng: number }} endCoords
 */
const VEHICLE_TIME_CONFIG = {
  walk: { routingProfile: "foot", speedKmh: 4.8, stopMinutes: 1, rushFactor: 1 },
  bike: { routingProfile: "driving", speedKmh: 24, stopMinutes: 2, rushFactor: 1 },
  car: { routingProfile: "driving", speedKmh: 32, stopMinutes: 3, rushFactor: 1.25 },
};

function estimateVehicleMinutes(vehicle, route) {
  const config = VEHICLE_TIME_CONFIG[vehicle.id];
  const km = route.distance / 1000;
  const speedBasedMinutes = (km / config.speedKmh) * 60;
  const osrmMinutes = route.duration / 60;
  const baseMinutes = vehicle.id === "car"
    ? Math.max(osrmMinutes, speedBasedMinutes)
    : speedBasedMinutes;
  return Math.max(1, Math.ceil((baseMinutes * config.rushFactor) + config.stopMinutes));
}

export async function fetchAllVehicleETA(startCoords, endCoords) {
  const coord = (c) => `${c.lng},${c.lat}`;
  const start = coord(startCoords);
  const end   = coord(endCoords);

  const requests = VEHICLE_META.map(async (v) => {
    const url =
      `${OSRM_BASE_URL}/route/v1/${VEHICLE_TIME_CONFIG[v.id].routingProfile}/${start};${end}` +
      `?overview=false&annotations=false`;
    try {
      const res  = await fetch(url);
      const data = await res.json();

      if (data.code !== "Ok" || !data.routes?.length) {
        return { id: v.id, km: "—", minutes: null, error: true };
      }

      const route          = data.routes[0];
      const distanceMeters = route.distance;

      return {
        id     : v.id,
        km     : (distanceMeters / 1000).toFixed(1),
        minutes: estimateVehicleMinutes(v, route),
        error  : false,
      };
    } catch {
      return { id: v.id, km: "—", minutes: null, error: true };
    }
  });

  const results = await Promise.all(requests);
  return Object.fromEntries(results.map((r) => [r.id, r]));
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * @param {{ startCoords: object|null, endCoords: object|null }} props
 */
export default function ETAPanel({ startCoords, endCoords }) {
  const [etaData, setEtaData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Re-fetch mỗi khi điểm đầu/cuối thay đổi
  useEffect(() => {
    if (!startCoords || !endCoords) {
      setEtaData(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchAllVehicleETA(startCoords, endCoords)
      .then((data) => { if (!cancelled) { setEtaData(data); setLoading(false); } })
      .catch(()    => { if (!cancelled) { setEtaData(null);  setLoading(false); } });

    return () => { cancelled = true; };
  }, [startCoords, endCoords]);

  return (
    <div className="eta-panel" aria-live="polite">
      <div className="eta-panel__header">
        <span className="eta-panel__title">⏱ So sánh lộ trình</span>
      </div>

      <div className="eta-panel__rows">
        {!startCoords || !endCoords ? (
          <p className="eta-panel__placeholder">Chọn điểm đầu và điểm cuối để so sánh</p>
        ) : loading ? (
          VEHICLE_META.map((v) => (
            <div key={v.id} className="eta-row eta-row--loading">
              <span className="eta-row__icon">{v.icon}</span>
              <span className="eta-row__label">{v.label}</span>
              <span className="eta-skeleton" />
              <span className="eta-skeleton" />
            </div>
          ))
        ) : !etaData ? (
          <p className="eta-panel__placeholder">Không thể tính tuyến đường</p>
        ) : (
          VEHICLE_META.map((v) => {
            const d = etaData[v.id];
            return (
              <div key={v.id} className={`eta-row${d.error ? " eta-row--error" : ""}`}>
                <span className="eta-row__icon">{v.icon}</span>
                <span className="eta-row__label">{v.label}</span>
                <span className="eta-row__dist">{d.error ? "—" : `${d.km} km`}</span>
                <span className="eta-row__time">
                  {d.error || d.minutes === null ? (
                    <span className="eta-error">Không khả dụng</span>
                  ) : (
                    <><strong>{d.minutes}</strong> phút</>
                  )}
                  {v.applyRushHour && !d.error && (
                    <span className="eta-rush" title={`Hệ số giờ cao điểm ×${VEHICLE_TIME_CONFIG[v.id].rushFactor}`}>
                      ⚠ cao điểm
                    </span>
                  )}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
