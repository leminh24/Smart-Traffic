# 🗺️ PROJECT PLAN: SMART TRAFFIC (MVP)

## 1. Stack & Kiến Trúc Hiện Tại (Core Context)

- **Frontend**: React 19 + Vite + JavaScript (JSX) + CSS Inline Styles + Leaflet.js.
- **Backend**: Node.js + Express.js (MVC Pattern, chạy qua `node index.js`).
- **Database**: In-Memory Array (mảng `incidentsDb` trong RAM — dự kiến nâng cấp lên MongoDB/PostgreSQL).
- **Auth**: Chưa tích hợp (MVP scope).
- **Map Engine**: Leaflet.js + OpenStreetMap tile layer + OSRM Routing Engine (Public API).
- **Geocoding**: Photon API (Komoot) — miễn phí, không cần API key, tối ưu tiếng Việt.
- **Incident Lifecycle**: Sự cố tự hết hạn sau 1 tiếng theo trường `expiresAt`. Polling FE mỗi 15 giây để đồng bộ trạng thái sự cố giữa các thiết bị.
- **Responsive**: Hook `useIsMobile()` theo dõi `window.innerWidth <= 480` để điều chỉnh layout động giữa Desktop và Mobile.

## 2. Định Hướng UI/UX & Hệ Thống Thẩm Mỹ

- **Theme**: Light mode mặc định — nền trắng, bóng đổ nhẹ, bo góc 12px.
- **Accent Colors**:
  - Primary: `#2196F3` (Blue) | Incident FAB: `#F97316` (Orange)
  - Traffic Clear: `#10b981` (Emerald) | Traffic Slow: `#f59e0b` (Amber) | Traffic Jam: `#ef4444` (Red)
  - Incident Tam Nan: `#F59E0B` | Incident Ngap Lut: `#3B82F6`
- **Style**: Floating card panels (SearchBar, Sidebar) phủ lên bản đồ full-screen. Font hệ thống sans-serif mặc định của trình duyệt.
- **Chuyển động**: CSS transition `0.2s ease` cho các nút và card. Animation `slideUpFade` cho Incident Picker. Animation `pulseBorder` nhấp nháy cảnh báo sự cố gần.
- **Nguyên tắc**: Không viết code giả hoặc placeholder. Tối thiểu 2 chạm để hoàn thành mọi thao tác quan trọng (báo cáo sự cố).

## 3. Bản Đồ Màn Hình & API Endpoints (MVP Scope)

### 3.1. Danh Sách Màn Hình Chính

1. **Bản đồ chính (`/`)**: Giao diện bản đồ Leaflet full-screen hiển thị vị trí người dùng (marker xanh), điểm đến (marker đỏ), polyline tuyến đường đa sắc (Xanh/Cam/Đỏ theo mức độ tắc), vùng tròn sự cố bán kính 200m và marker icon sự cố (🚗🚨🌊).
2. **SearchBar (overlay trên)**: Panel kính trắng góc trên trái. Hai ô tìm kiếm điểm xuất phát và điểm đến với Autocomplete Photon API, Debounce 400ms, lưu địa điểm nhanh vào LocalStorage (Nhà/Công ty), Reverse Geocoding tự động khi load GPS.
3. **Sidebar (overlay dưới trái)**: Panel kính trắng góc dưới trái hiển thị danh sách tuyến đường, thời gian di chuyển, khoảng cách và banner cảnh báo sự cố gần (≤500m) nhấp nháy theo màu loại sự cố.
4. **ReportButton (overlay dưới phải)**: Nút FAB tròn màu cam cố định góc dưới phải. Chạm 1 → mở Incident Picker 3 nút (Tắc đường/Tai nạn/Ngập lụt). Chạm 2 → gửi báo cáo lên BE + hiện toast xanh xác nhận.

### 3.2. Hệ Thống API Endpoints

- **Routing**: `GET /api/traffic/route-suggestions?oLat=&oLng=&dLat=&dLng=` — Lấy tuyến đường từ OSRM, phân đoạn màu, tính thời gian thực tế theo mức tắc.
- **Incidents**:
  - `POST /api/traffic/incidents` — Gửi báo cáo sự cố mới `{ lat, lng, type }`, lưu vào `incidentsDb`, broadcast push notification đến user lân cận.
  - `GET /api/traffic/incidents?lat=&lng=&radius=` — Lấy danh sách sự cố còn hiệu lực (chưa hết `expiresAt`) trong bán kính `radius` km, sắp xếp theo khoảng cách gần nhất.

## 4. Cấu Trúc Thư Mục Dự Án

```
Smart-Traffic/
├── BE/
│   ├── index.js                        # Entry point Express, mount routes
│   └── src/
│       ├── config/environment.js       # Biến môi trường
│       ├── controllers/
│       │   └── trafficController.js    # getRouteSuggestions, reportIncident, getIncidents
│       ├── jobs/trafficCron.js         # Cron job dọn sự cố hết hạn
│       ├── routes/trafficRoutes.js     # Khai báo routes /suggestions, /incidents
│       └── services/
│           ├── trafficService.js       # OSRM, chunking, incident CRUD, Haversine
│           └── notificationService.js  # Web Push VAPID, broadcastIncidentToNearbyUsers
└── FE/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx                     # Root state, polling 15s, nearbyWarning logic
        ├── main.jsx
        ├── styles.css
        ├── components/
        │   ├── MapView.jsx             # Leaflet map, polylines, incident markers + zones
        │   ├── SearchBar.jsx           # Photon Autocomplete, GPS, LocalStorage
        │   ├── Sidebar.jsx             # Route list, nearbyWarning banner
        │   └── ReportButton.jsx        # FAB, Incident Picker, Toast
        └── services/
            └── api.js                  # getRouteSuggestions, reportIncident, getIncidents
```

## 5. Thuật Toán Cốt Lõi

### 5.1. Phân đoạn lưu thông (Dynamic Traffic Segmentation)

Lộ trình OSRM trả về mảng tọa độ thô → Hàm `buildRealTrafficSegments` quét từng điểm:

- Nếu điểm nằm trong **200m** so với sự cố đang active → ép màu **Đỏ** (override hash).
- Nếu không có sự cố → gán màu theo **thuật toán hash địa lý** `(gridLat * 17 + gridLng * 31) % 100`: hash < 10 = Đỏ (10%), hash < 32 = Cam (22%), còn lại = Xanh (68%).
- Các điểm liên tiếp cùng màu được gom vào 1 segment → vẽ 1 polyline.

### 5.2. Tính thời gian thực tế (Actual Travel Time)

Thời gian OSRM cơ bản (giây) được nhân hệ số theo tỉ lệ đoạn màu:

- Đoạn Xanh: nhân **1.0x** | Đoạn Cam: nhân **1.8x** | Đoạn Đỏ: nhân **3.5x**

### 5.3. Cảnh báo sự cố gần (Nearby Warning)

`App.jsx` sau mỗi lần `fetchIncidents` chạy `checkNearbyWarning`:

- Tính khoảng cách Haversine (mét) từ `origin` đến từng sự cố.
- Nếu khoảng cách **≤ 500m** → set `nearbyWarning` → Sidebar hiện banner nhấp nháy.
- Nếu user di chuyển ra xa hơn 500m → `nearbyWarning = null` → banner tự ẩn.
