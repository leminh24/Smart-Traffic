// index.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const env = require('./src/config/environment');
const trafficRoutes = require('./src/routes/trafficRoutes');

const app = express();

// Khởi tạo Middleware
app.use(cors());
app.use(express.json());

// Nếu muốn deploy cùng frontend, backend sẽ phục vụ file tĩnh FE
app.use(express.static(path.join(__dirname, '../FE')));

// Điều hướng các request bắt đầu bằng /api/traffic sang file trafficRoutes quản lý
app.use('/api/traffic', trafficRoutes);

// Trả về trang chính khi truy cập root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../FE/index.html'));
});

// Khởi động cổng nghe
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại cổng ${PORT}`);
});