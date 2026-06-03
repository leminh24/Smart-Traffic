// BE/mockData.js

const trafficMockData = [
    {
        id: 1,
        roadName: "Đường Nguyễn Trãi",
        status: "Đỏ", // Tắc nghiêm trọng
        currentSpeed: "12 km/h",
        coordinates: [
            { latitude: 20.994, longitude: 105.807 },
            { latitude: 20.998, longitude: 105.802 }
        ]
    },
    {
        id: 2,
        roadName: "Đường Trần Phú",
        status: "Xanh", // Thông thoáng
        currentSpeed: "35 km/h",
        coordinates: [
            { latitude: 20.979, longitude: 105.789 },
            { latitude: 20.985, longitude: 105.794 }
        ]
    },
    {
        id: 3,
        roadName: "Đường Khuất Duy Tiến",
        status: "Cam", // Ùn ứ nhẹ
        currentSpeed: "22 km/h",
        coordinates: [
            { latitude: 20.998, longitude: 105.798 },
            { latitude: 21.002, longitude: 105.801 }
        ]
    }
];

// Xuất dữ liệu ra để các file khác có thể import vào dùng
module.exports = trafficMockData;