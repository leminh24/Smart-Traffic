export async function getRouteSuggestions(origin, destination) {
  if (!origin || !destination) return [];

  // 1. Chỉnh sửa tên tham số khớp với SPEC.md
  const params = new URLSearchParams({
    originLat: origin.lat,
    originLng: origin.lng,
    destLat: destination.lat,
    destLng: destination.lng
  });

  // 2. Cấu hình địa chỉ Backend linh hoạt
  // Nếu ở local thì dùng localhost:5000, nếu ở GitHub Pages thì gọi sang Render
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const baseUrl = isLocal ? 'http://localhost:5000' : 'https://smart-traffic-athc.onrender.com';

  const url = `${baseUrl}/api/traffic/route-suggestions?${params.toString()}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('API error');
    
    const result = await res.json();
    // Giả định Backend trả về cấu trúc có trường 'data' theo SPEC.md
    return result.data || []; 
  } catch (err) {
    console.error("Lỗi khi fetch từ server:", err);
    return [];
  }
}