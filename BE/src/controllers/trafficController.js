// src/controllers/trafficController.js
const trafficService = require('../services/trafficService');

// Thay đổi dòng định nghĩa hàm cũ thành có chữ async
const getRouteSuggestions = async (req, res) => { 
  try {
    const { originLat, originLng, destLat, destLng } = req.query;

    if (!originLat || !originLng || !destLat || !destLng) {
      return res.status(400).json({ success: false, error: "Thiếu tọa độ!" });
    }

    const oLat = Number.parseFloat(originLat);
    const oLng = Number.parseFloat(originLng);
    const dLat = Number.parseFloat(destLat);
    const dLng = Number.parseFloat(destLng);

    if (!Number.isFinite(oLat) || !Number.isFinite(oLng) || !Number.isFinite(dLat) || !Number.isFinite(dLng)) {
      return res.status(400).json({ success: false, error: "Tọa độ không hợp lệ!" });
    }

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