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

// ── Bán kính cảnh báo sự cố (km) ─────────────────────────────────────────────
const ALERT_RADIUS_KM = 3;

/**
 * Tính khoảng cách Haversine (km) — dùng nội bộ để lọc user lân cận
 */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const INCIDENT_EMOJI = { TAC_DUONG: '🚗', TAI_NAN: '🚨', NGAP_LUT: '🌊' };
const INCIDENT_LABEL = { TAC_DUONG: 'Tắc đường', TAI_NAN: 'Tai nạn', NGAP_LUT: 'Ngập lụt' };

/**
 * Gửi push notification đến tất cả user có tuyến đường đi qua khu vực sự cố
 * @param {object} incident — object từ trafficService.saveIncident()
 */
async function broadcastIncidentToNearbyUsers(incident) {
  const nearbyUsers = userProfilesDb.filter(user => {
    if (!user.pushSubscription) return false;
    // Kiểm tra xem điểm đi HOẶC điểm đến của user có gần sự cố không
    const nearHome = haversineKm(incident.lat, incident.lng, user.homeLocation.lat, user.homeLocation.lng) <= ALERT_RADIUS_KM;
    const nearWork = haversineKm(incident.lat, incident.lng, user.workLocation.lat, user.workLocation.lng) <= ALERT_RADIUS_KM;
    return nearHome || nearWork;
  });

  if (nearbyUsers.length === 0) {
    console.log(`📭 [Broadcast] Không có user nào trong bán kính ${ALERT_RADIUS_KM}km.`);
    return;
  }

  const emoji = INCIDENT_EMOJI[incident.type] || '⚠️';
  const label = INCIDENT_LABEL[incident.type] || incident.type;
  const title = `${emoji} Cảnh báo giao thông`;
  const body  = `${label} được ghi nhận gần tuyến đường của bạn!`;

  console.log(`📢 [Broadcast] Gửi thông báo "${label}" đến ${nearbyUsers.length} user lân cận...`);

  await Promise.allSettled(
    nearbyUsers.map(user =>
      sendPushNotification(user.pushSubscription, title, body, '/')
        .then(() => console.log(`  ✅ Đã gửi → ${user.username}`))
        .catch(err => console.error(`  ❌ Lỗi gửi → ${user.username}: ${err.message}`))
    )
  );
}

module.exports = {
    publicKey: vapidKeys.publicKey,
    userProfilesDb,
    sendPushNotification,
    broadcastIncidentToNearbyUsers
};