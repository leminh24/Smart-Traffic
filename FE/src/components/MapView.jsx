import React, { useEffect, useRef } from 'react'
import L from 'leaflet'

export default function MapView({ origin, setOrigin, destination, setDestination, routes, selectedRouteIndex, incidents }) {
  const mapContainerRef    = useRef(null)
  const mapRef             = useRef(null)
  const userMarkerRef      = useRef(null)
  const destMarkerRef      = useRef(null)
  const polylinesRef       = useRef([])
  const incidentMarkersRef = useRef([])
  const incidentZonesRef   = useRef([])

  // ── Khởi tạo map ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current) return

    // Tắt zoomControl mặc định để tự thêm lại ở góc phải (tránh bị thanh tìm kiếm đè lên trên mobile)
    mapRef.current = L.map(mapContainerRef.current, { zoomControl: false }).setView([origin.lat, origin.lng], 14)
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapRef.current)

    // Thêm nút zoom ở góc trên bên phải
    L.control.zoom({ position: 'topright' }).addTo(mapRef.current)

    userMarkerRef.current = L.marker([origin.lat, origin.lng]).addTo(mapRef.current)
    userMarkerRef.current.bindPopup('<b>Vị trí bạn</b>').openPopup()

    mapRef.current.on('click', (e) => {
      const { lat, lng } = e.latlng
      setDestination({ lat, lng })
    })

    return () => { if (mapRef.current) mapRef.current.remove() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Cập nhật vị trí user ──────────────────────────────────────────────────────
  useEffect(() => {
    if (userMarkerRef.current && origin && mapRef.current) {
      userMarkerRef.current.setLatLng([origin.lat, origin.lng])
      mapRef.current.setView([origin.lat, origin.lng], 14)
    }
  }, [origin])

  // ── Cập nhật điểm đến ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return
    if (destination) {
      if (destMarkerRef.current) destMarkerRef.current.setLatLng([destination.lat, destination.lng])
      else destMarkerRef.current = L.marker([destination.lat, destination.lng]).addTo(mapRef.current)
      destMarkerRef.current.bindPopup('<b>Điểm đến đã chọn</b>').openPopup()
      mapRef.current.flyTo([destination.lat, destination.lng], 14)
    }
  }, [destination])

  // ── Vẽ polyline tuyến đường ───────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return
    polylinesRef.current.forEach(p => mapRef.current.removeLayer(p))
    polylinesRef.current = []
    if (!routes || routes.length === 0) return

    routes.forEach((route, idx) => {
      route.segments.forEach(seg => {
        const latlngs = seg.coordinates.map(c => [c.latitude, c.longitude])
        const color = seg.status === 'Đỏ' ? '#ef4444' : seg.status === 'Cam' ? '#f59e0b' : '#10b981'
        const isSelected = idx === selectedRouteIndex
        const poly = L.polyline(latlngs, {
          color,
          weight:  isSelected ? 6 : 3,
          opacity: isSelected ? 1 : 0.5
        }).addTo(mapRef.current)
        polylinesRef.current.push(poly)
      })
    })
  }, [routes, selectedRouteIndex])

  // ── Vẽ marker + vùng đỏ cho từng sự cố ──────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return

    incidentMarkersRef.current.forEach(m => mapRef.current.removeLayer(m))
    incidentMarkersRef.current = []
    incidentZonesRef.current.forEach(z => mapRef.current.removeLayer(z))
    incidentZonesRef.current = []

    if (!incidents || incidents.length === 0) return

    const ICONS  = { TAC_DUONG: '🚗', TAI_NAN: '🚨', NGAP_LUT: '🌊' }
    const COLORS = { TAC_DUONG: '#ef4444', TAI_NAN: '#f59e0b', NGAP_LUT: '#3b82f6' }

    incidents.forEach(inc => {
      const remainMs  = new Date(inc.expiresAt).getTime() - Date.now()
      const remainMin = Math.max(0, Math.round(remainMs / 60000))
      const color     = COLORS[inc.type] || '#ef4444'

      const zone = L.circle([inc.lat, inc.lng], {
        radius:      200,
        color:       color,
        fillColor:   color,
        fillOpacity: 0.18,
        weight:      2,
        dashArray:   '6 4'
      }).addTo(mapRef.current)
      incidentZonesRef.current.push(zone)

      const icon = L.divIcon({
        html: `<div style="
          font-size:22px;
          line-height:1;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
        ">${ICONS[inc.type] || '⚠️'}</div>`,
        className: '',
        iconSize:   [28, 28],
        iconAnchor: [14, 14]
      })

      const marker = L.marker([inc.lat, inc.lng], { icon })
        .addTo(mapRef.current)
        .bindPopup(`
          <div style="min-width:160px">
            <b style="font-size:14px">${ICONS[inc.type]} ${inc.label}</b><br/>
            <span style="font-size:12px;color:#555">
              Báo lúc: ${new Date(inc.createdAt).toLocaleTimeString('vi-VN')}<br/>
              Còn hiệu lực: <b style="color:#ef4444">${remainMin} phút</b>
            </span>
          </div>
        `)
      incidentMarkersRef.current.push(marker)
    })
  }, [incidents])

  return (
    <div
      ref={mapContainerRef}
      style={{ width: '100%', height: '100vh', position: 'absolute', top: 0, left: 0 }}
    />
  )
}