import React, { useState, useEffect, useRef } from 'react'
import MapView from './components/MapView'
import SearchBar from './components/SearchBar'
import Sidebar from './components/Sidebar'
import ReportButton from './components/ReportButton'
import { getRouteSuggestions, getIncidents } from './services/api'

export default function App() {
  const [origin, setOrigin]                   = useState({ lat: 20.994, lng: 105.807 })
  const [destination, setDestination]         = useState(null)
  const [routes, setRoutes]                   = useState([])
  const [status, setStatus]                   = useState('Đang tải dữ liệu giao thông...')
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0)
  const [incidents, setIncidents]             = useState([])
  const [nearbyWarning, setNearbyWarning]     = useState(null) // { label, distanceM, type }

  const pollingRef = useRef(null)

  // ── Fetch routes ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (origin && destination) fetchRoutes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, destination])

  async function fetchRoutes() {
    setStatus('Đang tìm tuyến đường...')
    try {
      const res = await getRouteSuggestions(origin, destination)
      if (!res || res.length === 0) {
        setStatus('Không tìm được tuyến đường phù hợp.')
        setRoutes([])
        return
      }
      setRoutes(res)
      setStatus(`Hiển thị ${res.length} tuyến đường.`)
    } catch (err) {
      console.error('Lỗi khi fetch routes', err)
      setStatus('Lỗi khi tìm tuyến đường.')
      setRoutes([])
    }
  }

  // ── Fetch incidents + polling mỗi 15 giây ────────────────────────────────────
  useEffect(() => {
    fetchIncidents()

    // Bắt đầu polling
    pollingRef.current = setInterval(fetchIncidents, 15000)
    return () => clearInterval(pollingRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin])

  async function fetchIncidents() {
    if (!origin) return
    try {
      const res = await getIncidents(origin.lat, origin.lng, 5)
      if (res?.success) {
        setIncidents(res.data)
        checkNearbyWarning(res.data)
      }
    } catch (err) {
      console.error('Lỗi khi fetch incidents', err)
    }
  }

  // ── Tính năng 2: Kiểm tra sự cố trong vòng 500m ──────────────────────────────
  function haversineM(lat1, lng1, lat2, lng2) {
    const R = 6371000
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  function checkNearbyWarning(incidentList) {
    if (!origin || !incidentList || incidentList.length === 0) {
      setNearbyWarning(null)
      return
    }
    // Tìm sự cố gần nhất trong 500m
    const nearby = incidentList
      .map(inc => ({ ...inc, distanceM: Math.round(haversineM(origin.lat, origin.lng, inc.lat, inc.lng)) }))
      .filter(inc => inc.distanceM <= 500)
      .sort((a, b) => a.distanceM - b.distanceM)

    setNearbyWarning(nearby.length > 0 ? nearby[0] : null)
  }

  // Khi origin thay đổi thì re-check warning với incidents hiện tại
  useEffect(() => {
    checkNearbyWarning(incidents)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin])

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
      <MapView
        origin={origin}
        setOrigin={setOrigin}
        destination={destination}
        setDestination={setDestination}
        routes={routes}
        selectedRouteIndex={selectedRouteIndex}
        incidents={incidents}
      />
      <SearchBar
        origin={origin}
        setOrigin={setOrigin}
        destination={destination}
        setDestination={setDestination}
      />
      <Sidebar
        status={status}
        routes={routes}
        selectedRouteIndex={selectedRouteIndex}
        setSelectedRouteIndex={setSelectedRouteIndex}
        nearbyWarning={nearbyWarning}
      />
      <ReportButton origin={origin} onReported={fetchIncidents} />
    </div>
  )
}