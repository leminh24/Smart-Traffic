// =========================================================================
// SERVICES & UTILS (CẤU HÌNH & HÀM BỔ TRỢ BIỆT LẬP)
// =========================================================================

export const BACKEND_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    && window.location.port !== '5000'
    ? 'http://localhost:5000'
    : '';

export const SAVED_ADDRESSES_KEY = 'smartTrafficSavedAddresses';

// Hàm lấy GPS thực tế
export function getMyLocationGPS(successCallback, errorCallback) {
    if (!navigator.geolocation) {
        return errorCallback && errorCallback('Trình duyệt không hỗ trợ định vị GPS');
    }
    navigator.geolocation.getCurrentPosition(
        (position) => { successCallback(position.coords.latitude, position.coords.longitude); },
        (err) => { errorCallback && errorCallback(err.message || 'Không thể lấy vị trí'); },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

// Công thức Haversine tính khoảng cách giữa 2 tọa độ
export function calculateDistanceInMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))); 
}

// Chuyển đổi mã khóa phục vụ Web Push
export function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Gửi đồng bộ cấu hình cài đặt lên Server backend
export async function saveUserPreferences(savedHomeCoords, savedWorkCoords, pushSubscription = null) {
    const payload = {
        userId: "user_01",
        commuteTime: document.getElementById('commute-time-input').value,
        homeLocation: savedHomeCoords,
        workLocation: savedWorkCoords
    };
    if (pushSubscription) payload.pushSubscription = pushSubscription;

    try {
        await fetch(`${BACKEND_BASE}/api/traffic/user-preferences`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (e) {
        console.error("Lỗi đồng bộ Backend preferences:", e);
    }
}