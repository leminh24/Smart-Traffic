Dưới đây là file **`README.md`** hoàn chỉnh cho dự án **Smart Traffic**, được thiết kế cấu trúc, văn phong, định dạng markdown và các cụm icon emoji tham chiếu chính xác từ tài liệu mẫu của bạn.

---

# Hệ thống gợi ý tuyến đường thông minh (Smart Traffic System) 🚦

Ứng dụng WebGIS hỗ trợ tự động định vị vị trí người dùng, tìm kiếm lộ trình tối ưu và trực quan hóa trạng thái mật độ giao thông (Xanh, Cam, Đỏ) theo thời gian thực tại khu vực Hà Nội.

---

## 📂 Danh mục tài liệu đi kèm (Project Structure)

Theo cấu trúc chuẩn hóa được quy định từ ngày đầu, các tài liệu kỹ thuật cốt lõi được đặt trong thư mục `docs/`:

1. 📄 **[Specification (`docs/SPEC.md`)]**: Đặc tả chi tiết tính năng, đối tượng người dùng, các ràng buộc dữ liệu đầu cuối và bộ thông số API Contract.
2. 📐 **[Architecture Decisions (`docs/ARCHITECTURE.md`)]**: Làm rõ kiến trúc phân lớp Express MVC của Backend, mô hình Monorepo kết hợp, và chi tiết giải thuật băm nhỏ dữ liệu tọa độ hình học (Chunking Algorithm) để phân đoạn dải màu trên Leaflet.
3. 📝 **[Changelog (`docs/CHANGELOG.md`)]**: Nhật ký ghi nhận lịch sử cập nhật cấu hình, vá lỗi build trên Render và tối ưu hóa hệ thống theo thời gian thực.

---

## 🚀 Tính năng nổi bật (Key Features)

- **Định vị tự động & Fallback thông minh (Automatic Geolocation & Fallback)**: Tự động dò tìm tọa độ thực của thiết bị qua Geolocation API của trình duyệt. Tự động chuyển vùng về trung tâm Hà Nội nếu người dùng từ chối cấp quyền định vị.
- **Tìm kiếm lộ trình kép (Dual-Route Suggestion)**: Tích hợp máy chủ định tuyến dữ liệu đường bộ OSRM để tính toán và hiển thị đồng thời hai phương án di chuyển tối ưu nhất cho người dùng.
- **Phân đoạn dải màu giao thông trực quan (Dynamic Traffic Color Segmenting)**: Tự động xử lý chuỗi tọa độ thô từ mạng lưới hình học bản đồ, băm tách thành các phân đoạn uốn lượn liên tục và gán 3 trạng thái màu sắc giao thông hiển thị trực quan:
- 🟢 **Xanh**: Giao thông thông thoáng.
- 🟡 **Cam**: Mật độ phương tiện vừa phải, di chuyển chậm.
- 🔴 **Đỏ**: Ùn tắc nghiêm trọng.

- **Sidebar tương tác đồng bộ UI (Interactive Route Sidebar UX)**: Hiển thị danh sách thẻ tuyến đường (Route Cards) kèm theo thông tin chi tiết về thời gian dự kiến (`⏱️ duration`) và chiều dài quãng đường. Cho phép click chọn thẻ để highlight dải màu tuyến đường tương ứng trên bản đồ.

---

## 🛠️ Hướng dẫn Khởi chạy & Phát triển (Setup & Running)

### Khởi chạy môi trường phát triển cục bộ (Local Development)

Dự án tổ chức cấu trúc Monorepo phân tách, để chạy local bạn cần khởi chạy cả hai phân hệ:

#### 1. Khởi chạy Server API (Backend)

```bash
# Di chuyển vào thư mục Backend
cd BE

# Cài đặt các gói phụ thuộc (Express, Cors, v.v.)
npm install

# Khởi chạy server Express chính
npm start

```

Server Backend sẽ chạy cố định tại cổng: `http://localhost:5000`

#### 2. Khởi chạy Client WebGIS (Frontend)

```bash
# Mở một terminal mới, di chuyển vào thư mục Frontend
cd FE

# Cài đặt server HTTP tĩnh local
npm install

# Khởi chạy server phát triển giao diện
npm run dev

```

Ứng dụng giao diện bản đồ sẽ khả dụng tại: `http://localhost:3000`
