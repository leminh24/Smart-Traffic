# ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE SPECIFICATION)

Tài liệu này định nghĩa các yêu cầu chức năng, phi chức năng và giao thức ràng buộc dữ liệu đầu cuối của hệ thống Smart Traffic.

---

## 1. Yêu cầu chức năng (Functional Requirements)

- **RF-01: Định vị tự động (Geolocation)**: Hệ thống sử dụng Geolocation API của trình duyệt để dò tìm tọa độ thực tế của người dùng. Nếu thất bại hoặc người dùng từ chối, hệ thống tự động fallback về tọa độ mặc định tại trung tâm Hà Nội `(20.994, 105.807)`.
- **RF-02: Tương tác Bản đồ (Map Interaction)**: Người dùng có thể click chuột vào bất kỳ điểm nào trên lớp bản đồ số để chọn điểm đến. Hệ thống sẽ ghim Marker đích và xóa bỏ toàn bộ lộ trình cũ trước đó.
- **RF-03: Tìm kiếm Lộ trình Kép (Dual-Route Suggestion)**: Hệ thống phải đề xuất hai tuyến đường tối ưu dựa trên dữ liệu mạng lưới đường bộ từ OSRM.
- **RF-04: Phân đoạn trạng thái Giao thông (Traffic Segment Styling)**: Tuyến đường trả về phải được băm nhỏ thành các đoạn (Segments) và gán dải màu trực quan:
  - **Xanh**: Giao thông thông thoáng.
  - **Cam**: Giao thông chậm/Mật độ vừa phải.
  - **Đỏ**: Ùn tắc nghiêm trọng.
- **RF-05: Sidebar Thông tin (Route-card UX)**: Hiển thị danh sách tuyến đường kèm theo tên tuyến, thời gian di chuyển dự kiến (`⏱️ duration`) và chiều dài tuyến (`totalDistance`). Cho phép click chọn thẻ để highlight tuyến tương ứng trên bản đồ. -**RF-06**: Tìm kiếm thông minh hai đầu (Smart Autocomplete & Place Detail): Tích hợp Goong API cho cả ô Điểm xuất phát và Điểm đến. Hệ thống trả về gợi ý địa chỉ dạng "gõ đến đâu hiển thị đến đấy". Khi bấm chọn, hệ thống dựa vào place_id để bóc tách tọa độ chính xác nhằm tái định vị Marker.

-**RF-07**: Truy cập nhanh Địa điểm đã lưu (LocalStorage Quick Access): Khi người dùng đặt con trỏ chuột vào (Focus) bất kỳ ô tìm kiếm nào, hệ thống phải tự động kiểm tra localStorage và đẩy danh sách các địa điểm đã lưu (Nhà riêng/Công ty) lên vị trí đầu tiên của bảng gợi ý giúp người dùng chọn nhanh không cần gõ phím.

---

## 2. Yêu cầu phi chức năng (Non-Functional Requirements)

- **RNF-01: Tính khả dụng & Phản hồi nhanh**: Thời gian xử lý truy vấn định tuyến của API không vượt quá 2 giây (trong điều kiện máy chủ Backend đã hoạt động bình thường).
- **RNF-02: Tính bảo mật mạng chéo (CORS)**: Hệ thống phải cho phép kết nối an toàn từ các nguồn tài nguyên chéo (Cross-Origin) để Frontend lưu trữ trên GitHub Pages vẫn giao tiếp được với API trên Render.
- **RNF-03: Tính tương thích**: Giao diện thiết kế theo chuẩn responsive, hiển thị tốt trên cả màn hình máy tính và thiết bị di động thông minh mà không bị vỡ bố cục bản đồ.
- **RNF-04**: Quản lý tầng giao diện (Z-Index Layering): Các dropdown gợi ý và menu lưu trữ của ô nhập liệu phía trên phải có mức ưu tiên hiển thị cao hơn ô phía dưới, đảm bảo không bị đè khuất phân lớp UI.

---

## 3. Đặc tả chi tiết Hợp đồng dữ liệu API (API Contract)

### `GET /api/traffic/route-suggestions`

#### Tham số đầu vào (Query Parameters)

Hệ thống sử dụng cơ chế ép kiểu `Number.parseFloat()` kết hợp hàm `Number.isFinite()` để xác thực nghiêm ngặt dữ liệu đầu vào:

| Tham số     | Kiểu dữ liệu | Bắt buộc | Mô tả            |
| :---------- | :----------- | :------- | :--------------- |
| `originLat` | Float        | Có       | Vĩ độ điểm đi    |
| `originLng` | Float        | Có       | Kinh độ điểm đi  |
| `destLat`   | Float        | Có       | Vĩ độ điểm đến   |
| `destLng`   | Float        | Có       | Kinh độ điểm đến |

#### Phản hồi thành công (HTTP Status 200)

```json
{
  "success": true,
  "data": [
    {
      "routeName": "Tuyến đường 1",
      "duration": "12 phút",
      "totalDistance": "3.8 km",
      "segments": [
        {
          "status": "Xanh",
          "coordinates": [
            { "latitude": 20.994, "longitude": 105.807 },
            { "latitude": 21.001, "longitude": 105.812 }
          ]
        }
      ]
    }
  ]
}
```
