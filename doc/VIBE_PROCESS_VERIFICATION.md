# 🛡️ VIBE PROCESS VERIFICATION: INCIDENT REPORTING, REAL-TIME WARNING & RESPONSIVE MOBILE UI

Tài liệu này chứng minh và ghi nhận chi tiết quá trình phát triển các tính năng mới (**Báo cáo sự cố 2 chạm - Incident Report FAB**, **API quản lý sự cố BE - Incidents CRUD API**, **Đường đỏ theo sự cố cộng đồng - Community-driven Red Zone**, **Cảnh báo sự cố gần thông minh - Nearby Warning Banner**, **Polling đồng bộ đa thiết bị - Cross-device Polling** và **Giao diện thích ứng di động - Responsive Mobile UI**) tuân thủ nghiêm ngặt theo quy trình 4 bước chuẩn hóa: **Plan (Lập kế hoạch) -> Doc (Tài liệu hóa) -> Build (Xây dựng) -> Test (Kiểm thử & Nghiệm thu)**.

---

## 1. Plan (Lập kế hoạch thiết kế)

Giai đoạn này xác định mục tiêu, giải pháp kỹ thuật và sơ đồ cấu trúc trước khi can thiệp vào mã nguồn:

- **Báo cáo sự cố 2 chạm (Incident Report FAB)**:
  - Yêu cầu: Người dùng cần báo cáo tình huống khẩn cấp (tắc đường/tai nạn/ngập lụt) nhanh nhất có thể ngay trên bản đồ mà không cần rời khỏi màn hình điều hướng. Số chạm tối đa cho phép: 2.
  - Giải pháp: Thiết kế nút FAB (Floating Action Button) hình tròn màu cam cố định góc dưới phải. Chạm 1 → mở Incident Picker dạng danh sách 3 nút slide-up. Chạm 2 → gửi POST request lên BE với `{ lat, lng, type }` → hiện toast xác nhận màu xanh.

- **API quản lý sự cố BE (Incidents CRUD API)**:
  - Yêu cầu: Backend cần tiếp nhận báo cáo, lưu trữ, trả về danh sách sự cố theo vị trí và tự động dọn sự cố hết hạn.
  - Hạ tầng: Thiết kế 2 API: `POST /api/traffic/incidents` (tạo mới) và `GET /api/traffic/incidents?lat=&lng=&radius=` (lấy theo bán kính). Dữ liệu lưu in-memory array `incidentsDb` với trường `expiresAt` tự hết hạn sau 1 tiếng.
  - Broadcast: Sau khi lưu sự cố, BE tự động gửi Web Push Notification đến các user có tuyến đường trong vòng 3km thông qua `notificationService.broadcastIncidentToNearbyUsers()`.

- **Đường đỏ theo sự cố cộng đồng (Community-driven Red Zone)**:
  - Yêu cầu: Khi có sự cố được báo cáo, đoạn đường tại vị trí đó phải tự động đổi sang màu đỏ trên bản đồ của tất cả người dùng — không chỉ người báo cáo.
  - Giải pháp: Hàm `buildRealTrafficSegments` trong `trafficService.js` được nâng cấp để kiểm tra danh sách sự cố đang active trước khi gán màu. Bất kỳ điểm tọa độ nào nằm trong bán kính 200m từ sự cố sẽ bị ép màu Đỏ, ghi đè kết quả thuật toán hash địa lý.

- **Cảnh báo sự cố gần thông minh (Nearby Warning Banner)**:
  - Yêu cầu: Khi người dùng đang di chuyển đến gần đoạn đường có sự cố (trong vòng 500m), Sidebar cần tự động hiện cảnh báo nổi bật với tên loại sự cố và khoảng cách còn lại.
  - Giải pháp: Sau mỗi lần `fetchIncidents`, `App.jsx` chạy hàm `checkNearbyWarning` tính khoảng cách Haversine (mét) từ `origin` đến từng sự cố. Nếu ≤ 500m thì set `nearbyWarning` state → truyền xuống `Sidebar` → hiện banner nhấp nháy. Tự ẩn khi user ra xa hơn 500m.

- **Polling đồng bộ đa thiết bị (Cross-device Polling)**:
  - Yêu cầu: Sự cố do người khác báo cáo cần hiện trên bản đồ của tất cả user trong vòng vài giây, không dùng WebSocket.
  - Giải pháp: `App.jsx` khởi động `setInterval` gọi `fetchIncidents` mỗi **15 giây** từ khi mount. Interval tự dọn sạch khi component unmount qua `clearInterval` trong return của `useEffect`. Mỗi lần `origin` thay đổi, polling được reset lại với tọa độ mới.

- **Giao diện thích ứng di động (Responsive Mobile UI)**:
  - Yêu cầu: Giao diện cần hiển thị đẹp và sử dụng được trên màn hình điện thoại (375px) mà không phá vỡ layout Desktop.
  - Giải pháp: Xây dựng hook `useIsMobile()` theo dõi `window.innerWidth <= 480`. Khi `isMobile = true`: SearchBar mở rộng `left: 10px, right: 10px` thay vì width cứng 380px; nút Lưu thu gọn chỉ còn icon 💾; Sidebar điều chỉnh `left: 10px, width: calc(100% - 20px)`; ReportButton giữ nguyên vị trí góc phải.

---

## 2. Doc (Tài liệu hóa kỹ thuật)

Các tính năng và luồng xử lý mới được mô tả chi tiết trong hệ thống tài liệu dự án trước khi lập trình:

1. **Cập nhật Plan.md**: Bổ sung mục 3.2 (API Endpoints mới `/incidents`), mục 4 (cấu trúc thư mục đầy đủ), mục 5 (3 thuật toán cốt lõi: Dynamic Segmentation, Travel Time, Nearby Warning).
2. **Cập nhật CHANGELOG.md**: Ghi nhận chi tiết toàn bộ thay đổi ngày 05/06/2026 bao gồm các file Added/Changed/Fixed cho cả BE và FE.
3. **Tạo mới VIBE_PROCESS_VERIFICATION.md**: Tài liệu hiện tại, mô tả đầy đủ quy trình Plan → Doc → Build → Test cho sprint này.

---

## 3. Build (Xây dựng & Triển khai mã nguồn)

Quá trình lập trình được tiến hành tuần tự từ BE đến FE:

### Backend

- Cập nhật `trafficService.js`:
  - Thêm mảng `incidentsDb` và hằng số `INCIDENT_LABELS`.
  - Thêm hàm `saveIncident({ lat, lng, type })` — lưu sự cố mới với `expiresAt` = +1 tiếng, tự dọn sự cố hết hạn trước khi thêm.
  - Thêm hàm `getAllIncidents()` — lọc sự cố còn hiệu lực theo `expiresAt`.
  - Thêm hàm `getIncidentsNearby(lat, lng, radiusKm)` — kết hợp `getAllIncidents` và Haversine, sắp xếp theo khoảng cách gần nhất.
  - Thêm hàm `haversineKm(lat1, lng1, lat2, lng2)` — công thức Haversine tính khoảng cách km.
  - Nâng cấp `buildRealTrafficSegments` thành `async` — kiểm tra sự cố active trong 200m trước khi gán màu, ép màu Đỏ nếu có sự cố gần.
  - Cập nhật `getRouteSuggestions` thành `async` để `await buildRealTrafficSegments`.
- Cập nhật `trafficController.js`:
  - Thêm `require('../services/notificationService')`.
  - Thêm handler `reportIncident` — validate `lat/lng/type`, gọi `saveIncident`, gọi `broadcastIncidentToNearbyUsers` (non-blocking).
  - Thêm handler `getIncidents` — hỗ trợ filter `?lat=&lng=&radius=`, fallback `getAllIncidents` nếu không có tọa độ.
  - Cập nhật `module.exports` export thêm `reportIncident`, `getIncidents`.
- Cập nhật `trafficRoutes.js`:
  - Thêm `router.post('/incidents', trafficController.reportIncident)`.
  - Thêm `router.get('/incidents', trafficController.getIncidents)`.
- Cập nhật `notificationService.js`:
  - Thêm hàm `haversineKm` nội bộ.
  - Thêm hằng số `ALERT_RADIUS_KM = 3`, `INCIDENT_EMOJI`, `INCIDENT_LABEL`.
  - Thêm hàm `broadcastIncidentToNearbyUsers(incident)` — lọc user trong 3km, gửi Push Notification đến từng user song song qua `Promise.allSettled`.
  - Cập nhật `module.exports` export thêm `broadcastIncidentToNearbyUsers`.

### Frontend

- Cập nhật `api.js`:
  - Tách `BASE_URL` thành hằng số riêng tái sử dụng.
  - Thêm hàm `reportIncident({ lat, lng, type })` — POST `/api/traffic/incidents`.
  - Thêm hàm `getIncidents(lat, lng, radius)` — GET `/api/traffic/incidents?lat=&lng=&radius=`.
- Tạo mới `ReportButton.jsx`:
  - State: `showPicker`, `toast { visible, message }`.
  - FAB button: hình tròn 56px màu cam, icon ⚠️ + label "Báo cáo".
  - Incident Picker: 3 nút pill (🚗 Tắc đường / 🚨 Tai nạn / 🌊 Ngập lụt) slide-up animation.
  - Toast: fixed top-center, màu xanh, tự ẩn sau 2.5 giây.
  - Xử lý lỗi: catch block log console, không crash UI.
- Cập nhật `App.jsx`:
  - Thêm import `ReportButton`, `getIncidents`.
  - Thêm state `incidents`, `nearbyWarning`.
  - Thêm hàm `fetchIncidents()` — gọi API, set `incidents`, gọi `checkNearbyWarning`.
  - Thêm hàm `haversineM(lat1, lng1, lat2, lng2)` — Haversine đơn vị mét.
  - Thêm hàm `checkNearbyWarning(incidentList)` — tìm sự cố gần nhất ≤500m, set/clear `nearbyWarning`.
  - Thêm `useEffect` polling: `setInterval(fetchIncidents, 15000)` + cleanup `clearInterval`.
  - Thêm `useEffect` re-check warning khi `origin` thay đổi.
  - Truyền prop `incidents` xuống `MapView`, `nearbyWarning` xuống `Sidebar`.
  - Render thêm `<ReportButton origin={origin} onReported={fetchIncidents} />`.
- Cập nhật `MapView.jsx`:
  - Thêm `incidents` vào destructuring props.
  - Thêm `incidentZonesRef = useRef([])` cho vùng tròn đỏ.
  - Thêm `useEffect([incidents])` — xóa layer cũ, vẽ lại marker icon + vòng tròn bán kính 200m (`L.circle`) cho mỗi sự cố. Popup hiển thị tên + thời gian báo cáo + thời gian còn lại (phút).
- Cập nhật `Sidebar.jsx`:
  - Thêm prop `nearbyWarning`.
  - Thêm hằng số `WARNING_COLORS` map loại sự cố → màu nền/viền/text/icon.
  - Render banner cảnh báo ở đầu panel: icon loại sự cố + "Sắp đến đoạn [label]" + "Cách [distanceM]m phía trước".
  - Animation `pulseBorder` nhấp nháy viền đỏ 1.2 giây/chu kỳ.
- Cập nhật `SearchBar.jsx` (Responsive):
  - Thêm hook `useIsMobile()` theo dõi `window.innerWidth <= 480`.
  - Container: Mobile → `left: 10px, right: 10px` (full width). Desktop → `left: 60px, width: 380px`.
  - Nút Lưu: Mobile → chỉ icon 💾, padding thu gọn. Desktop → 💾 + chữ "Lưu".
  - Input: thêm `minWidth: 0` để co thu trên flex container mobile.

---

## 4. Test (Kiểm thử & Nghiệm thu thực tế)

Quá trình kiểm thử đã được chạy trực tiếp trên môi trường máy chủ phát triển cục bộ (`localhost:5173` + `localhost:5000`) và xác nhận kết quả:

- **Compile Test (Đạt)**: Vite Dev Server khởi động thành công không có lỗi JSX hay import. Node.js BE khởi động thành công, log xác nhận tất cả routes đã mount.

- **Incident Report FAB Test (Đạt)**:
  1. Mở app, nhìn thấy nút ⚠️ màu cam góc dưới phải.
  2. Chạm 1 → 3 nút pill slide-up mượt mà với animation.
  3. Chạm "Tắc đường" → nút đóng lại, toast "✅ Đã gửi báo cáo: Tắc đường!" hiện 2.5 giây rồi tự mờ.
  4. Chạm ✕ đóng picker → picker đóng, không gửi báo cáo.

- **BE Incidents API Test (Đạt)**:
  1. Mở trình duyệt gõ `http://localhost:5000/api/traffic/incidents` → trả về `{ success: true, data: [] }`.
  2. Gửi POST với body `{ lat: 21.028, lng: 105.852, type: "TAI_NAN" }` → trả về `{ success: true, data: { id, lat, lng, type, label, createdAt, expiresAt } }`.
  3. Gọi lại GET → sự cố vừa tạo xuất hiện trong mảng `data`.
  4. Gửi POST thiếu trường `type` → trả về 400 với message lỗi rõ ràng.
  5. Gửi POST với `type: "INVALID"` → trả về 400 validation error.

- **Community Red Zone Test (Đạt)**:
  1. Báo cáo sự cố tại một điểm trên bản đồ.
  2. Nhập điểm đến đi qua khu vực vừa báo cáo.
  3. Polyline tuyến đường đoạn gần sự cố hiển thị màu đỏ.
  4. Vùng tròn đỏ bán kính 200m hiện xung quanh điểm sự cố.
  5. Popup marker hiển thị đúng: tên sự cố + giờ báo cáo + thời gian còn lại (phút).
  6. Sau 1 tiếng: sự cố tự mất khỏi danh sách, vùng đỏ tự biến mất.

- **Nearby Warning Banner Test (Đạt)**:
  1. Báo cáo sự cố tại tọa độ cách vị trí hiện tại < 500m.
  2. Sidebar tự động hiện banner màu đỏ nhấp nháy "⚠️ Sắp đến đoạn Tắc đường — Cách bạn khoảng [X]m phía trước".
  3. Kéo bản đồ để origin ra xa > 500m → banner tự ẩn.
  4. Thử với các loại sự cố khác nhau: Tai nạn → banner màu cam, Ngập lụt → banner màu xanh dương.

- **Cross-device Polling Test (Đạt)**:
  1. Mở app trên 2 tab trình duyệt.
  2. Tab A báo cáo sự cố tại một điểm.
  3. Trong vòng 15 giây, Tab B tự động cập nhật: vùng đỏ và marker sự cố xuất hiện trên bản đồ mà không cần reload.

- **Responsive Mobile UI Test (Đạt)**:
  1. Mở DevTools → chuyển sang chế độ Mobile (375px).
  2. SearchBar căng full chiều ngang, input không bị tràn hay cắt.
  3. Nút Lưu thu gọn thành icon 💾, vẫn đủ rộng để chạm ngón tay.
  4. Sidebar thu gọn hiển thị full chiều ngang, scroll được danh sách tuyến đường.
  5. FAB ReportButton vẫn nằm đúng vị trí góc dưới phải, không chồng lên Sidebar.
  6. Chuyển lại Desktop (1280px) → layout trở về đúng như cũ.

- **404 Incidents Fix Verification (Đạt)**:
  1. Xác nhận file `trafficRoutes.js` đang chạy trên server có đủ 2 route `/incidents`.
  2. Xác nhận `trafficController.js` export đủ `reportIncident` và `getIncidents`.
  3. Console FE không còn log lỗi "Lỗi khi fetch incidents Error: API error".
  4. Network tab xác nhận `GET /api/traffic/incidents` trả về status 200.
