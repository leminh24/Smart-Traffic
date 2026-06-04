// FE/sw.js
self.addEventListener('push', function(event) {
    if (event.data) {
        const data = event.data.json();
        
        const options = {
            body: data.body,
            icon: data.icon || 'https://cdn-icons-png.flaticon.com/512/854/854878.png',
            badge: 'https://cdn-icons-png.flaticon.com/512/854/854878.png',
            vibrate: [200, 100, 200], // Rung điện thoại nếu có hỗ trợ
            data: {
                url: data.data ? data.data.url : '/'
            }
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// Click vào thông báo thì tự mở Tab trang web ra đường link gợi ý tránh tắc
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});