/**
 * routeManager.js
 * Quản lý tập trung tất cả route layers trên Leaflet map.
 * Mọi module routing đều registerRouteLayer() tại đây
 * → clearAllRouteLayers() xóa đồng bộ khi đổi vehicle.
 */

/** @type {import('leaflet').Layer[]} */
const _layers = [];

/**
 * Đăng ký một layer để được quản lý
 * @param {import('leaflet').Layer} layer
 */
export function registerRouteLayer(layer) {
  _layers.push(layer);
}

/**
 * Xóa tất cả polyline/route layers khỏi map và reset danh sách
 * @param {import('leaflet').Map} map
 */
export function clearAllRouteLayers(map) {
  _layers.forEach((layer) => {
    if (map.hasLayer(layer)) {
      map.removeLayer(layer);
    }
  });
  _layers.length = 0;
}

/** Debug helper */
export function getActiveLayerCount() {
  return _layers.length;
}
