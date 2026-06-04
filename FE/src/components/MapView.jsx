import React, { useEffect, useRef } from 'react'
import L from 'leaflet'

export default function MapView({ origin, setOrigin, destination, setDestination, routes, selectedRouteIndex }) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const userMarkerRef = useRef(null)
  const destMarkerRef = useRef(null)
  const polylinesRef = useRef([])

  useEffect(() => {
    if (!mapContainerRef.current) return

    mapRef.current = L.map(mapContainerRef.current).setView([origin.lat, origin.lng], 14)
    // Đổi từ link cartocdn sang link này để có đầy đủ màu sắc ngõ ngách:
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapRef.current)

    userMarkerRef.current = L.marker([origin.lat, origin.lng]).addTo(mapRef.current)
    userMarkerRef.current.bindPopup('<b>Vị trí bạn</b>').openPopup()

    mapRef.current.on('click', (e) => {
      const { lat, lng } = e.latlng
      setDestination({ lat, lng })
    })

    return () => {
      if (mapRef.current) mapRef.current.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (userMarkerRef.current && origin && mapRef.current) {
      userMarkerRef.current.setLatLng([origin.lat, origin.lng])
      mapRef.current.setView([origin.lat, origin.lng], 14)
    }
  }, [origin])

  useEffect(() => {
    if (!mapRef.current) return
    if (destination) {
      if (destMarkerRef.current) destMarkerRef.current.setLatLng([destination.lat, destination.lng])
      else destMarkerRef.current = L.marker([destination.lat, destination.lng]).addTo(mapRef.current)
      destMarkerRef.current.bindPopup('<b>Điểm đến đã chọn</b>').openPopup()
      mapRef.current.flyTo([destination.lat, destination.lng], 14)
    }
  }, [destination])

  useEffect(() => {
    if (!mapRef.current) return
    // clear old polylines
    polylinesRef.current.forEach(p => mapRef.current.removeLayer(p))
    polylinesRef.current = []

    if (!routes || routes.length === 0) return

    routes.forEach((route, idx) => {
      route.segments.forEach(seg => {
        const latlngs = seg.coordinates.map(c => [c.latitude, c.longitude])
        const color = seg.status === 'Đỏ' ? '#ef4444' : seg.status === 'Cam' ? '#f59e0b' : '#10b981'
        const isSelected = idx === selectedRouteIndex
        const poly = L.polyline(latlngs, { color, weight: isSelected ? 6 : 3, opacity: isSelected ? 1 : 0.5 }).addTo(mapRef.current)
        polylinesRef.current.push(poly)
      })
    })
  }, [routes, selectedRouteIndex])

  return (
    <div ref={mapContainerRef} style={{ width: '100%', height: '100vh', position: 'absolute', top: 0, left: 0 }}></div>
  )
}
