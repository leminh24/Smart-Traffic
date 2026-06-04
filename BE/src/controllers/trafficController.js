// src/controllers/trafficController.js
const trafficService = require('../services/trafficService');

const getRouteSuggestions = async (req, res) => { 
  try {
    // 1. SỬA LỖI 1: Đổi tên biến bóc tách trùng khít với query string FE gửi lên (?oLat=...&oLng=...)
    const { oLat, oLng, dLat, dLng } = req.query;

    // Kiểm tra xem FE có truyền đủ 4 tham số ký hiệu viết tắt này không
    if (!oLat || !oLng || !dLat || !dLng) {
      console.warn("⚠️ [Controller] FE truyền thiếu tham số hoặc sai tên biến:", req.query);
      return res.status(400).json({ success: false, error: "Thiếu tọa độ (Yêu cầu: oLat, oLng, dLat, dLng)!" });
    }

    // Ép kiểu chuỗi sang số thực dạng Float
    const parsedOLat = Number.parseFloat(oLat);
    const parsedOLng = Number.parseFloat(oLng);
    const parsedDLat = Number.parseFloat(dLat);
    const parsedDLng = Number.parseFloat(dLng);

    // Kiểm tra tính hợp lệ của số sau khi ép kiểu
    if (!Number.isFinite(parsedOLat) || !Number.isFinite(parsedOLng) || !Number.isFinite(parsedDLat) || !Number.isFinite(parsedDLng)) {
      return res.status(400).json({ success: false, error: "Tọa độ truyền lên không phải là số hợp lệ!" });
    }

    // Gọi tầng Service xử lý kết nối OSRM và phân đoạn kẹt xe
    const routes = await trafficService.getRouteSuggestions(parsedOLat, parsedOLng, parsedDLat, parsedDLng);

    // 2. SỬA LỖI 2: Trả thẳng mảng `routes` về dạng thô (Raw Array) như FE đang mong đợi
    // Không bọc qua cấu trúc { success: true, data: routes } để tránh làm gãy logic vẽ bản đồ của Leaflet
    return res.status(200).json(routes);

  } catch (error) {
    console.error("❌ Lỗi nghiêm trọng tại Controller:", error);
    return res.status(500).json({ success: false, error: "Lỗi hệ thống Backend!" });
  }
};

module.exports = {
  getRouteSuggestions
};