import React from 'react'

export default function Sidebar({ status, routes, selectedRouteIndex, setSelectedRouteIndex }) {
  return (
    <div id="sidebar" style={{
      position: 'fixed',
      bottom: '15px',
      left: '60px',
      width: '360px',
      maxHeight: '380px',
      background: '#fff',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      overflowY: 'auto',
      zIndex: 999
    }}>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Smart Traffic</h3>
      <p style={{ fontSize: '12px', color: '#666', margin: '0 0 12px 0' }}>Nhấn vào tuyến đường để chọn xem</p>
      <div id="status-loading" style={{ fontSize: '13px', color: '#888', marginBottom: '12px' }}>{status}</div>
      <div className="route-list" id="routesView">
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
            className={`route-card ${selectedRouteIndex === idx? 'active':''}`}>
            <div className="route-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{r.routeName}</span>
              <span className="route-time" style={{ fontSize: '13px', color: '#ff6b6b' }}>⏱️ {r.duration}</span>
            </div>
            <div className="route-distance" style={{ fontSize: '12px', color: '#555' }}>Chiều dài: {r.totalDistance}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
