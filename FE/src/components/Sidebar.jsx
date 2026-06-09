import React, { useState, useEffect } from 'react'
import VehicleSelector from "./VehicleSelector"
import ETAPanel from "./ETAPanel"
import RouteWarning from "./RouteWarning"

const WARNING_COLORS = {
  TAC_DUONG: { bg: '#fef2f2', border: '#ef4444', text: '#dc2626', icon: '🚗' },
  TAI_NAN:   { bg: '#fffbeb', border: '#f59e0b', text: '#d97706', icon: '🚨' },
  NGAP_LUT:  { bg: '#eff6ff', border: '#3b82f6', text: '#2563eb', icon: '🌊' },
}

/**
 * @param {{
 * status: string,
 * routes: Array,
 * selectedRouteIndex: number,
 * setSelectedRouteIndex: (idx: number) => void,
 * nearbyWarning: Object | null,
 * mapRef: React.MutableRefObject,
 * startCoords: {lat:number, lng:number} | null,
 * endCoords:   {lat:number, lng:number} | null,
 * warningSegments: string[],
 * onVehicleChange: (vehicleId: string) => void,
 * }} props
 */
export default function Sidebar({
  status,
  routes,
  selectedRouteIndex,
  setSelectedRouteIndex,
  nearbyWarning,
  mapRef,
  startCoords,
  endCoords,
  warningSegments = [],
  onVehicleChange
}) {
  const warnStyle = nearbyWarning ? WARNING_COLORS[nearbyWarning.type] || WARNING_COLORS.TAC_DUONG : null

  // State nhận diện thiết bị di động từ Đoạn 1
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div id="sidebar" className="sidebar" style={{
      position: 'fixed',
      bottom: isMobile ? '10px' : '15px',
      left: isMobile ? '10px' : '60px',
      right: isMobile ? '10px' : 'auto',
      width: isMobile ? 'auto' : '360px',
      maxHeight: isMobile ? '280px' : '420px',
      background: '#fff',
      borderRadius: '12px',
      padding: isMobile ? '12px' : '16px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      overflowY: 'auto',
      zIndex: 999
    }}>

      {/* 1. VEHICLE SELECTOR — đặt trên cùng sidebar */}
      <VehicleSelector
        mapRef={mapRef}
        onVehicleChange={onVehicleChange}
      />

      {/* 2. ROUTE WARNING — hiện khi đi bộ gặp đoạn nguy hiểm */}
      <RouteWarning segments={warningSegments} />

      {/* ── Cảnh báo sự cố gần (Từ Đoạn 1) ────────────────────────────────── */}
      {nearbyWarning && warnStyle && (
        <div style={{
          marginTop: '12px',
          marginBottom: '12px',
          padding: '10px 14px',
          background: warnStyle.bg,
          border: `2px solid ${warnStyle.border}`,
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'pulseBorder 1.2s ease-in-out infinite'
        }}>
          <span style={{ fontSize: '22px' }}>{warnStyle.icon}</span>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '13px', color: warnStyle.text }}>
              ⚠️ Sắp đến đoạn {nearbyWarning.label}
            </div>
            <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>
              Cách bạn khoảng <b>{nearbyWarning.distanceM}m</b> phía trước
            </div>
          </div>
        </div>
      )}

      {/* ── Tiêu đề và Trạng thái chính ──────────────────────────────────── */}
      <h3 style={{ margin: '12px 0 4px 0', fontSize: '16px' }}>Smart Traffic</h3>
      <p style={{ fontSize: '12px', color: '#666', margin: '0 0 10px 0' }}>
        Cập nhật lúc {new Date().toLocaleTimeString('vi-VN')}
      </p>
      <div style={{ fontSize: '13px', color: '#888', marginBottom: '12px' }}>{status}</div>

      {/* ── Kết quả tìm kiếm / Danh sách tuyến đường ────────────────────────── */}
      <div id="routesView">
        {routes && routes.map((r, idx) => (
          <div
            key={r.id || idx}
            onClick={() => setSelectedRouteIndex(idx)}
            style={{
              padding: '12px',
              marginBottom: '8px',
              borderRadius: '8px',
              cursor: 'pointer',
              background: selectedRouteIndex === idx ? '#e3f2fd' : '#f5f5f5',
              border: selectedRouteIndex === idx ? '2px solid #2196f3' : '1px solid #ddd',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{r.routeName}</span>
              <span style={{ fontSize: '13px', color: '#ff6b6b' }}>⏱️ {r.duration}</span>
            </div>
            <div style={{ fontSize: '12px', color: '#555' }}>Chiều dài: {r.totalDistance}</div>
          </div>
        ))}
      </div>

      {/* 3. ETA PANEL — đặt cuối sidebar, sau kết quả tìm kiếm */}
      <ETAPanel
        startCoords={startCoords}
        endCoords={endCoords}
      />

      {/* CSS Animation cho pulseBorder */}
      <style>{`
        @keyframes pulseBorder {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          50%       { box-shadow: 0 0 0 6px rgba(239,68,68,0); }
        }
      `}</style>
    </div>
  )
}