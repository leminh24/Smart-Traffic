// src/controllers/trafficController.js
const trafficService = require('../services/trafficService');
const notificationService = require('../services/notificationService');

const getRouteSuggestions = async (req, res) => { 
  try {
    // 1. SỬA LỖI 1: Đổi tên biến bóc tách trùng khít với query string FE gửi lên (?oLat=...&oLng=...)
    const { oLat, oLng, dLat, dLng, vehicle = 'foot' } = req.query;

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
    const routes = await trafficService.getRouteSuggestions(parsedOLat, parsedOLng, parsedDLat, parsedDLng, vehicle);

    // 2. SỬA LỖI 2: Trả thẳng mảng `routes` về dạng thô (Raw Array) như FE đang mong đợi
    // Không bọc qua cấu trúc { success: true, data: routes } để tránh làm gãy logic vẽ bản đồ của Leaflet
    return res.status(200).json(routes);

  } catch (error) {
    console.error("❌ Lỗi nghiêm trọng tại Controller:", error);
    return res.status(500).json({ success: false, error: "Lỗi hệ thống Backend!" });
  }
};

const reportIncident = async (req, res) => {
  try {
    const { lat, lng, type } = req.body;

    // Kiểm tra đủ thông tin bắt buộc
    const validTypes = ['TAC_DUONG', 'TAI_NAN', 'NGAP_LUT'];
    if (!lat || !lng || !type) {
      return res.status(400).json({ success: false, error: 'Thiếu thông tin: lat, lng, type là bắt buộc!' });
    }
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, error: `Loại sự cố không hợp lệ. Chọn một trong: ${validTypes.join(', ')}` });
    }

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    if (!isFinite(parsedLat) || !isFinite(parsedLng)) {
      return res.status(400).json({ success: false, error: 'Tọa độ không hợp lệ!' });
    }

    // Lưu báo cáo qua Service
    const incident = await trafficService.saveIncident({ lat: parsedLat, lng: parsedLng, type });

    // Broadcast thông báo đến các user lân cận (không block response)
    notificationService.broadcastIncidentToNearbyUsers(incident).catch(err =>
      console.error('⚠️ [Notification] Lỗi broadcast:', err.message)
    );

    console.log(`✅ [Incident] Đã lưu báo cáo: ${type} tại (${parsedLat}, ${parsedLng})`);
    return res.status(201).json({ success: true, data: incident });

  } catch (error) {
    console.error('❌ Lỗi tại reportIncident Controller:', error);
    return res.status(500).json({ success: false, error: 'Lỗi hệ thống Backend!' });
  }
};

const getIncidents = async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query;

    // Nếu có tọa độ thì lọc theo bán kính (km), không có thì trả tất cả
    const incidents = lat && lng
      ? await trafficService.getIncidentsNearby(parseFloat(lat), parseFloat(lng), parseFloat(radius))
      : await trafficService.getAllIncidents();

    return res.status(200).json({ success: true, data: incidents });
  } catch (error) {
    console.error('❌ Lỗi tại getIncidents Controller:', error);
    return res.status(500).json({ success: false, error: 'Lỗi hệ thống Backend!' });
  }
};

module.exports = {
  getRouteSuggestions,
  reportIncident,
  getIncidents
};