// src/services/trafficService.js
const axios = require('axios');

/**
 * Hàm gọi đến API OSRM để lấy danh sách các tuyến đường bộ thực tế
 */
async function getRealRoadCoordinates(oLat, oLng, dLat, dLng) {
    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson&alternatives=true`;
        const response = await axios.get(url);
        if (response.data && response.data.routes && response.data.routes.length > 0) {
            return response.data.routes;
        }
    } catch (error) {
        console.error("Lỗi gọi API OSRM:", error.message);
    }
    return null;
}

/**
 * Hàm thông minh: Tự động băm một danh sách tọa độ dài thành nhiều đoạn nhỏ
 * và gán các mức độ tắc đường (Xanh/Cam/Đỏ) xen kẽ nhau để tạo bản đồ nhiệt thực tế.
 * * ĐỒNG BỘ: Hàm này tính toán thuần túy dựa trên mảng tọa độ đầu vào, 
 * nếu 2 tuyến có tọa độ giống nhau thì kết quả băm màu sẽ giống hệt nhau.
 */
function splitRouteIntoTrafficSegments(coordinates) {
    const segments = [];
    const totalPoints = coordinates.length;
    
    // Nếu tuyến đường quá ngắn (dưới 4 điểm tọa độ), gán mặc định là Xanh cho nhanh
    if (totalPoints < 4) {
        return [{ status: "Xanh", coordinates: coordinates }];
    }

    // Chia tuyến đường thành 3 phần bằng nhau
    const chunkSize = Math.floor(totalPoints / 3);
    const statuses = ["Xanh", "Cam", "Đỏ"]; // Các mức độ tắc đường tương ứng từ đầu đến cuối tuyến

    for (let i = 0; i < 3; i++) {
        const startIdx = i * chunkSize;
        // Phần đoạn cuối cùng sẽ lấy hết toàn bộ số điểm còn lại
        const endIdx = (i === 2) ? totalPoints : (i + 1) * chunkSize + 1; 
        
        const segmentCoords = coordinates.slice(startIdx, endIdx);
        
        if (segmentCoords.length > 0) {
            segments.push({
                status: statuses[i], // Đoạn 1: Xanh, Đoạn 2: Cam, Đoạn 3: Đỏ
                coordinates: segmentCoords
            });
        }
    }
    return segments;
}

// Logic xử lý chính cho API gợi ý tuyến đường
const getRouteSuggestions = async (oLat, oLng, dLat, dLng) => {
    const rawRoutes = await getRealRoadCoordinates(oLat, oLng, dLat, dLng);
    
    if (!rawRoutes || rawRoutes.length === 0) {
        return [];
    }

    const suggestions = [];

    // 1. XỬ LÝ TUYẾN ĐƯỜNG 1 (Luôn là tuyến đường tối ưu nhất mặc định)
    const route1Data = rawRoutes[0];
    const coords1 = route1Data.geometry.coordinates.map(coord => ({
        latitude: coord[1],
        longitude: coord[0]
    }));
    
    suggestions.push({
        id: "route_fastest",
        routeName: "Tuyến 1: Qua trục đường chính",
        totalDistance: `${(route1Data.distance / 1000).toFixed(1)} km`,
        duration: `${Math.round(route1Data.duration / 60)} phút`,
        segments: splitRouteIntoTrafficSegments(coords1)
    });

    // 2. XỬ LÝ TUYẾN ĐƯỜNG 2 (Đường tránh hoặc phương án phụ)
    const hasAlternative = rawRoutes.length > 1;
    const route2Data = hasAlternative ? rawRoutes[1] : route1Data;
    
    const coords2 = route2Data.geometry.coordinates.map(coord => ({
        latitude: coord[1],
        longitude: coord[0]
    }));

    // SỬA ĐỔI QUAN TRỌNG: Loại bỏ hoàn toàn đoạn code ép đảo ngược màu khi trùng đường.
    // Giờ đây, dữ liệu phân đoạn màu sắc sẽ chạy hoàn toàn tự động dựa theo tọa độ thực tế.
    suggestions.push({
        id: "route_alternative",
        routeName: hasAlternative ? "Tuyến 2: Đường tránh thực tế" : "Tuyến 2: Phương án phụ",
        totalDistance: `${(route2Data.distance / 1000).toFixed(1)} km`,
        duration: `${Math.round(route2Data.duration / 60)} phút`,
        segments: splitRouteIntoTrafficSegments(coords2)
    });

    return suggestions;
};

module.exports = {
    getRouteSuggestions
};