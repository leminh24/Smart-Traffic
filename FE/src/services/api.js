export async function getRouteSuggestions(origin, destination) {
  if (!origin || !destination) return []
  const params = new URLSearchParams({ oLat: origin.lat, oLng: origin.lng, dLat: destination.lat, dLng: destination.lng })
  const base = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000' ? 'http://localhost:5000' : ''
  const url = `${base}/api/traffic/route-suggestions?${params.toString()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('API error')
  return await res.json()
}
