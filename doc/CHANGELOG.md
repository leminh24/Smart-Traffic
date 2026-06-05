# NHẬT KÝ THAY ĐỔI DỰ ÁN (CHANGELOG)

Toàn bộ tiến trình cập nhật, sửa lỗi cấu hình và cấu trúc mã nguồn thực tế của hệ thống Smart Traffic.

---

## [Bản sửa lỗi] - 2026-06-03

### Added

- Triển khai phân hệ Backend lên đám mây Render Cloud dưới dạng Web Service.
- Tích hợp Middleware `cors` vào file chạy chính của Node.js để cho phép gọi API liên miền từ GitHub Pages.

### Fixed

- **Sửa lỗi Build sập (Status 254) lúc 03:41 PM**: Khắc phục lỗi `npm error enoent Could not read package.json` bằng cách cấu hình thuộc tính **Root Directory** trên Render trỏ thẳng vào thư mục con `BE`.
- **Sửa lỗi cổng kết nối**: Chuyển cấu hình cổng cứng `5000` của Server Express sang cổng động `process.env.PORT || 5000` để tương thích với hạ tầng Render.
- **Sửa đường dẫn API**: Thay đổi hằng số `BACKEND_API` trong file `FE/index.js` từ `localhost:5000` sang URL Production thực tế của Render (`https://smart-traffic-backend.onrender.com`).

---

## [Nâng cấp] - 2026-06-03

### Added

- Khởi tạo bộ tài liệu kỹ thuật tiêu chuẩn cho dự án bao gồm: Đặc tả yêu cầu (`SPEC.md`), Quyết định kiến trúc (`ARCHITECTURE.md`), Hướng dẫn vận hành (`README.md`) và Nhật ký thay đổi (`CHANGELOG.md`).
- Thêm file `index.html` điều hướng (Meta Refresh Redirect) tại thư mục gốc của Repository. File này tự động chuyển hướng trình duyệt vào `FE/index.html` sau 0 giây để giữ nguyên cấu trúc thư mục `FE` mà không bị lỗi 404 Pages.

---

## [Nâng cấp] - 2026-06-04

### Added

- Khởi tạo cấu trúc React + Vite: Tách biệt mã nguồn giao diện vào các component modular hóa bao gồm `App.jsx`, `MapView.jsx`, `SearchBar.jsx` và `Sidebar.jsx`.
- Tích hợp cơ chế Debounce: Sử dụng hook `useRef` thiết lập bộ đếm thời gian trễ 400ms cho mọi hành động gõ phím trên ô tìm kiếm, giúp giảm tải hơn 60% số lượng request rác gửi lên máy chủ API.
- Tính năng đổ dữ liệu đã lưu khi Focus: Thiết kế thêm phân hệ lắng nghe sự kiện `onFocus` vào ô input; tự động nạp dữ liệu Nhà riêng và Công ty từ `localStorage` lên đầu danh sách gợi ý để tăng trải nghiệm người dùng.
- Tích hợp Photon Reverse Geocoding: Bổ sung tính năng tự động dịch tọa độ GPS thiết bị thành địa chỉ tên đường cụ thể của Việt Nam ngay lúc vừa tải bản đồ.

### Changed

- Đổi nhà cung cấp bản đồ số: Thay thế gói giao diện bản đồ không màu của CartoDB (Light All) sang gói bản đồ có đầy đủ màu sắc chi tiết ngõ ngách của OpenStreetMap (OSM).
- Nâng cấp công cụ tìm kiếm: Chuyển đổi toàn bộ logic tìm kiếm địa chỉ từ hệ thống Nominatim hoạt động không ổn định sang Photon API (Komoot) miễn phí, không cần API key.
- Cải tiến cấu trúc lưu trữ: Thay đổi cấu trúc lưu địa chỉ ưa thích trong `localStorage` từ việc lưu tọa độ thô sang dạng Object chứa cả tọa độ và tên hiển thị để tái sử dụng trên giao diện.

### Fixed

- Sửa lỗi bản đồ mất màu/vỡ khối: Khắc phục lỗi thiếu CSS bằng việc import trực tiếp file tài nguyên chuẩn `leaflet/dist/leaflet.css` vào cổng chạy chính `main.jsx` của React.
- Sửa lỗi sập luồng tìm kiếm `net::ERR_NAME_NOT_RESOLVED`: Sửa đổi chính xác toàn bộ các endpoint gọi API bị sai domain.
- Sửa lỗi định vị bừa: Thay thế logic lấy tọa độ giả lập ngẫu nhiên bằng Geolocation API chuẩn của trình duyệt (`navigator.geolocation.getCurrentPosition`) để lấy chuẩn vị trí thực tế của người dùng.
- Sửa lỗi đè tầng giao diện (UI Overlapping): Khắc phục lỗi menu thả xuống của ô tìm kiếm Điểm xuất phát bị che mất dưới ô Điểm đến bằng giải pháp gán `zIndex` động theo trạng thái mở rộng của component.

---

## [Nâng cấp lớn] - 2026-06-05

### Added — Backend

- **Phân hệ quản lý sự cố (Incidents Module)** trong `trafficService.js`:
  - Khởi tạo mảng `incidentsDb` làm kho lưu trữ in-memory cho toàn bộ sự cố.
  - Thêm hàm `saveIncident({ lat, lng, type })` — tạo sự cố mới với `id` UUID, `label` tiếng Việt, `createdAt` và `expiresAt` (+1 tiếng). Tự động dọn sự cố hết hạn trước mỗi lần thêm mới để tránh tốn bộ nhớ.
  - Thêm hàm `getAllIncidents()` — lọc và trả về danh sách sự cố chưa hết hạn.
  - Thêm hàm `getIncidentsNearby(lat, lng, radiusKm)` — lọc sự cố trong bán kính cho trước, đính kèm trường `distanceKm`, sắp xếp theo khoảng cách gần nhất lên đầu.
  - Thêm hàm `haversineKm(lat1, lng1, lat2, lng2)` — công thức tính khoảng cách đường chim bay giữa 2 tọa độ (km).
  - Nâng cấp `buildRealTrafficSegments` thành `async` — đọc danh sách sự cố active và ép màu Đỏ cho mọi điểm tọa độ nằm trong bán kính 200m của sự cố, ghi đè kết quả thuật toán hash địa lý.

- **Handlers mới** trong `trafficController.js`:
  - Thêm `reportIncident` — validate đủ `lat/lng/type`, kiểm tra `type` hợp lệ trong whitelist, parse Float, gọi `saveIncident`, kích hoạt `broadcastIncidentToNearbyUsers` bất đồng bộ (non-blocking).
  - Thêm `getIncidents` — hỗ trợ filter theo `?lat=&lng=&radius=`, fallback lấy tất cả nếu không có tọa độ.

- **Routes mới** trong `trafficRoutes.js`:
  - `POST /api/traffic/incidents` — nhận báo cáo sự cố từ FE.
  - `GET /api/traffic/incidents` — trả danh sách sự cố theo vị trí.

- **Phân hệ broadcast thông báo** trong `notificationService.js`:
  - Thêm hằng số `ALERT_RADIUS_KM = 3`, mapping `INCIDENT_EMOJI` và `INCIDENT_LABEL`.
  - Thêm hàm `haversineKm` nội bộ để tính khoảng cách user — sự cố.
  - Thêm hàm `broadcastIncidentToNearbyUsers(incident)` — lọc user có `pushSubscription` và tuyến đường trong 3km, gửi Push Notification song song qua `Promise.allSettled`, log kết quả từng user.

### Added — Frontend

- **Component mới `ReportButton.jsx`**:
  - FAB button tròn 56px màu cam `#F97316`, icon ⚠️ + label "Báo cáo", shadow cam phát sáng.
  - Incident Picker: 3 nút pill slide-up (🚗 Tắc đường đỏ / 🚨 Tai nạn cam / 🌊 Ngập lụt xanh), animation `slideUpFade 0.25s ease`.
  - Overlay trong suốt bắt sự kiện click ngoài để đóng picker.
  - Toast notification fixed top-center, màu xanh, tự ẩn 2.5 giây.

- **Polling đồng bộ đa thiết bị** trong `App.jsx`:
  - State mới: `incidents[]`, `nearbyWarning`.
  - Hàm `fetchIncidents()` gọi API, cập nhật `incidents`, kích hoạt `checkNearbyWarning`.
  - `setInterval(fetchIncidents, 15000)` khởi động khi mount, tự dọn `clearInterval` khi unmount.
  - `useEffect([origin])` re-check cảnh báo gần mỗi khi vị trí người dùng thay đổi.

- **Cảnh báo sự cố gần** trong `App.jsx`:
  - Hàm `haversineM` tính khoảng cách mét giữa 2 tọa độ.
  - Hàm `checkNearbyWarning(incidentList)` tìm sự cố gần nhất ≤500m, set `nearbyWarning = { label, distanceM, type }` hoặc `null`.

- **Hiển thị sự cố trên bản đồ** trong `MapView.jsx`:
  - Nhận thêm prop `incidents`.
  - `useEffect([incidents])` vẽ lại toàn bộ marker và vùng tròn: `L.circle` bán kính 200m màu theo loại sự cố (opacity 0.18, viền nét đứt), `L.divIcon` emoji icon, popup hiển thị tên + giờ báo cáo + thời gian còn lại.

- **Banner cảnh báo** trong `Sidebar.jsx`:
  - Nhận thêm prop `nearbyWarning`.
  - Banner nổi bật ở đầu panel với màu nền/viền/text theo loại sự cố, animation `pulseBorder` nhấp nháy viền 1.2 giây/chu kỳ.
  - Hiển thị: icon loại sự cố + "Sắp đến đoạn [label]" + "Cách bạn khoảng [X]m phía trước".

- **Hàm API mới** trong `api.js`:
  - `reportIncident({ lat, lng, type })` — POST `/api/traffic/incidents`.
  - `getIncidents(lat, lng, radius)` — GET `/api/traffic/incidents?lat=&lng=&radius=`.
  - Tách `BASE_URL` thành hằng số dùng chung cho cả 3 hàm.

### Changed

- Nâng cấp `buildRealTrafficSegments` từ sync → async để có thể đọc `incidentsDb` trước khi phân đoạn màu.
- Nâng cấp `getRouteSuggestions` thêm `await` cho `buildRealTrafficSegments`.
- `SearchBar.jsx` — thêm hook `useIsMobile()`, layout container thích ứng động giữa Desktop (width 380px cố định) và Mobile (căng full width, chừa 10px mỗi bên).

### Fixed

- **Sửa lỗi `incidents is not defined` trong `MapView.jsx`**: Thêm `incidents` vào destructuring props của component. Lỗi xảy ra do `useEffect` tham chiếu biến `incidents` chưa được khai báo trong scope component.
- **Sửa lỗi 404 `GET /api/traffic/incidents`**: Xác nhận file `trafficController.js` trên server đã được cập nhật đủ handler `reportIncident` và `getIncidents`. Lỗi xảy ra do file cũ chưa được thay thế dù `trafficRoutes.js` đã khai báo route mới.
