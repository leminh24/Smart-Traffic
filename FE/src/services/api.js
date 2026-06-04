export async function getRouteSuggestions(origin, destination) {
  if (!origin || !destination) return []
  const params = new URLSearchParams({ oLat: origin.lat, oLng: origin.lng, dLat: destination.lat, dLng: destination.lng })
  
  // Dùng biến môi trường VITE_API_URL, nếu không có thì mặc định là localhost
  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  
  const url = `${BASE_URL}/api/traffic/route-suggestions?${params.toString()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('API error')
  return await res.json()
}