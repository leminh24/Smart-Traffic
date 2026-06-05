// src/routes/trafficRoutes.js
const express = require('express');
const router = express.Router();
const trafficController = require('../controllers/trafficController');

// Khai báo đường dẫn API tìm đường linh hoạt
router.get(['/suggestions', '/route-suggestions'], trafficController.getRouteSuggestions);

// ── Tính năng Báo cáo sự cố ──────────────────────────────────────────────────
// POST /api/traffic/incidents       — Gửi báo cáo mới (từ nút FAB trên FE)
// GET  /api/traffic/incidents       — Lấy danh sách sự cố (tuỳ chọn: ?lat=&lng=&radius=)
router.post('/incidents', trafficController.reportIncident);
router.get('/incidents', trafficController.getIncidents);
module.exports = router;