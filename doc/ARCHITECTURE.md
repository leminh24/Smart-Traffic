# TÀI LIỆU QUYẾT ĐỊNH KIẾN TRÚC (ARCHITECTURE DECISIONS)

Tài liệu này giải trình kiến trúc hệ thống, các mẫu thiết kế được áp dụng và giải thuật cốt lõi trong dự án Smart Traffic.

---

## 1. Mô hình Kiến trúc Tổng thể
Dự án áp dụng mô hình kiến trúc **Tách biệt Frontend - Backend (Decoupled Architecture)** quản lý dưới dạng **Monorepo**.

> **Lý do lựa chọn**: Giúp đội ngũ phát triển độc lập. Cánh Frontend tập trung vào tối ưu hóa UI/UX đồ họa của Leaflet, cánh Backend tập trung vào thuật toán xử lý chuỗi tọa độ dữ liệu lớn và tích hợp bên thứ ba (OSRM).

---

## 2. Thiết kế chi tiết Phân hệ Backend (Express MVC)
Mã nguồn Backend tổ chức theo mô hình phân lớp chức năng rõ ràng nhằm tách biệt mã nguồn xử lý logic kinh doanh:

* **Routes (`trafficRoutes.js`)**: Điểm tiếp nhận Endpoint HTTP đầu tiên, định hướng yêu cầu vào Controller.
* **Controllers (`trafficController.js`)**: Chịu trách nhiệm trích xuất dữ liệu từ Query Request, thực hiện validate tính toàn vẹn của dữ liệu tọa độ bằng các hàm kiểm tra kiểu số thực của JavaScript trước khi chuyển tiếp sâu xuống tầng dưới.
* **Services (`trafficService.js`)**: Chứa logic lõi của hệ thống. Tầng này trực tiếp dùng Fetch API kết nối tới hệ thống OSRM bên ngoài để kéo dữ liệu hình học tuyến đường.

---

## 3. Quyết định Giải thuật & Tính toán Phân đoạn

### Thuật toán phân đoạn đồ họa giao thông (`splitRouteIntoTrafficSegments`)
Do máy chủ OSRM công cộng chỉ trả về danh sách mảng tọa độ thô không kèm trạng thái ùn tắc, hệ thống sử dụng thuật toán chia cắt chuỗi hình học theo tỷ lệ phần trăm (Chunking Algorithm) để giả lập mật độ:

```javascript
let chunkSize = Math.floor(totalPoints / 3);
// Đoạn cuối đảm bảo quét hết phần dư của mảng tọa độ
let endIdx = (i === 2) ? totalPoints : (i + 1) * chunkSize + 1;