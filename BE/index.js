// index.js
const express = require('express');
const cors = require('cors');
const env = require('./src/config/environment');
const trafficRoutes = require('./src/routes/trafficRoutes');

const app = express();

// Khởi tạo Middleware
app.use(cors());
app.use(express.json());

// Điều hướng các request bắt đầu bằng /api/traffic sang file trafficRoutes quản lý
app.use('/api/traffic', trafficRoutes);

// Khởi động cổng nghe
app.listen(env.PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 Server đang vận hành mượt mà chuẩn cấu trúc MVC`);
  console.log(`🔗 Link chạy thử: http://localhost:${env.PORT}/api/traffic/route-suggestions?originLat=20.994&originLng=105.807&destLat=21.028&destLng=105.854`);
  console.log(`==================================================`);
});