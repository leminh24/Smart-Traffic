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
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại cổng ${PORT}`);
});