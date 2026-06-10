const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export async function getRouteSuggestions(origin, destination, vehicle, preferences = null) {
  if (!origin || !destination) return [];

  const params = new URLSearchParams({
    oLat: origin.lat,
    oLng: origin.lng,
    dLat: destination.lat,
    dLng: destination.lng
  });

  if (vehicle) params.set('vehicle', vehicle);

  // Xử lý avoid parameters
  if (preferences) {
    const avoids = [];
    if (preferences.avoidHighway) {
    avoids.push('motorway', 'trunk', 'primary');       
    }
    if (preferences.avoidToll) avoids.push('toll');
    if (preferences.avoidFerry) avoids.push('ferry');
    if (preferences.avoidUnpaved) avoids.push('unpaved', 'track');
    
    if (avoids.length > 0) {
      params.set('exclude', avoids.join(','));
    }
  }

  const url = `${BASE_URL}/api/traffic/route-suggestions?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('API error');
  return await res.json();
}

// Gửi báo cáo sự cố lên BE
export async function reportIncident({ lat, lng, type }) {
  const res = await fetch(`${BASE_URL}/api/traffic/incidents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lng, type })
  })
  if (!res.ok) throw new Error('API error')
  return res.json()
}

// Lấy danh sách sự cố gần vị trí hiện tại (bán kính km)
export async function getIncidents(lat, lng, radius = 5) {
  const res = await fetch(`${BASE_URL}/api/traffic/incidents?lat=${lat}&lng=${lng}&radius=${radius}`)
  if (!res.ok) throw new Error('API error')
  return res.json()
}
