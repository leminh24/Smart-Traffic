// Nhập các thành phần cần thiết từ services.js (giống cách import trong React)
import { 
    BACKEND_BASE, 
    SAVED_ADDRESSES_KEY, 
    getMyLocationGPS, 
    calculateDistanceInMeters, 
    urlBase64ToUint8Array, 
    saveUserPreferences 
} from './services.js';

// =========================================================================
// 1. BIẾN TOÀN CỤC/TRẠNG THÁI ỨNG DỤNG
// =========================================================================
let customOrigin = { lat: 20.994, lng: 105.807 }; 
let customDest = null;                            
let isUserNavigating = false;                     
let navigationInterval = null;                    
let lastAlertedSegmentId = null;                  

let searchDebounceTimeout = null;
let activeInputType = 'dest';                     
let savedHomeCoords = null;                       
let savedWorkCoords = null;                       

// =========================================================================
// 2. KHỞI TẠO BẢN ĐỒ & TRUY VẤN CÁC PHẦN TỬ DOM
// =========================================================================
const map = initTrafficMap(customOrigin.lat, customOrigin.lng);

const originInput = document.getElementById('origin-input');
const destInput = document.getElementById('search-input');
const suggestionsBox = document.getElementById('suggestions-box');
const startNavBtn = document.getElementById('start-nav-btn');
const statusLoading = document.getElementById('status-loading');

const originOptionsBtn = document.getElementById('origin-options-btn');
const originOptionsMenu = document.getElementById('origin-options-menu');
const destOptionsBtn = document.getElementById('dest-options-btn');
const destOptionsMenu = document.getElementById('dest-options-menu');

// Khởi chạy nạp dữ liệu cũ từ bộ nhớ máy
loadSavedAddressesFromStorage();

// Kích hoạt định vị GPS ban đầu
getMyLocationGPS(
    (lat, lng) => {
        customOrigin.lat = lat;
        customOrigin.lng = lng;
        originInput.value = `Vị trí của bạn (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        updateUserMarkerGPS(lat, lng, 'Vị trí thực tế của bạn');
    },
    (error) => {
        originInput.value = `Hà Nội (Mặc định - Chưa bật GPS)`;
        updateUserMarkerGPS(customOrigin.lat, customOrigin.lng, 'Vị trí mặc định (Chưa bật GPS)');
        console.warn('Lỗi định vị:', error);
    }
);

// =========================================================================
// 3. XỬ LÝ API ROUTING ĐƯỜNG ĐI
// =========================================================================
async function executeTrafficRoutingProcess() {
    if (!customOrigin.lat || !customDest || !customDest.lat) return;

    if (statusLoading) {
        statusLoading.innerText = 'Đang tìm tuyến đường...';
        statusLoading.style.color = '#000';
        statusLoading.style.display = 'block';
    }

    try {
        const apiUrl = `${BACKEND_BASE}/api/traffic/route-suggestions?oLat=${customOrigin.lat}&oLng=${customOrigin.lng}&dLat=${customDest.lat}&dLng=${customDest.lng}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const message = errorData.error || `Lỗi API: ${response.status}`;
            throw new Error(message);
        }

        const routes = await response.json();
        renderRoutesOnMapAndSidebar(routes);

        const currentUserPos = { lat: customOrigin.lat, lng: customOrigin.lng };
        checkTrafficAheadAndWarn(currentUserPos, routes);

    } catch (error) {
        console.error('Lỗi khi rà soát lộ trình:', error);
        if (statusLoading) {
            statusLoading.innerText = 'Không tìm được tuyến đường. Vui lòng thử lại.';
            statusLoading.style.color = '#c53030';
        }
        clearOldTrafficData();
    }
}

map.on('click', function(event) {
    const lat = event.latlng.lat;
    const lng = event.latlng.lng;

    customDest = { lat, lng };
    destInput.value = `Điểm chọn từ Bản đồ (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

    updateDestinationMarker(lat, lng);
    executeTrafficRoutingProcess();
});

// =========================================================================
// 4. CHỨC NĂNG GỢI Ý ĐỊA CHỈ (AUTO-COMPLETE)
// =========================================================================
function showSavedAddressesInSuggestions() {
    suggestionsBox.innerHTML = '';
    let hasSavedData = false;

    if (savedHomeCoords) {
        hasSavedData = true;
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.innerHTML = `🏠 <b>Nhà (Địa chỉ đã lưu)</b> <small style="color:#64748b;">(${savedHomeCoords.lat.toFixed(4)}, ${savedHomeCoords.lng.toFixed(4)})</small>`;
        item.addEventListener('click', () => {
            handleSelectSavedAddress(savedHomeCoords, 'Nhà (Đã lưu)');
        });
        suggestionsBox.appendChild(item);
    }

    if (savedWorkCoords) {
        hasSavedData = true;
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.innerHTML = `💼 <b>Công ty (Địa chỉ đã lưu)</b> <small style="color:#64748b;">(${savedWorkCoords.lat.toFixed(4)}, ${savedWorkCoords.lng.toFixed(4)})</small>`;
        item.addEventListener('click', () => {
            handleSelectSavedAddress(savedWorkCoords, 'Công ty (Đã lưu)');
        });
        suggestionsBox.appendChild(item);
    }

    suggestionsBox.style.display = hasSavedData ? 'block' : 'none';
}

function handleSelectSavedAddress(coords, displayName) {
    const lat = coords.lat;
    const lng = coords.lng;

    if (activeInputType === 'origin') {
        customOrigin = { lat, lng };
        originInput.value = displayName;
        updateUserMarkerGPS(lat, lng, `Điểm đi: ${displayName}`);
        map.flyTo([lat, lng], 14);
    } else {
        customDest = { lat, lng };
        destInput.value = displayName;
        updateDestinationMarker(lat, lng);
        map.flyTo([lat, lng], 14);
    }

    closeDropdownMenus();
    executeTrafficRoutingProcess();
}

function setupAutoCompleteForInput(inputElement, type) {
    inputElement.addEventListener('focus', () => {
        activeInputType = type;
        if (inputElement.value.trim().length < 3) {
            showSavedAddressesInSuggestions();
        }
    });

    inputElement.addEventListener('input', (e) => {
        clearTimeout(searchDebounceTimeout);
        const query = e.target.value.trim();

        if (query.length < 3) {
            showSavedAddressesInSuggestions();
            return;
        }

        searchDebounceTimeout = setTimeout(async () => {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=105.6,21.1,106.0,20.8&bounded=1&addressdetails=1&limit=6`;
            try {
                const response = await fetch(url, { headers: { 'Accept-Language': 'vi' } });
                const locations = await response.json();
                renderSearchSuggestions(locations);
            } catch (error) {
                console.error('Lỗi truy vấn dữ liệu địa chỉ:', error);
            }
        }, 400);
    });
}

setupAutoCompleteForInput(originInput, 'origin');
setupAutoCompleteForInput(destInput, 'dest');

function renderSearchSuggestions(locations) {
    suggestionsBox.innerHTML = '';
    if (locations.length === 0) {
        const emptyItem = document.createElement('div');
        emptyItem.className = 'suggestion-item';
        emptyItem.innerText = '❌ Không tìm thấy địa điểm phù hợp';
        suggestionsBox.appendChild(emptyItem);
        suggestionsBox.style.display = 'block';
        return;
    }

    suggestionsBox.style.display = 'block';
    locations.forEach(place => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.innerText = place.display_name;

        item.addEventListener('click', () => {
            const lat = parseFloat(place.lat);
            const lng = parseFloat(place.lon);

            if (activeInputType === 'origin') {
                customOrigin = { lat, lng };
                originInput.value = place.display_name;
                updateUserMarkerGPS(lat, lng, `Điểm đi: ${place.display_name}`);
                map.flyTo([lat, lng], 14);
            } else {
                customDest = { lat, lng };
                destInput.value = place.display_name;
                updateDestinationMarker(lat, lng);
                map.flyTo([lat, lng], 14);
            }

            closeDropdownMenus();
            executeTrafficRoutingProcess(); 
        });
        suggestionsBox.appendChild(item);
    });
}

function updateDestinationMarker(lat, lng) {
    if (window.currentDestMarker) {
        window.currentDestMarker.setLatLng([lat, lng]);
    } else {
        window.currentDestMarker = L.marker([lat, lng]).addTo(map);
    }
    window.currentDestMarker.bindPopup(`<b>🎯 Điểm đến hiện tại</b>`).openPopup();
}

function renderRoutesOnMapAndSidebar(routes) {
    clearOldTrafficData();
    if (!routes || !routes.length) {
        if (statusLoading) {
            statusLoading.innerText = 'Không tìm được tuyến đường phù hợp.';
            statusLoading.style.color = '#c53030';
        }
        return;
    }
    renderTrafficRoutesToUI(routes);
    if (statusLoading) {
        statusLoading.innerText = `Hiển thị ${routes.length} tuyến đường.`;
        statusLoading.style.color = '#047857';
    }
}

// =========================================================================
// 5. GIÁM SÁT HÀNH TRÌNH LIÊN TỤC & PHÁT GIỌNG NÓI CẢNH BÁO
// =========================================================================
function startContinuousRoutingMonitor() {
    if (navigationInterval) clearInterval(navigationInterval);
    isUserNavigating = true;
    
    navigationInterval = setInterval(() => {
        if (!isUserNavigating || !customDest) return;
        getMyLocationGPS((currentLat, currentLng) => {
            customOrigin.lat = currentLat;
            customOrigin.lng = currentLng;
            executeTrafficRoutingProcess();
        });
    }, 15000);
}

function checkTrafficAheadAndWarn(currentUserPos, routesList) {
    if (!routesList || routesList.length === 0) return;
    const activeRoute = routesList[0]; 
    const segments = activeRoute.segments;

    let congestedSegmentIndex = -1;
    for (let i = 0; i < segments.length; i++) {
        if (segments[i].status === "Đỏ" || segments[i].status === "Cam") {
            congestedSegmentIndex = i;
            break;
        }
    }

    if (congestedSegmentIndex === -1) {
        lastAlertedSegmentId = null;
        return;
    }

    const congestedSegment = segments[congestedSegmentIndex];
    const targetPoint = congestedSegment.coordinates[0]; 
    const distanceToCongestion = calculateDistanceInMeters(
        currentUserPos.lat, currentUserPos.lng,
        targetPoint.latitude, targetPoint.longitude
    );

    if (distanceToCongestion >= 300 && distanceToCongestion <= 500) {
        const segmentId = `${targetPoint.latitude}_${targetPoint.longitude}`;
        if (lastAlertedSegmentId === segmentId) return;

        lastAlertedSegmentId = segmentId;
        const alternativeRoute = routesList.find(r => r.id === "route_alternative");
        let speechMessage = "";
        
        if (alternativeRoute && alternativeRoute.timeSaved >= 5) {
            speechMessage = `Đoạn đường phía trước đang tắc nặng. Bạn nên đi theo Tuyến hai đường rẽ tối ưu để tiết kiệm ${alternativeRoute.timeSaved} phút.`;
        } else {
            speechMessage = `Chú ý. Đoạn đường phía trước khoảng bốn trăm mét đang ùn tắc giao thông, hãy giảm tốc độ và chú ý quan sát.`;
        }
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(speechMessage);
            utterance.lang = 'vi-VN';
            window.speechSynthesis.speak(utterance);
        }
    }
}

// =========================================================================
// 6. SỰ KIỆN NÚT BẤM VÀ LẮNG NGHE GIAO DIỆN
// =========================================================================
function closeDropdownMenus() {
    suggestionsBox.innerHTML = '';
    suggestionsBox.style.display = 'none';
    if (originOptionsMenu) originOptionsMenu.classList.remove('visible');
    if (destOptionsMenu) destOptionsMenu.classList.remove('visible');
}

document.addEventListener('click', (e) => {
    if (!originInput.contains(e.target) && !destInput.contains(e.target) && 
        !suggestionsBox.contains(e.target) && 
        !e.target.classList.contains('inline-option-btn')) {
        closeDropdownMenus();
    }
});

if (originOptionsBtn && originOptionsMenu) {
    originOptionsBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        originOptionsMenu.classList.toggle('visible');
        if (destOptionsMenu) destOptionsMenu.classList.remove('visible');
    });

    originOptionsMenu.addEventListener('click', (event) => {
        event.stopPropagation();
        const action = event.target.dataset.action;
        if (action === 'save-home-origin') saveCurrentOrigin('home');
        if (action === 'save-work-origin') saveCurrentOrigin('work');
        originOptionsMenu.classList.remove('visible');
    });
}

if (destOptionsBtn && destOptionsMenu) {
    destOptionsBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        destOptionsMenu.classList.toggle('visible');
        if (originOptionsMenu) originOptionsMenu.classList.remove('visible');
    });

    destOptionsMenu.addEventListener('click', (event) => {
        event.stopPropagation();
        const action = event.target.dataset.action;
        if (action === 'save-home') saveCurrentDestination('home');
        if (action === 'save-work') saveCurrentDestination('work');
        destOptionsMenu.classList.remove('visible');
    });
}

function saveCurrentOrigin(type) {
    if (!customOrigin || !customOrigin.lat) return alert('Vui lòng chọn hoặc định vị một điểm đi trước khi lưu Nhà/Công ty.');
    if (type === 'home') {
        savedHomeCoords = { ...customOrigin };
        alert(`Đã lưu điểm đi hiện tại làm Nhà: (${savedHomeCoords.lat.toFixed(4)}, ${savedHomeCoords.lng.toFixed(4)})`);
    } else if (type === 'work') {
        savedWorkCoords = { ...customOrigin };
        alert(`Đã lưu điểm đi hiện tại làm Công ty: (${savedWorkCoords.lat.toFixed(4)}, ${savedWorkCoords.lng.toFixed(4)})`);
    }
    persistSavedAddresses();
    saveUserPreferences(savedHomeCoords, savedWorkCoords);
}

function saveCurrentDestination(type) {
    if (!customDest) return alert('Vui lòng chọn hoặc tìm một điểm đến trước khi lưu Nhà/Công ty.');
    if (type === 'home') {
        savedHomeCoords = { ...customDest };
        alert(`Đã lưu địa chỉ hiện tại làm Nhà: (${savedHomeCoords.lat.toFixed(4)}, ${savedHomeCoords.lng.toFixed(4)})`);
    } else if (type === 'work') {
        savedWorkCoords = { ...customDest };
        alert(`Đã lưu địa chỉ hiện tại làm Công ty: (${savedWorkCoords.lat.toFixed(4)}, ${savedWorkCoords.lng.toFixed(4)})`);
    }
    persistSavedAddresses();
    saveUserPreferences(savedHomeCoords, savedWorkCoords);
}

document.getElementById('set-home-btn').addEventListener('click', () => {
    saveCurrentDestination('home');
});

document.getElementById('set-work-btn').addEventListener('click', () => {
    saveCurrentDestination('work');
});

document.getElementById('enable-push-btn').addEventListener('click', async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        alert("Trình duyệt này không hỗ trợ Push.");
        return;
    }
    try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        const keyRes = await fetch(`${BACKEND_BASE}/api/traffic/push-public-key`);
        const { publicKey } = await keyRes.json();
        
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey)
        });

        await saveUserPreferences(savedHomeCoords, savedWorkCoords, subscription);
        alert("🎉 Kích hoạt thông báo thành công!");
        document.getElementById('enable-push-btn').innerText = "✅ Đã bật thông báo thành công";
        document.getElementById('enable-push-btn').style.backgroundColor = "#c3e6cb";
    } catch (err) {
        console.error("Lỗi Push:", err);
    }
});

// =========================================================================
// 7. QUẢN LÝ BỘ NHỚ LOCALSTORAGE CỦA TRÌNH DUYỆT
// =========================================================================
function loadSavedAddressesFromStorage() {
    try {
        const stored = localStorage.getItem(SAVED_ADDRESSES_KEY);
        if (!stored) return;
        const parsed = JSON.parse(stored);
        savedHomeCoords = parsed.homeLocation || null;
        savedWorkCoords = parsed.workLocation || null;
    } catch (error) {
        console.warn('Không thể đọc dữ liệu địa chỉ đã lưu:', error);
    }
}

function persistSavedAddresses() {
    localStorage.setItem(SAVED_ADDRESSES_KEY, JSON.stringify({
        homeLocation: savedHomeCoords,
        workLocation: savedWorkCoords
    }));
}