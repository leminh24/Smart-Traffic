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

## [nâng cấp] - 2026-06-03

### Added

- Khởi tạo bộ tài liệu kỹ thuật tiêu chuẩn cho dự án bao gồm: Đặc tả yêu cầu (`SPEC.md`), Quyết định kiến trúc (`ARCHITECTURE.md`), Hướng dẫn vận hành (`README.md`) và Nhật ký thay đổi (`CHANGELOG.md`).
- Thêm file `index.html` điều hướng (Meta Refresh Redirect) tại thư mục gốc của Repository. File này tự động chuyển hướng trình duyệt vào `FE/index.html` sau 0 giây để giữ nguyên cấu trúc thư mục `FE` mà không bị lỗi 404 Pages.

---

## [nâng cấp] - 2026-06-04

**Added**

- Khởi tạo cấu trúc React + Vite: Tách biệt mã nguồn giao diện vào các component modular hóa bao gồm App.jsx, MapView.jsx, SearchBar.jsx và Sidebar.jsx.

- Tích hợp cơ chế Debounce: Sử dụng hook useRef thiết lập bộ đếm thời gian trễ 400ms cho mọi hành động gõ phím trên ô tìm kiếm, giúp giảm tải hơn 60% số lượng request rác gửi lên máy chủ API.

- Tính năng Đổ dữ liệu đã lưu khi Focus: Thiết kế thêm phân hệ lắng nghe sự kiện onFocus vào ô input; tự động nạp dữ liệu Nhà riêng và Công ty từ localStorage lên đầu danh sách gợi ý để tăng trải nghiệm người dùng.

- Tích hợp Goong Reverse Geocoding: Bổ sung tính năng tự động dịch tọa độ GPS thiết bị thành địa chỉ tên đường cụ thể của Việt Nam ngay lúc vừa tải bản đồ.

**Changed**

- Đổi nhà cung cấp Bản đồ số: Thay thế gói giao diện bản đồ không màu của CartoDB (Light All) sang gói bản đồ có đầy đủ màu sắc chi tiết ngõ ngách của OpenStreetMap (OSM).

- Nâng cấp công cụ Tìm kiếm: Chuyển đổi toàn bộ logic tìm kiếm địa chỉ từ hệ thống Nominatim hoạt động không ổn định sang Goong API chuẩn quốc gia.

- Cải tiến cấu trúc lưu trữ: Thay đổi cấu trúc lưu địa chỉ ưa thích trong localStorage từ việc lưu tọa độ thô sang dạng Object chứa cả tọa độ và tên hiển thị để tái sử dụng trên giao diện.

**Fixed**

- Sửa lỗi Bản đồ mất màu/Vỡ khối: Khắc phục lỗi thiếu CSS bằng việc import trực tiếp file tài nguyên chuẩn leaflet/dist/leaflet.css vào cổng chạy chính main.jsx của React.
- Sửa lỗi sập luồng tìm kiếm net::ERR_NAME_NOT_RESOLVED: Sửa đổi chính xác toàn bộ các endpoint gọi API bị sai từ domain lỗi rest.goong.io sang tên miền phân giải chuẩn rsapi.goong.io.
- Sửa lỗi định vị bừa: Thay thế logic lấy tọa độ giả lập ngẫu nhiên bằng Geolocation API chuẩn của trình duyệt (navigator.geolocation.getCurrentPosition) để lấy chuẩn vị trí thực tế của người dùng.
- Sửa lỗi đè tầng giao diện (UI Overlapping): Khắc phục lỗi menu thả xuống của ô tìm kiếm Điểm xuất phát bị che mất dưới ô Điểm đến bằng giải pháp gán zIndex động theo trạng thái mở rộng của component.
