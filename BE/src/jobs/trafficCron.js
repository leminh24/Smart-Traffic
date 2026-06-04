// src/jobs/trafficCron.js
const cron = require('node-cron');
const { userProfilesDb, sendPushNotification } = require('../services/notificationService');
const trafficService = require('../services/trafficService');

function initTrafficCronJob() {
    console.log("🤖 [Cron Job] Hệ thống Bot rà soát lộ trình tự động đã kích hoạt.");

    // Cấu hình chạy đều đặn mỗi phút một lần (* * * * *)
    cron.schedule('* * * * *', async () => {
        const now = new Date();
        
        // Lấy giờ và phút hiện tại (Đảm bảo đúng múi giờ VN)
        const currentHours = String(now.getHours()).padStart(2, '0');
        const currentMinutes = String(now.getMinutes()).padStart(2, '0');

        // Tính toán mốc thời gian "Sau đây 15 phút" sẽ là mấy giờ
        const targetTime = new Date(now.getTime() + 15 * 60 * 1000);
        const targetHours = String(targetTime.getHours()).padStart(2, '0');
        const targetMinutes = String(targetTime.getMinutes()).padStart(2, '0');
        const commuteCheckTime = `${targetHours}:${targetMinutes}`;

        // Lọc tìm những User có giờ đi làm khớp với thời gian cần check
        const usersToNotify = userProfilesDb.filter(user => user.commuteTime === commuteCheckTime);

        if (usersToNotify.length === 0) return;

        console.log(`🕒 [Cron Check] Tìm thấy ${usersToNotify.length} người sắp đi làm vào lúc ${commuteCheckTime}. Tiến hành check kẹt xe...`);

        for (const user of usersToNotify) {
            if (!user.pushSubscription) {
                console.warn(`⚠️ User ${user.username} chưa đăng ký nhận Push Notification trên trình duyệt.`);
                continue;
            }

            // Gọi thuật toán dịch vụ đường đi thực tế từ Nhà -> Công ty
            const routes = await trafficService.getRouteSuggestions(
                user.homeLocation.lat, user.homeLocation.lng,
                user.workLocation.lat, user.workLocation.lng
            );

            if (!routes || routes.length === 0) continue;

            const primaryRoute = routes[0]; // Tuyến mặc định quen thuộc
            
            // Kiểm tra xem tuyến chính có dính đoạn kẹt xe nào không
            const hasCongestion = primaryRoute.segments.some(seg => seg.status === "Đỏ" || seg.status === "Cam");

            if (hasCongestion) {
                let alertTitle = `🚨 Cảnh báo kẹt xe trục đường đi làm!`;
                let alertBody = `Tuyến đường quen thuộc tới công ty đang ùn tắc. Dự kiến tốn ${primaryRoute.duration}.`;

                // Nếu có Tuyến đường 2 (Đường tránh) tối ưu hơn, gợi ý luôn cho User
                const alternativeRoute = routes.find(r => r.id === "route_alternative");
                if (alternativeRoute && alternativeRoute.timeSaved >= 3) {
                    alertBody += ` Gợi ý: Hãy rẽ sang ${alternativeRoute.routeName}!`;
                } else {
                    alertBody += ` Bạn nên chủ động khởi hành sớm hơn để kịp giờ làm.`;
                }

                // Thực hiện bắn thông báo trực tiếp ra màn hình thiết bị
                await sendPushNotification(user.pushSubscription, alertTitle, alertBody);
            } else {
                console.log(`✅ Lộ trình của ${user.username} thông thoáng, không cần gửi cảnh báo.`);
            }
        }
    });
}

module.exports = { initTrafficCronJob };