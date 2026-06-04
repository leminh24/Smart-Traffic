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

## [Chính thức] - 2026-06-04

### Added

- Khởi tạo bộ tài liệu kỹ thuật tiêu chuẩn cho dự án bao gồm: Đặc tả yêu cầu (`SPEC.md`), Quyết định kiến trúc (`ARCHITECTURE.md`), Hướng dẫn vận hành (`README.md`) và Nhật ký thay đổi (`CHANGELOG.md`).
- Thêm file `index.html` điều hướng (Meta Refresh Redirect) tại thư mục gốc của Repository. File này tự động chuyển hướng trình duyệt vào `FE/index.html` sau 0 giây để giữ nguyên cấu trúc thư mục `FE` mà không bị lỗi 404 Pages.

---
