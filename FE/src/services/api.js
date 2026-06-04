export async function getRouteSuggestions(origin, destination) {
    if (!origin || !destination) return []
    const params = new URLSearchParams({ oLat: origin.lat, oLng: origin.lng, dLat: destination.lat, dLng: destination.lng })
    const BASE_URL = 'https://smart-traffic-athc.onrender.com';
    const url = `${BASE_URL}/api/traffic/route-suggestions?${params.toString()}`
    const res = await fetch(url)
    if (!res.ok) throw new Error('API error')
    return await res.json()
}
