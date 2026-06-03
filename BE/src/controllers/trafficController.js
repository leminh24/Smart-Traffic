// src/controllers/trafficController.js
const trafficService = require('../services/trafficService');

// Thay đổi dòng định nghĩa hàm cũ thành có chữ async
const getRouteSuggestions = async (req, res) => { 
  try {
    const { originLat, originLng, destLat, destLng } = req.query;

    if (!originLat || !originLng || !destLat || !destLng) {
      return res.status(400).json({ success: false, error: "Thiếu tọa độ!" });
    }

    const oLat = parseFloat(originLat);
    const oLng = parseFloat(originLng);
    const dLat = parseFloat(destLat);
    const dLng = parseFloat(destLng);

    // 🔥 THÊM TỪ KHÓA await Ở ĐÂY để đợi lấy đường thực tế
    const routes = await trafficService.getRouteSuggestions(oLat, oLng, dLat, dLng);

    return res.status(200).json({
      success: true,
      data: routes
    });

  } catch (error) {
    console.error("Lỗi:", error);
    return res.status(500).json({ success: false, error: "Lỗi hệ thống!" });
  }
};

module.exports = {
  getRouteSuggestions
};