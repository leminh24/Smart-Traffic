// src/routes/trafficRoutes.js
const express = require('express');
const router = express.Router();
const trafficController = require('../controllers/trafficController');

// Khai báo đường dẫn API tìm đường linh hoạt
router.get('/route-suggestions', trafficController.getRouteSuggestions);

module.exports = router;