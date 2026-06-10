import React, { useState, useEffect, useRef } from 'react'
import MapView from './components/MapView'
import SearchBar from './components/SearchBar'
import Sidebar from './components/Sidebar'
import ReportButton from './components/ReportButton'
import { getRouteSuggestions, getIncidents } from './services/api'
import { VEHICLES } from './components/VehicleSelector'
import RoutePreferences from './components/RoutePreferences';

const VEHICLE_ROUTE_META = {
  walk: { label: 'Đi bộ', osrmProfile: 'foot' },
  bike: { label: 'Xe máy', osrmProfile: 'bike' },
  car:  { label: 'Ô tô', osrmProfile: 'driving' },
}

export default function App() {
  const [origin, setOrigin]                   = useState({ lat: 20.994, lng: 105.807 })
  const [destination, setDestination]         = useState(null)
  const [routes, setRoutes]                   = useState([])
  const [status, setStatus]                   = useState('Đang tải dữ liệu giao thông...')
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [incidents, setIncidents]             = useState([])
  const [nearbyWarning, setNearbyWarning]     = useState(null) // { label, distanceM, type }
  const [routePreferences, setRoutePreferences] = useState(() => {
    const saved = localStorage.getItem('routePreferences');
    return saved ? JSON.parse(saved) : {
      avoidHighway: false, avoidToll: false, avoidFerry: true, avoidUnpaved: false
    };
  });

  const pollingRef = useRef(null)
  const destinationResetRef = useRef(null)

  // ── Fetch routes ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (origin && destination) fetchRoutes()
    else setRoutes([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, destination, selectedVehicle, routePreferences])

  useEffect(() => {
    localStorage.removeItem('selectedVehicle')
  }, [])

  useEffect(() => {
    if (!destination) {
      destinationResetRef.current = null
      setSelectedVehicle(null)
      setSelectedRouteIndex(0)
      localStorage.removeItem('selectedVehicle')
      return
    }

    const destinationKey = `${destination.lat.toFixed(6)},${destination.lng.toFixed(6)}`
    if (destinationResetRef.current === destinationKey) return

    destinationResetRef.current = destinationKey
    setSelectedVehicle(null)
    setSelectedRouteIndex(0)
    localStorage.removeItem('selectedVehicle')
  }, [destination])

  async function fetchRoutes() {
    setStatus('Đang tìm tuyến đường...')
    try {
      const res = selectedVehicle
        ? await getRoutesForVehicle(selectedVehicle)
        : await getShortestRoutesForAllVehicles()
      if (!res || res.length === 0) {
        setStatus('Không tìm được tuyến đường phù hợp.')
        setRoutes([])
        return
      }
      setRoutes(res)
      setSelectedRouteIndex(0)
      setStatus(`Hiển thị ${res.length} tuyến đường.`)
    } catch (err) {
      console.error('Lỗi khi fetch routes', err)
      setStatus('Lỗi khi tìm tuyến đường.')
      setRoutes([])
    }
  }

  // ── Fetch incidents + polling mỗi 15 giây ────────────────────────────────────
    async function getRoutesForVehicle(vehicleId) {
    const vehicle = VEHICLE_ROUTE_META[vehicleId]
    const res = await getRouteSuggestions(
      origin, 
      destination, 
      vehicle?.osrmProfile,
      routePreferences   // ← THÊM preferences
    )
    return decorateRoutes(res.slice(0, 2), vehicleId, false)
  }

  async function getShortestRoutesForAllVehicles() {
    const results = await Promise.all(VEHICLES.map(async (vehicle) => {
      const res = await getRouteSuggestions(
        origin, 
        destination, 
        vehicle.osrmProfile,
        routePreferences     // ← THÊM preferences
      )
      const shortestRoute = pickShortestRoute(res)
      return shortestRoute ? decorateRoutes([shortestRoute], vehicle.id, true) : []
    }))
    return results.flat()
  }
  function pickShortestRoute(routeList) {
    return [...routeList].sort((a, b) => parseDistanceKm(a.totalDistance) - parseDistanceKm(b.totalDistance))[0]
  }

  function parseDistanceKm(distance) {
    const value = Number.parseFloat(String(distance).replace(',', '.'))
    return Number.isFinite(value) ? value : Number.POSITIVE_INFINITY
  }

  function decorateRoutes(routeList, vehicleId, shortestOnly) {
    const meta = VEHICLE_ROUTE_META[vehicleId]
    return routeList.map((route, index) => ({
      ...route,
      id: `${vehicleId}_${route.id || index}`,
      vehicleId,
      routeName: shortestOnly
        ? `${meta?.label || 'Phương tiện'}: Tuyến ngắn nhất`
        : `${meta?.label || 'Phương tiện'} - ${route.routeName}`,
    }))
  }

  function handleVehicleChange(vehicleId) {
    setSelectedVehicle(vehicleId)
    setSelectedRouteIndex(0)
  }

  function handleDestinationChange(nextDestination) {
    setSelectedVehicle(null)
    setSelectedRouteIndex(0)
    localStorage.removeItem('selectedVehicle')
    setDestination(nextDestination)
  }

  function handlePreferencesChange(newPrefs) {
    setRoutePreferences(newPrefs);
  }

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
        setDestination={handleDestinationChange}
        routes={routes}
        selectedRouteIndex={selectedRouteIndex}
        incidents={incidents}
      />
      <SearchBar
        origin={origin}
        setOrigin={setOrigin}
        destination={destination}
        setDestination={handleDestinationChange}
      />
      <Sidebar
        status={status}
        routes={routes}
        selectedRouteIndex={selectedRouteIndex}
        setSelectedRouteIndex={setSelectedRouteIndex}
        nearbyWarning={nearbyWarning}
        startCoords={origin}
        endCoords={destination}
        selectedVehicle={selectedVehicle}
        onVehicleChange={handleVehicleChange}
        routePreferences={routePreferences}
        onPreferencesChange={handlePreferencesChange}
      />
      <ReportButton origin={origin} onReported={fetchIncidents} />
    </div>
  )
}
