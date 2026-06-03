// FE/index.js

// 1. Cấu hình địa chỉ API kết nối sang Backend Node.js
const BACKEND_API = 'https://smart-traffic-backend.onrender.com/api/traffic/route-suggestions';

// 2. Vị trí mặc định ban đầu (Hà Nội)
let userGps = { lat: 20.994, lng: 105.807 };

// 3. Khởi tạo bản đồ Leaflet bằng cách gọi hàm từ file uiMapServices.js
const map = initTrafficMap(userGps.lat, userGps.lng);

// 4. Hàm định vị GPS đơn giản cho trình duyệt
function getMyLocationGPS(successCallback, errorCallback) {
    if (!navigator.geolocation) {
        return errorCallback && errorCallback('Trình duyệt không hỗ trợ định vị GPS');
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            successCallback(position.coords.latitude, position.coords.longitude);
        },
        (err) => {
            console.warn('Geolocation error:', err);
            errorCallback && errorCallback(err.message || 'Không thể lấy vị trí');
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// 5. Gọi hàm tự động định vị GPS thực tế
getMyLocationGPS(
    (lat, lng) => {
        userGps.lat = lat;
        userGps.lng = lng;
        updateUserMarkerGPS(lat, lng, 'Vị trí thực tế của bạn');
    },
    (error) => {
        updateUserMarkerGPS(userGps.lat, userGps.lng, 'Vị trí mặc định (Chưa bật GPS)');
        console.warn('Lỗi định vị:', error);
        alert('Không thể tự động định vị. Hệ thống sẽ sử dụng vị trí mặc định!');
    }
);

// 5. Lắng nghe sự kiện click chuột trên bản đồ để điều phối luồng dữ liệu
map.on('click', async function(event) {
    const destLat = event.latlng.lat;
    const destLng = event.latlng.lng;

    // Gọi các hàm dịch vụ giao diện để cập nhật điểm đến và xóa đường vẽ cũ
    updateDestinationMarker(destLat, destLng);
    clearOldTrafficData();
    
    // Bật hiệu ứng chờ tải dữ liệu
    document.getElementById('status-loading').style.display = 'block';

    try {
        // Giao tiếp Client-Server qua Fetch API
        const response = await fetch(`${BACKEND_API}?originLat=${userGps.lat}&originLng=${userGps.lng}&destLat=${destLat}&destLng=${destLng}`);
        const result = await response.json();
        
        // Ẩn hiệu ứng chờ sau khi nhận phản hồi từ Backend
        document.getElementById('status-loading').style.display = 'none';

        if (result.success) {
            // Gọi hàm render từ dịch vụ đồ họa để đổ dữ liệu và vẽ màu lên web
            renderTrafficRoutesToUI(result.data);
        } else {
            alert("Backend xử lý thất bại: " + result.error);
        }
    } catch (err) {
        document.getElementById('status-loading').style.display = 'none';
        console.error("Lỗi Fetch API:", err);
        alert("Lỗi kết nối! Hãy chắc chắn bạn đã bật server BE bằng lệnh 'node index.js' chưa?");
    }
});