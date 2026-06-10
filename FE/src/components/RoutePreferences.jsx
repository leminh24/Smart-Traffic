import React, { useState } from 'react';

const DEFAULT_PREFERENCES = {
  avoidHighway: false,
  avoidToll: false,
  avoidFerry: true,
  avoidUnpaved: false,
};

export default function RoutePreferences({ onPreferencesChange }) {
  const [prefs, setPrefs] = useState(() => {
    const saved = localStorage.getItem('routePreferences');
    return saved ? JSON.parse(saved) : DEFAULT_PREFERENCES;
  });

  const handleToggle = (key) => {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    localStorage.setItem('routePreferences', JSON.stringify(newPrefs));
    onPreferencesChange(newPrefs); // Tái định tuyến ngay lập tức
  };

  return (
    <div style={{
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '10px',
      padding: '14px',
      marginBottom: '12px'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '14px' }}>
        ⚙️ Tùy chỉnh tuyến đường
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={prefs.avoidHighway} 
            onChange={() => handleToggle('avoidHighway')} 
          />
          <span>Tránh cao tốc / Highway</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={prefs.avoidToll} 
            onChange={() => handleToggle('avoidToll')} 
          />
          <span>Tránh đường thu phí (Toll)</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={prefs.avoidFerry} 
            onChange={() => handleToggle('avoidFerry')} 
          />
          <span>Tránh phà / Đò (Ferry)</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={prefs.avoidUnpaved} 
            onChange={() => handleToggle('avoidUnpaved')} 
          />
          <span>Tránh đường đất / Đường xấu (Unpaved)</span>
        </label>
      </div>
    </div>
  );
}