// ==== CONFIG ====
const DEFAULT_CENTER = Array.isArray(window.MAP_CENTER)
  ? window.MAP_CENTER
  : [22.5726, 88.3639];
const DEFAULT_ZOOM = Number.isInteger(window.MAP_ZOOM) ? window.MAP_ZOOM : 15;

// thresholds
const THRESHOLD_METERS = 0.5; // 50 cm (movement needed to add a new point)
const ACCURACY_SOFT_GATE = 50; // allow first/most fixes to show; skip >50m accuracy

// ==== MAP INIT ====
const map = L.map("map").setView(DEFAULT_CENTER, DEFAULT_ZOOM);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

// Layers
const pastLayer = L.layerGroup().addTo(map); // small fixed dots for previous points
const movingLayer = L.layerGroup().addTo(map); // moving/current marker
const trail = L.polyline([], {
  color: "#2563eb",
  weight: 4,
  opacity: 0.9,
}).addTo(map);

// Marker icon (CDN — avoids missing icon path issues)
const pinIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// ==== STATE ====
let watchId = null;
let lastAccepted = null; // { lat, lng }
let movingMarker = null; // current/live marker
let startMarker = null; // start pin
let endMarker = null; // end pin

// UI handles
const startBtn = document.getElementById("startBtn");
const endBtn = document.getElementById("endBtn");
const statusEl = document.getElementById("status");
const setStatus = (t) => statusEl && (statusEl.textContent = t || "");

// ==== UTILS ====
const toRad = (d) => (d * Math.PI) / 180;
function distMeters(a, b) {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat),
    dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function animateTo(marker, from, to, ms = 600) {
  const start = performance.now();
  function step(now) {
    const t = Math.min(1, (now - start) / ms);
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    marker.setLatLng([
      from.lat + (to.lat - from.lat) * ease,
      from.lng + (to.lng - from.lng) * ease,
    ]);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// Draw helpers
function acceptPoint(lat, lng) {
  const pt = { lat: Number(lat), lng: Number(lng) };

  // fixed small dot for previous accepted point
  if (lastAccepted) {
    L.circleMarker([lastAccepted.lat, lastAccepted.lng], {
      radius: 4,
      color: "#6b7280",
      fillColor: "#6b7280",
      fillOpacity: 1,
    }).addTo(pastLayer);
  }

  if (!movingMarker) {
    movingMarker = L.marker([pt.lat, pt.lng], {
      icon: pinIcon,
      riseOnHover: true,
    })
      .addTo(movingLayer)
      .bindPopup("You")
      .openPopup();
  } else {
    const cur = movingMarker.getLatLng();
    animateTo(movingMarker, { lat: cur.lat, lng: cur.lng }, pt, 600);
  }

  trail.addLatLng([pt.lat, pt.lng]);
  map.panTo([pt.lat, pt.lng], { animate: true });

  lastAccepted = pt;
}

// ==== START / END FLOW ====
function startTracking() {
  if (watchId !== null) return; // already running

  // reset layers & state
  pastLayer.clearLayers();
  movingLayer.clearLayers();
  trail.setLatLngs([]);
  lastAccepted = null;
  movingMarker = null;
  if (startMarker) {
    map.removeLayer(startMarker);
    startMarker = null;
  }
  if (endMarker) {
    map.removeLayer(endMarker);
    endMarker = null;
  }

  setStatus("Getting start location…");

  if (!("geolocation" in navigator)) {
    setStatus("Geolocation not supported");
    return;
  }

  // 1) First fix — place START marker
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      startMarker = L.marker([latitude, longitude], { icon: pinIcon })
        .addTo(map)
        .bindPopup("Start")
        .openPopup();
      acceptPoint(latitude, longitude);
      setStatus("Tracking…");
    },
    (err) => setStatus("Location error: " + (err?.message || err)),
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
  );

  // 2) Keep watching and update line/moving marker
  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      if (typeof accuracy === "number" && accuracy > ACCURACY_SOFT_GATE) {
        // too poor; skip this fix
        return;
      }

      if (!lastAccepted) {
        acceptPoint(latitude, longitude);
        return;
      }
      const moved = distMeters(lastAccepted, { lat: latitude, lng: longitude });
      if (moved >= THRESHOLD_METERS) {
        acceptPoint(latitude, longitude);
        setStatus(`Moved ${moved.toFixed(2)} m`);
      }
    },
    (err) => setStatus("Tracking error: " + (err?.message || err)),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
  );
}

function endTracking() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  if (lastAccepted) {
    endMarker = L.marker([lastAccepted.lat, lastAccepted.lng], {
      icon: pinIcon,
    })
      .addTo(map)
      .bindPopup("End")
      .openPopup();
  }
  setStatus("Stopped");
}

// ==== UI EVENTS ====
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("startBtn")?.addEventListener("click", startTracking);
  document.getElementById("endBtn")?.addEventListener("click", endTracking);
});
