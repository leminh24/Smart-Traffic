// FE/index.js

// 1. Cấu hình địa chỉ API kết nối sang Backend Node.js
const BACKEND_API = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    && window.location.port !== '5000'
    ? 'http://localhost:5000/api/traffic/route-suggestions'
    : '/api/traffic/route-suggestions';

// 2. BIẾN TOÀN CỤC ĐIỀU KHIỂN LỘ TRÌNH ĐỘNG
let customOrigin = { lat: 20.994, lng: 105.807 }; // Lưu tọa độ Điểm đi (Ban đầu mặc định HN)
let customDest = null;                            // Lưu tọa độ Điểm đến hiện tại

// 3. Khởi tạo bản đồ Leaflet
const map = initTrafficMap(customOrigin.lat, customOrigin.lng);

// 获取 DOM Elements
const originInput = document.getElementById('origin-input');
const destInput = document.getElementById('search-input');
const suggestionsBox = document.getElementById('suggestions-box');

let searchDebounceTimeout = null;
let activeInputType = 'dest'; // Biến đánh dấu xem đang gõ ở ô 'origin' hay 'dest'

// 4. Hàm định vị GPS trình duyệt
function getMyLocationGPS(successCallback, errorCallback) {
    if (!navigator.geolocation) {
        return errorCallback && errorCallback('Trình duyệt không hỗ trợ định vị GPS');
    }
    navigator.geolocation.getCurrentPosition(
        (position) => { successCallback(position.coords.latitude, position.coords.longitude); },
        (err) => { errorCallback && errorCallback(err.message || 'Không thể lấy vị trí'); },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

// Gọi hàm tự động lấy GPS ban đầu gán vào ô Điểm Đi
getMyLocationGPS(
    (lat, lng) => {
        customOrigin.lat = lat;
        customOrigin.lng = lng;
        originInput.value = `Vị trí của bạn (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        updateUserMarkerGPS(lat, lng, 'Vị trí thực tế của bạn');
    },
    (error) => {
        originInput.value = `Hà Nội (Mặc định - Chưa bật GPS)`;
        updateUserMarkerGPS(customOrigin.lat, customOrigin.lng, 'Vị trí mặc định (Chưa bật GPS)');
        console.warn('Lỗi định vị:', error);
    }
);

// =========================================================================
// HÀM DÙNG CHUNG: GỌI API BACKEND SỬ DỤNG TỌA ĐỘ ĐỘNG
// =========================================================================
async function executeTrafficRoutingProcess() {
    // Nếu chưa chọn điểm đến thì không kích hoạt điều hướng vẽ đường
    if (!customDest) return;

    clearOldTrafficData();
    document.getElementById('status-loading').style.display = 'block';

    try {
        // 🔥 ĐÃ THAY ĐỔI: Dùng customOrigin và customDest động thay vì userGps cố định
        const url = `${BACKEND_API}?originLat=${customOrigin.lat}&originLng=${customOrigin.lng}&destLat=${customDest.lat}&destLng=${customDest.lng}`;
        const response = await fetch(url);
        const result = await response.json();
        
        document.getElementById('status-loading').style.display = 'none';

        if (result.success) {
            renderTrafficRoutesToUI(result.data);
        } else {
            alert("Backend xử lý thất bại: " + result.error);
        }
    } catch (err) {
        document.getElementById('status-loading').style.display = 'none';
        console.error("Lỗi Fetch API Lộ trình:", err);
    }
}

// 5. Lắng nghe sự kiện click chuột trên bản đồ (Mặc định chọn nhanh Điểm Đến)
map.on('click', function(event) {
    const lat = event.latlng.lat;
    const lng = event.latlng.lng;

    customDest = { lat, lng };
    destInput.value = `Điểm chọn từ Bản đồ (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

    updateDestinationMarker(lat, lng);
    executeTrafficRoutingProcess();
});

// =========================================================================
// XỬ LÝ AUTO-COMPLETE CHO CẢ 2 Ô NHẬP LIỆU
// =========================================================================
function setupAutoCompleteForInput(inputElement, type) {
    inputElement.addEventListener('focus', () => {
        activeInputType = type; // Đánh dấu ô đang được tương tác
    });

    inputElement.addEventListener('input', (e) => {
        clearTimeout(searchDebounceTimeout);
        const query = e.target.value.trim();

        if (query.length < 3) {
            suggestionsBox.innerHTML = '';
            suggestionsBox.style.display = 'none';
            return;
        }

        searchDebounceTimeout = setTimeout(async () => {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=105.6,21.1,106.0,20.8&bounded=1&addressdetails=1&limit=6`;
            try {
                const response = await fetch(url, { headers: { 'Accept-Language': 'vi' } });
                const locations = await response.json();
                renderSearchSuggestions(locations);
            } catch (error) {
                console.error('Lỗi truy vấn dữ liệu địa chỉ:', error);
            }
        }, 400);
    });
}

// Kích hoạt lắng nghe tích hợp cho cả ô Điểm đi và Điểm đến
setupAutoCompleteForInput(originInput, 'origin');
setupAutoCompleteForInput(destInput, 'dest');

/**
 * Đổ danh sách gợi ý xuống Dropdown
 */
function renderSearchSuggestions(locations) {
    suggestionsBox.innerHTML = '';

    if (locations.length === 0) {
        const emptyItem = document.createElement('div');
        emptyItem.className = 'suggestion-item';
        emptyItem.innerText = '❌ Không tìm thấy địa điểm phù hợp';
        suggestionsBox.appendChild(emptyItem);
        suggestionsBox.style.display = 'block';
        return;
    }

    suggestionsBox.style.display = 'block';

    locations.forEach(place => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.innerText = place.display_name;

        item.addEventListener('click', () => {
            const lat = parseFloat(place.lat);
            const lng = parseFloat(place.lon);

            if (activeInputType === 'origin') {
                // TH1: Người dùng đang thay đổi ĐIỂM ĐI
                customOrigin = { lat, lng };
                originInput.value = place.display_name;
                
                // Di dời mốc GPS điểm đi (Ghim Xanh) sang vị trí mới vừa chọn
                updateUserMarkerGPS(lat, lng, `Điểm đi: ${place.display_name}`);
                map.flyTo([lat, lng], 14);
            } else {
                // TH2: Người dùng đang tìm ĐIỂM ĐẾN
                customDest = { lat, lng };
                destInput.value = place.display_name;

                // Di dời mốc Điểm đến (Ghim Đỏ) sang vị trí vừa tìm kiếm
                if (window.currentDestMarker) {
                    window.currentDestMarker.setLatLng([lat, lng]);
                } else {
                    window.currentDestMarker = L.marker([lat, lng]).addTo(map);
                }
                window.currentDestMarker.bindPopup(`<b>🎯 Điểm đến:</b><br>${place.display_name}`).openPopup();
                map.flyTo([lat, lng], 14);
            }

            // Ẩn hộp gợi ý đi
            suggestionsBox.innerHTML = '';
            suggestionsBox.style.display = 'none';

            // Tự động vẽ lại đường đi ngay lập tức dựa trên cặp Điểm Đi & Điểm Đến mới
            executeTrafficRoutingProcess(); 
        });

        suggestionsBox.appendChild(item);
    });
}

// Click trượt ra ngoài thanh công cụ thì tự đóng hộp gợi ý
document.addEventListener('click', (e) => {
    if (!originInput.contains(e.target) && !destInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
        suggestionsBox.innerHTML = '';
        suggestionsBox.style.display = 'none';
    }
});