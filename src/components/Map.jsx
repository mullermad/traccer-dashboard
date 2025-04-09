import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const Map = ({ devices, selectedDevice }) => {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markersRef = useRef([]);
  const initializedRef = useRef(false);
  const pathsRef = useRef({}); // Store device paths

  const greenIcon = new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const redIcon = new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current || initializedRef.current) return;

    // Create map instance
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
    }).setView([9.145, 40.4897], 6);

    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Store map reference
    mapRef.current = map;
    initializedRef.current = true;

    // Handle resize to prevent vibration
    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize({ animate: false });
      }
    };

    window.addEventListener("resize", handleResize);

    // Trigger initial resize after a short delay to ensure container is fully rendered
    setTimeout(() => {
      handleResize();
    }, 100);

    // Cleanup function
    return () => {
      window.removeEventListener("resize", handleResize);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        initializedRef.current = false;
      }
    };
  }, []);

  // Update markers when devices change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    devices.forEach((device) => {
      const isOnline = device.status === "online"; // <-- Adjust based on your actual data shape

      if (device.latitude && device.longitude) {
        const marker = L.marker(
          [device.latitude, device.longitude],
          { icon: isOnline ? greenIcon : redIcon } // <-- use the icon
        ).addTo(mapRef.current).bindPopup(`
           <div style="min-width: 250px; padding: 10px;">
  <strong style="font-size: 1.2em;">${device.name}</strong><br>
  <span style="font-size: 1em; color: #666;">
    ${device.latitude.toFixed(6)}, ${device.longitude.toFixed(6)}
  </span><br>
  <span style="font-size: 0.95em; color: #888;">
    Last update: ${new Date(device.lastUpdate).toLocaleString()}
  </span>
</div>

          `);

        // Store marker with device ID for reference
        marker.deviceId = device.id;
        markersRef.current.push(marker);

        // Update or create path for this device
        updateDevicePath(device);
      }
    });

    // Auto-fit bounds if we have markers and no selected device
    if (markersRef.current.length > 0 && !selectedDevice) {
      const bounds = L.featureGroup(markersRef.current).getBounds();
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [devices, selectedDevice]);

  // Handle selected device changes
  useEffect(() => {
    if (
      !mapRef.current ||
      !selectedDevice?.latitude ||
      !selectedDevice?.longitude
    )
      return;

    // Smoothly pan to the selected device
    mapRef.current.flyTo(
      [selectedDevice.latitude, selectedDevice.longitude],
      13,
      {
        animate: true,
        duration: 0.5,
      }
    );

    // Find and open popup for the selected device
    markersRef.current.forEach((marker) => {
      if (marker.deviceId === selectedDevice.id) {
        marker.openPopup();
      }
    });
  }, [selectedDevice]);

  // Force map to update its size when container changes
  useEffect(() => {
    if (!mapRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize({ animate: false });
      }
    });

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Helper function to update device paths (breadcrumb trail)
  const updateDevicePath = (device) => {
    if (!mapRef.current || !device.latitude || !device.longitude) return;

    // Get existing path or create new one
    if (!pathsRef.current[device.id]) {
      pathsRef.current[device.id] = {
        line: L.polyline([], {
          color: device.id === selectedDevice?.id ? "#ff3366" : "#3388ff",
          weight: 3,
          opacity: 0.6,
          dashArray: "5, 5",
        }).addTo(mapRef.current),
        points: [],
      };
    }

    const path = pathsRef.current[device.id];

    // Add new point to path
    const newPoint = [device.latitude, device.longitude];

    // Only add point if it's different from the last one
    if (
      path.points.length === 0 ||
      path.points[path.points.length - 1][0] !== newPoint[0] ||
      path.points[path.points.length - 1][1] !== newPoint[1]
    ) {
      path.points.push(newPoint);

      // Limit path length to last 10 points
      if (path.points.length > 10) {
        path.points = path.points.slice(-10);
      }

      // Update polyline
      path.line.setLatLngs(path.points);

      // Update color if selected state changed
      const isSelected = device.id === selectedDevice?.id;
      path.line.setStyle({
        color: isSelected ? "#ff3366" : "#3388ff",
        weight: isSelected ? 4 : 3,
      });
    }
  };

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full absolute inset-0"
      style={{ minHeight: "100%", zIndex: 1 }}
    />
  );
};

export default Map;
