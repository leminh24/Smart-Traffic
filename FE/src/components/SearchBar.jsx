import React, { useState, useEffect, useRef } from 'react'

export default function SearchBar({ origin, setOrigin, destination, setDestination }) {
  // Photon API hoàn toàn miễn phí và không cần API Key, dọn sạch đống Key cũ cho nhẹ nợ ông nhé!

  const [originQuery, setOriginQuery] = useState('')
  const [destQuery, setDestQuery] = useState('')
  
  const [originSuggestions, setOriginSuggestions] = useState([])
  const [destSuggestions, setDestSuggestions] = useState([])
  
  const [originVisible, setOriginVisible] = useState(false)
  const [destVisible, setDestVisible] = useState(false)
  
  const [originDropdownOpen, setOriginDropdownOpen] = useState(false)
  const [destDropdownOpen, setDestDropdownOpen] = useState(false)

  // State để load danh sách địa chỉ đã lưu từ LocalStorage hiển thị nhanh
  const [savedAddresses, setSavedAddresses] = useState({ homeLocation: null, workLocation: null })

  const originTimeoutRef = useRef(null)
  const destTimeoutRef = useRef(null)

  // Hàm định dạng địa chỉ từ các trường thuộc tính của Photon
  const formatPhotonAddress = (feature) => {
    if (!feature || !feature.properties) return 'Địa chỉ không xác định'
    const p = feature.properties
    return [p.name, p.street, p.city, p.country].filter(Boolean).join(', ')
  }

  // FIX LỖI ĐỊA CHỈ: Lấy vị trí GPS thật và tự động dịch sang địa chỉ chữ bằng Photon Reverse Geocode
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('smartTrafficSavedAddresses') || '{}')
    setSavedAddresses(stored)

    if (navigator.geolocation) {
      setOriginQuery('Đang xác định vị trí của bạn...')
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          const currentLoc = { lat: latitude, lng: longitude }
          
          setOrigin(currentLoc)

          // ĐÃ ĐỔI SANG PHOTON REVERSE GEOCODE: Dịch tọa độ sang tên đường Việt Nam chữ thật
          fetch(`https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}`)
            .then(r => r.json())
            .then(data => {
              if (data.features && data.features.length > 0) {
                setOriginQuery(formatPhotonAddress(data.features[0]))
              } else {
                setOriginQuery(`Vị trí của bạn (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`)
              }
            })
            .catch(() => {
              setOriginQuery(`Vị trí của bạn (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`)
            })
        },
        (error) => {
          console.error("Lỗi lấy vị trí GPS thật:", error)
          setOriginQuery(`Mặc định: ${origin?.lat.toFixed(4)}, ${origin?.lng.toFixed(4)}`)
        }
      )
    }
  }, [])

  const reloadSavedAddresses = () => {
    const stored = JSON.parse(localStorage.getItem('smartTrafficSavedAddresses') || '{}')
    setSavedAddresses(stored)
  }

  // Tìm kiếm Điểm xuất phát (Photon API)
  function onOriginInput(e) {
    const value = e.target.value
    setOriginQuery(value)

    if (originTimeoutRef.current) clearTimeout(originTimeoutRef.current)
    if (value.length < 3) {
      setOriginSuggestions([])
      return
    }

    originTimeoutRef.current = setTimeout(() => {
      fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(value)}&limit=5`)
        .then(r => r.json())
        .then(data => {
          if (data.features) {
            setOriginSuggestions(data.features)
            setOriginVisible(true) // Đảm bảo bật hộp gợi ý lên khi có data
          }
        })
        .catch(err => console.error("Lỗi Photon Origin:", err))
    }, 400)
  }

  function pickOriginSuggestion(feature) {
    // Bẫy GeoJSON: coordinates[0] là Lng, coordinates[1] là Lat
    const [lng, lat] = feature.geometry.coordinates
    setOrigin({ lat, lng })
    setOriginQuery(formatPhotonAddress(feature))
    setOriginVisible(false)
  }

  // Tìm kiếm Điểm đến (Photon API)
  function onDestInput(e) {
    const value = e.target.value
    setDestQuery(value)

    if (destTimeoutRef.current) clearTimeout(destTimeoutRef.current)
    if (value.length < 3) {
      setDestSuggestions([])
      return
    }

    destTimeoutRef.current = setTimeout(() => {
      fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(value)}&limit=5`)
        .then(r => r.json())
        .then(data => {
          if (data.features) {
            setDestSuggestions(data.features)
            setDestVisible(true)
          }
        })
        .catch(err => console.error("Lỗi Photon Destination:", err))
    }, 400)
  }

  function pickDestSuggestion(feature) {
    const [lng, lat] = feature.geometry.coordinates
    setDestination({ lat, lng })
    setDestQuery(formatPhotonAddress(feature))
    setDestVisible(false)
  }

  // --- Giữ nguyên logic LocalStorage cải tiến của ông ---
  function saveCurrentOrigin(type) {
    if (!origin) return alert('Chưa có vị trí xuất phát để lưu')
    const key = 'smartTrafficSavedAddresses'
    const stored = JSON.parse(localStorage.getItem(key) || '{}')
    const addressData = { lat: origin.lat, lng: origin.lng, address: originQuery }
    
    if (type === 'home') stored.homeLocation = addressData
    else stored.workLocation = addressData
    
    localStorage.setItem(key, JSON.stringify(stored))
    alert('Đã lưu điểm xuất phát thành công')
    setOriginDropdownOpen(false)
    reloadSavedAddresses()
  }

  function saveCurrentDest(type) {
    if (!destination) return alert('Chưa có điểm đến để lưu')
    const key = 'smartTrafficSavedAddresses'
    const stored = JSON.parse(localStorage.getItem(key) || '{}')
    const addressData = { lat: destination.lat, lng: destination.lng, address: destQuery }
    
    if (type === 'home') stored.homeLocation = addressData
    else stored.workLocation = addressData
    
    localStorage.setItem(key, JSON.stringify(stored))
    alert('Đã lưu địa chỉ thành công')
    setDestDropdownOpen(false)
    reloadSavedAddresses()
  }

  function useSavedLocation(loc, isOrigin) {
    if (isOrigin) {
      setOrigin({ lat: loc.lat, lng: loc.lng })
      setOriginQuery(loc.address || 'Địa chỉ đã lưu')
      setOriginVisible(false)
    } else {
      setDestination({ lat: loc.lat, lng: loc.lng })
      setDestQuery(loc.address || 'Địa chỉ đã lưu')
      setDestVisible(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: '15px',
      left: '60px',
      zIndex: 1000,
      width: '380px',
      background: '#fff',
      padding: '12px',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
    }}>
      
      {/* Origin Input Row */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        marginBottom: '12px', 
        position: 'relative',
        zIndex: (originDropdownOpen || originVisible) ? 1010 : 2 
      }}>
        <span style={{ fontSize: '14px' }}>🟢</span>
        <input 
          value={originQuery}
          onChange={onOriginInput}
          onFocus={() => { setOriginVisible(true); setDestVisible(false); }}
          placeholder="Nhập địa điểm xuất phát..."
          style={styles.inputField}
        />
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => { setOriginDropdownOpen(!originDropdownOpen); setOriginVisible(false); }}
            style={styles.saveBtn}
          >
            💾 Lưu
          </button>
          {originDropdownOpen && (
            <div style={styles.dropdownBox}>
              <button onClick={() => saveCurrentOrigin('home')} style={styles.dropdownItem}>📍 Lưu Nhà</button>
              <button onClick={() => saveCurrentOrigin('work')} style={styles.dropdownItem}>💼 Lưu Công ty</button>
            </div>
          )}
        </div>
      </div>

      {/* Origin Dropdown Suggestions */}
      {originVisible && (
        <div style={styles.suggestionsBox}>
          {/* Địa điểm đã lưu */}
          {(savedAddresses.homeLocation || savedAddresses.workLocation) && (
            <div style={{ background: '#f8fafc', paddingBottom: '4px' }}>
              <div style={styles.sectionHeader}>⭐ Địa điểm đã lưu của ông</div>
              {savedAddresses.homeLocation && (
                <div onClick={() => useSavedLocation(savedAddresses.homeLocation, true)} style={styles.savedItem}>
                  🏠 <b>Nhà riêng:</b> <span style={styles.truncatedText}>{savedAddresses.homeLocation.address}</span>
                </div>
              )}
              {savedAddresses.workLocation && (
                <div onClick={() => useSavedLocation(savedAddresses.workLocation, true)} style={styles.savedItem}>
                  💼 <b>Công ty:</b> <span style={styles.truncatedText}>{savedAddresses.workLocation.address}</span>
                </div>
              )}
              <div style={{ borderBottom: '2px dashed #e2e8f0', margin: '6px 0' }}></div>
            </div>
          )}

          {/* Gợi ý từ Photon API */}
          {originSuggestions.length > 0 ? (
            originSuggestions.map((s, idx) => {
              const addressText = formatPhotonAddress(s)
              return (
                <div 
                  key={`${s.properties.osm_id || idx}-${idx}`} 
                  onClick={() => pickOriginSuggestion(s)} 
                  style={styles.suggestionItem}
                  title={addressText}
                >
                  📍 {addressText}
                </div>
              )
            })
          ) : (
            originQuery.length >= 3 && <div style={styles.noResult}>Đang tìm kiếm gợi ý...</div>
          )}
          
          <div onClick={() => setOriginVisible(false)} style={styles.closeBoxBtn}>Đóng bảng gợi ý ✕</div>
        </div>
      )}

      {/* Destination Input Row */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        marginBottom: '4px', 
        position: 'relative',
        zIndex: (destDropdownOpen || destVisible) ? 1005 : 1 
      }}>
        <span style={{ fontSize: '14px' }}>🔴</span>
        <input 
          placeholder="Tìm điểm đến..." 
          value={destQuery} 
          onChange={onDestInput}
          onFocus={() => { setDestVisible(true); setOriginVisible(false); }}
          style={styles.inputField}
        />
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => { setDestDropdownOpen(!destDropdownOpen); setDestVisible(false); }}
            style={styles.saveBtn}
          >
            💾 Lưu
          </button>
          {destDropdownOpen && (
            <div style={styles.dropdownBox}>
              <button onClick={() => saveCurrentDest('home')} style={styles.dropdownItem}>📍 Lưu Nhà</button>
              <button onClick={() => saveCurrentDest('work')} style={styles.dropdownItem}>💼 Lưu Công ty</button>
            </div>
          )}
        </div>
      </div>

      {/* Destination Dropdown Suggestions */}
      {destVisible && (
        <div style={styles.suggestionsBox}>
          {/* Địa điểm đã lưu */}
          {(savedAddresses.homeLocation || savedAddresses.workLocation) && (
            <div style={{ background: '#f8fafc', paddingBottom: '4px' }}>
              <div style={styles.sectionHeader}>⭐ Địa điểm đã lưu của ông</div>
              {savedAddresses.homeLocation && (
                <div onClick={() => useSavedLocation(savedAddresses.homeLocation, false)} style={styles.savedItem}>
                  🏠 <b>Nhà riêng:</b> <span style={styles.truncatedText}>{savedAddresses.homeLocation.address}</span>
                </div>
              )}
              {savedAddresses.workLocation && (
                <div onClick={() => useSavedLocation(savedAddresses.workLocation, false)} style={styles.savedItem}>
                  💼 <b>Công ty:</b> <span style={styles.truncatedText}>{savedAddresses.workLocation.address}</span>
                </div>
              )}
              <div style={{ borderBottom: '2px dashed #e2e8f0', margin: '6px 0' }}></div>
            </div>
          )}

          {/* Gợi ý từ Photon API */}
          {destSuggestions.length > 0 ? (
            destSuggestions.map((s, idx) => {
              const addressText = formatPhotonAddress(s)
              return (
                <div 
                  key={`${s.properties.osm_id || idx}-${idx}`} 
                  onClick={() => pickDestSuggestion(s)} 
                  style={styles.suggestionItem}
                  title={addressText}
                >
                  📍 {addressText}
                </div>
              )
            })
          ) : (
            destQuery.length >= 3 && <div style={styles.noResult}>Đang tìm kiếm gợi ý...</div>
          )}

          <div onClick={() => setDestVisible(false)} style={styles.closeBoxBtn}>Đóng bảng gợi ý ✕</div>
        </div>
      )}
    </div>
  )
}

// Giữ nguyên Object CSS Inline sạch sẽ của ông
const styles = {
  inputField: {
    flex: 1,
    padding: '10px 12px',
    fontSize: '13px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    background: '#f8fafc',
    outline: 'none'
  },
  saveBtn: {
    padding: '8px 12px',
    fontSize: '13px',
    background: '#f0f0f0',
    border: '1px solid #ccc',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  dropdownBox: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '6px',
    width: '140px',
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 999
  },
  dropdownItem: {
    width: '100%', 
    textAlign: 'left', 
    padding: '10px 12px', 
    border: 'none',
    background: 'transparent', 
    cursor: 'pointer', 
    fontSize: '13px',
    borderBottom: '1px solid #f0f0f0'
  },
  suggestionsBox: {
    background: '#fff',
    borderRadius: '8px',
    maxHeight: '280px',
    overflowY: 'auto',
    marginTop: '6px',
    marginBottom: '8px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0'
  },
  suggestionItem: {
    padding: '10px 12px',
    fontSize: '12px',
    color: '#334155',
    cursor: 'pointer',
    borderBottom: '1px solid #f1f5f9',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  sectionHeader: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#64748b',
    padding: '6px 12px 2px 12px',
    textTransform: 'uppercase'
  },
  savedItem: {
    padding: '8px 12px',
    fontSize: '12.5px',
    color: '#1e293b',
    cursor: 'pointer',
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
    background: '#f0fdf4',
    borderBottom: '1px solid #e2e8f0'
  },
  truncatedText: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flex: 1
  },
  noResult: {
    padding: '12px',
    fontSize: '12px',
    color: '#94a3b8',
    textAlign: 'center'
  },
  closeBoxBtn: {
    padding: '6px',
    fontSize: '11px',
    textAlign: 'center',
    color: '#ef4444',
    background: '#fef2f2',
    cursor: 'pointer',
    fontWeight: '500'
  }
}