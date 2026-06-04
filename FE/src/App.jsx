import React, { useState, useEffect } from 'react'
import MapView from './components/MapView'
import SearchBar from './components/SearchBar'
import Sidebar from './components/Sidebar'
import { getRouteSuggestions } from './services/api'

export default function App() {
  const [origin, setOrigin] = useState({ lat: 20.994, lng: 105.807 })
  const [destination, setDestination] = useState(null)
  const [routes, setRoutes] = useState([])
  const [status, setStatus] = useState('Đang tải dữ liệu giao thông...')
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0)

  useEffect(() => {
    if (origin && destination) {
      fetchRoutes()
    }
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

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
      <MapView origin={origin} setOrigin={setOrigin} destination={destination} setDestination={setDestination} routes={routes} selectedRouteIndex={selectedRouteIndex} />
      <SearchBar origin={origin} setOrigin={setOrigin} destination={destination} setDestination={setDestination} />
      <Sidebar status={status} routes={routes} selectedRouteIndex={selectedRouteIndex} setSelectedRouteIndex={setSelectedRouteIndex} />
    </div>
  )
}
