// src/services/notificationService.js
const webpush = require('web-push');

// Trong thực tế, bạn nên lưu cặp khóa này vào file .env
// Dưới đây là hàm khởi tạo tự sinh khóa mẫu để chạy được ngay
const vapidKeys = webpush.generateVAPIDKeys();

webpush.setVapidDetails(
  'mailto:your-email@houconnect.edu.vn',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Mảng mô phỏng Cơ sở dữ liệu lưu cấu hình cấu hình User (Cơ chế InMemory)
// Thực tế bạn sẽ lưu mảng này vào MongoDB hoặc MySQL
const userProfilesDb = [
  {
    userId: "user_01",
    username: "Nguyễn Văn A",
    // Tọa độ Nhà (Điểm đi) và Công ty (Điểm đến)
    homeLocation: { lat: 20.994, lng: 105.807 }, 
    workLocation: { lat: 21.028, lng: 105.852 },
    commuteTime: "08:00", // Giờ vào làm cố định (Định dạng HH:mm)
    pushSubscription: null // Nơi lưu Token trình duyệt của User để bắn thông báo
  }
];

/**
 * Hàm gửi thông báo đẩy tới thiết bị người dùng
 */
async function sendPushNotification(subscription, title, body, url = '/') {
    if (!subscription) return;
    
    const payload = JSON.stringify({
        title: title,
        body: body,
        icon: '/assets/traffic-icon.png', // Đường dẫn ảnh icon tùy chọn
        data: { url: url }
    });

    try {
        await webpush.sendNotification(subscription, payload);
        console.log(`🔔 [Push Notification] Đã bắn thông báo thành công!`);
    } catch (error) {
        console.error("❌ Lỗi bắn thông báo đẩy:", error.message);
    }
}

module.exports = {
    publicKey: vapidKeys.publicKey,
    userProfilesDb,
    sendPushNotification
};