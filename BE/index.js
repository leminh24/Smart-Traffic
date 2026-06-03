// BE/index.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Nhập dữ liệu giả lập từ file riêng
const trafficData = require('./mockData');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// API trả về dữ liệu giao thông cho Frontend
app.get('/api/traffic', (req, res) => {
    // Trả về file dữ liệu đã tách riêng
    res.json(trafficData);
});

app.listen(PORT, () => {
    console.log(`Server đang chạy tại cổng: ${PORT}`);
});