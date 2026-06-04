# TÀI LIỆU QUYẾT ĐỊNH KIẾN TRÚC (ARCHITECTURE DECISIONS)

Tài liệu này giải trình kiến trúc hệ thống, các mẫu thiết kế được áp dụng và giải thuật cốt lõi trong dự án Smart Traffic.

---

## 1. Mô hình Kiến trúc Tổng thể

Dự án áp dụng mô hình kiến trúc **Tách biệt Frontend - Backend (Decoupled Architecture)** quản lý dưới dạng **Monorepo**.

> **Lý do lựa chọn**: Giúp đội ngũ phát triển độc lập. Cánh Frontend tập trung vào tối ưu hóa UI/UX đồ họa của Leaflet, cánh Backend tập trung vào thuật toán xử lý chuỗi tọa độ dữ liệu lớn và tích hợp bên thứ ba (OSRM).

---

## 2. Thiết kế chi tiết Phân hệ Backend (Express MVC)

Mã nguồn Backend tổ chức theo mô hình phân lớp chức năng rõ ràng nhằm tách biệt mã nguồn xử lý logic kinh doanh:

- **Routes (`trafficRoutes.js`)**: Điểm tiếp nhận Endpoint HTTP đầu tiên, định hướng yêu cầu vào Controller.
- **Controllers (`trafficController.js`)**: Chịu trách nhiệm trích xuất dữ liệu từ Query Request, thực hiện validate tính toàn vẹn của dữ liệu tọa độ bằng các hàm kiểm tra kiểu số thực của JavaScript trước khi chuyển tiếp sâu xuống tầng dưới.
- **Services (`trafficService.js`)**: Chứa logic lõi của hệ thống. Tầng này trực tiếp dùng Fetch API kết nối tới hệ thống OSRM bên ngoài để kéo dữ liệu hình học tuyến đường.
- Mã nguồn ứng dụng giao diện được module hóa thành các cấu trúc thành phần độc lập nhằm tăng tính tái sử dụng và dễ debug:

- **App.jsx**: Đóng vai trò Trạm điều phối trạng thái trung tâm (Central State Hub), nắm giữ dữ liệu dùng chung về tọa độ origin và destination để đồng bộ giữa thanh tìm kiếm và bản đồ.

- **MapView.jsx**: Quản lý lớp hiển thị bản đồ Leaflet. Nhận tọa độ từ App gửi xuống để vẽ Marker, Polyline lộ trình, đồng thời chịu trách nhiệm nạp tài nguyên CSS gốc (leaflet.css) để chống vỡ đồ họa.

- **SearchBar.jsx**: Đảm nhiệm toàn bộ việc bắt sự kiện nhập liệu của người dùng, giao tiếp với hệ thống API tìm kiếm và xử lý kho lưu trữ cục bộ HTML5 LocalStorage.

- **Sidebar.jsx**: Hiển thị bảng tổng hợp kết quả phân tích tuyến đường.

---

## 3. Quyết định Giải thuật & Tính toán Phân đoạn

### Thuật toán phân đoạn đồ họa giao thông (`splitRouteIntoTrafficSegments`)

Do máy chủ OSRM công cộng chỉ trả về danh sách mảng tọa độ thô không kèm trạng thái ùn tắc, hệ thống sử dụng thuật toán chia cắt chuỗi hình học theo tỷ lệ phần trăm (Chunking Algorithm) để giả lập mật độ:

```javascript
let chunkSize = Math.floor(totalPoints / 3);
// Đoạn cuối đảm bảo quét hết phần dư của mảng tọa độ
let endIdx = i === 2 ? totalPoints : (i + 1) * chunkSize + 1;
```

4. Tích hợp Dịch vụ Bên thứ ba (Third-Party Services)
   Hệ thống loại bỏ hoàn toàn bộ máy tìm kiếm Nominatim mã nguồn mở do tốc độ chậm tại Việt Nam, chuyển dịch sang hệ sinh thái Goong Maps API:

Endpoint Autocomplete: [https://rsapi.goong.io/Place/AutoComplete](https://rsapi.goong.io/Place/AutoComplete) -> Tìm kiếm chuỗi gợi ý dựa trên từ khóa.

Endpoint Detail: [https://rsapi.goong.io/Place/Detail](https://rsapi.goong.io/Place/Detail) -> Trích xuất tọa độ hình học từ mã định danh vị trí.

Endpoint Geocode: [https://rsapi.goong.io/Geocode](https://rsapi.goong.io/Geocode) -> Giải mã đảo chiều tọa độ thiết bị sang địa chỉ văn bản thực tế.

5. Quản lý trạng thái dữ liệu bền vững (Data Persistence)
   Thông tin vị trí cá nhân hóa được lưu tại trình duyệt dưới dạng một đối tượng JSON phức hợp bao gồm cả tọa độ địa lý hình học (lat, lng) và chuỗi văn bản tên đường hoàn chỉnh (address), khắc phục nhược điểm chỉ lưu tọa độ thô của phiên bản cũ.
