// FE/uiMapServices.js

// Đổi tên thành trafficMapInstance để không bao giờ bị trùng hay đè biến với file index.js
let trafficMapInstance = null; 
let userMarker = null;
let endMarker = null;
let mapPolylines = [];

/**
 * Hàm 1: Khởi tạo nền bản đồ ban đầu
 */
function initTrafficMap(defaultLat, defaultLng) {
    // Khởi tạo và gán vào biến nội bộ của file
    trafficMapInstance = L.map('map').setView([defaultLat, defaultLng], 14);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(trafficMapInstance);

    userMarker = L.marker([defaultLat, defaultLng])
        .addTo(trafficMapInstance)
        .bindPopup('<b>Đang xác vị trí...</b>')
        .openPopup();
        
    return trafficMapInstance; // Trả thực thể ra ngoài cho biến "const map" ở index.js hứng
}

/**
 * Hàm 2: Cập nhật vị trí ghim của Người dùng khi có GPS thật
 */
function updateUserMarkerGPS(lat, lng, popupText) {
    if (userMarker && trafficMapInstance) {
        userMarker.setLatLng([lat, lng]);
        userMarker.setPopupContent(`<b>${popupText}</b>`).openPopup();
        trafficMapInstance.setView([lat, lng], 15); 
    }
}

/**
 * Hàm 3: Cập nhật vị trí ghim của Điểm Đến khi người dùng click
 */
function updateDestinationMarker(lat, lng) {
    if (trafficMapInstance) {
        if (endMarker) { 
            endMarker.setLatLng([lat, lng]); 
        } else { 
            endMarker = L.marker([lat, lng]).addTo(trafficMapInstance).bindPopup('<b>Điểm đến đã chọn</b>').openPopup(); 
        }
    }
}

/**
 * Hàm 4: Dọn dẹp sạch sẽ các đường vẽ cũ và danh sách cũ trên giao diện
 */
function clearOldTrafficData() {
    if (trafficMapInstance) {
        mapPolylines.forEach(polyline => trafficMapInstance.removeLayer(polyline));
        mapPolylines = [];
        document.getElementById('routesView').innerHTML = '';
    }
}

/**
 * Hàm 5: Vẽ dải màu giao thông và hiển thị danh sách các Tuyến đường lên Sidebar
 */
function renderTrafficRoutesToUI(routes) {
    const container = document.getElementById('routesView');
    const statusColors = { 'Xanh': '#10b981', 'Cam': '#f59e0b', 'Đỏ': '#ef4444' };

    routes.forEach((route, idx) => {
        let polylinesOfRoute = [];

        route.segments.forEach(seg => {
            const pathCoordinates = seg.coordinates.map(c => [c.latitude, c.longitude]);
            const polyline = L.polyline(pathCoordinates, {
                color: statusColors[seg.status] || '#94a3b8',
                weight: idx === 0 ? 6 : 3,
                opacity: idx === 0 ? 1 : 0.4
            }).addTo(trafficMapInstance); 
            
            mapPolylines.push(polyline);
            polylinesOfRoute.push(polyline);
        });

        const card = document.createElement('div');
        card.className = `route-card ${idx === 0 ? 'active' : ''}`;
        card.innerHTML = `
            <div class="route-info">
                <span>${route.routeName}</span>
                <span class="route-time">⏱️ ${route.duration}</span>
            </div>
            <div class="route-distance">Chiều dài tuyến: ${route.totalDistance}</div>
        `;

        card.onclick = function() {
            document.querySelectorAll('.route-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            mapPolylines.forEach(p => p.setStyle({ weight: 3, opacity: 0.3 }));
            polylinesOfRoute.forEach(p => p.setStyle({ weight: 7, opacity: 1 }));
        };

        container.appendChild(card);
    });
}