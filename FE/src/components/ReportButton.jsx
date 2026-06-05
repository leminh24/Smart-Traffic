import React, { useState, useEffect } from 'react';
import { reportIncident } from '../services/api';

export default function ReportButton({ origin, onReported }) {
  const [showPicker, setShowPicker] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });

  // State nhận diện thiết bị di động
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const incidentTypes = [
    { type: 'TAC_DUONG', label: 'Tắc đường', icon: '🚗', color: '#EF4444' },
    { type: 'TAI_NAN', label: 'Tai nạn', icon: '🚨', color: '#F59E0B' },
    { type: 'NGAP_LUT', label: 'Ngập lụt', icon: '🌊', color: '#3B82F6' },
  ];

  const handleReport = async (incident) => {
    if (!origin) return;
    try {
      await reportIncident({ lat: origin.lat, lng: origin.lng, type: incident.type });
      setShowPicker(false);
      showToast(`✅ Đã gửi báo cáo: ${incident.label}!`);
      if (onReported) onReported();
    } catch (err) {
      console.error('Lỗi gửi báo cáo:', err);
    }
  };

  const showToast = (message) => {
    setToast({ visible: true, message });
    setTimeout(() => {
      setToast({ visible: false, message: '' });
    }, 2500);
  };

  return (
    <>
      {/* Toast Notification */}
      {toast.visible && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#22c55e',
          color: '#fff',
          borderRadius: '50px',
          padding: '10px 20px',
          fontSize: '13px',
          fontWeight: 'bold',
          zIndex: 9999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          animation: 'fadeIn 0.2s ease forwards'
        }}>
          {toast.message}
        </div>
      )}

      {/* Vị trí được điều chỉnh động dựa trên isMobile */}
      <div style={{ 
        position: 'fixed', 
        bottom: isMobile ? '310px' : '100px', 
        right: '20px', 
        zIndex: 1001 
      }}>
        {/* Incident Type Picker */}
        {showPicker && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '15px',
            animation: 'slideUpFade 0.25s ease'
          }}>
            <button 
              onClick={() => setShowPicker(false)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#e2e8f0',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                color: '#64748b'
              }}
            >
              ✕
            </button>
            {incidentTypes.map((inc) => (
              <button
                key={inc.type}
                onClick={() => handleReport(inc)}
                style={{
                  width: '160px',
                  height: '48px',
                  borderRadius: '50px',
                  background: inc.color,
                  border: 'none',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                }}
              >
                <span>{inc.icon}</span> {inc.label}
              </button>
            ))}
          </div>
        )}

        {/* FAB Button */}
        <button
          onClick={() => setShowPicker(!showPicker)}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#F97316',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(249,115,22,0.5)',
            color: '#fff',
            paddingTop: '4px'
          }}
        >
          <span style={{ fontSize: '22px', lineHeight: '1' }}>⚠️</span>
          <span style={{ fontSize: '10px', fontWeight: 'bold' }}>Báo cáo</span>
        </button>
      </div>

      <style>
        {`
          @keyframes slideUpFade {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}
      </style>
    </>
  );
}