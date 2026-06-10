/**
 * VehicleSelector.jsx
 * Component chọn phương tiện di chuyển
 * Manages: UI rendering, localStorage persistence, map reset on change
 */

import { clearAllRouteLayers } from "../services/routeManager";

// ─── Constants ────────────────────────────────────────────────────────────────
const STORAGE_KEY = "selectedVehicle";
export const DEFAULT_VEHICLE = null;

export const VEHICLES = [
  { id: "walk", icon: "🚶", label: "Đi bộ",  osrmProfile: "foot"    },
  { id: "bike", icon: "🛵", label: "Xe máy", osrmProfile: "bike"    },
  { id: "car",  icon: "🚗", label: "Ô tô",   osrmProfile: "driving" },
];

/**
 * @param {{ mapRef: React.MutableRefObject, selectedVehicle: string|null, onVehicleChange: Function }} props
 */
export default function VehicleSelector({ mapRef, selectedVehicle = DEFAULT_VEHICLE, onVehicleChange }) {
  // Persist sang localStorage + reset map + notify parent
  const handleSelect = (vehicleId) => {
    localStorage.setItem(STORAGE_KEY, vehicleId);

    if (mapRef?.current) {
      clearAllRouteLayers(mapRef.current);
    }

    if (typeof onVehicleChange === "function") {
      onVehicleChange(vehicleId);
    }
  };

  return (
    <div className="vehicle-selector" role="group" aria-label="Chọn phương tiện">
      {VEHICLES.map((v) => (
        <button
          key={v.id}
          className={`vehicle-btn${selectedVehicle === v.id ? " vehicle-btn--active" : ""}`}
          data-vehicle={v.id}
          aria-label={v.label}
          aria-pressed={selectedVehicle === v.id}
          title={v.label}
          onClick={() => handleSelect(v.id)}
        >
          <span className="vehicle-icon">{v.icon}</span>
          <span className="vehicle-label">{v.label}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Trả về vehicle ID đang lưu trong localStorage
 * Dùng cho các module ngoài React (routing modules)
 * @returns {'walk'|'bike'|'car'}
 */
export function getSelectedVehicle() {
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_VEHICLE;
}

/**
 * Trả về OSRM profile tương ứng với vehicle đang chọn
 * @returns {'foot'|'bike'|'driving'}
 */
export function getSelectedOsrmProfile() {
  const id = getSelectedVehicle();
  return VEHICLES.find((v) => v.id === id)?.osrmProfile ?? "foot";
}
