"use client";

import { useState, useEffect } from "react";
import DeviceList from "./components/DeviceList";
import Map from "./components/Map";
import {
  fetchDevices,
  fetchPositions,
  getAddressFromCoordinates,
} from "./api/traccarApi";
import { RefreshCw, Search, X } from "lucide-react";

const App = () => {
  const [devices, setDevices] = useState([]);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [addressCache, setAddressCache] = useState({});

  // Live refresh: fetches data every 30 seconds.
  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 30000);
    return () => clearInterval(intervalId);
  }, []);

  // Filters devices based on search term and updates the filtered devices list.
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredDevices(devices);
    } else {
      const filtered = devices.filter((device) =>
        device.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDevices(filtered);
    }
  }, [searchTerm, devices]);

  // Fetches and caches the address for the selected device based on its coordinates. If the address is already cached, it uses the cached value.
  useEffect(() => {
    const fetchAddress = async () => {
      if (selectedDevice?.latitude && selectedDevice?.longitude) {
        const coordKey = `${selectedDevice.latitude},${selectedDevice.longitude}`;
        // Check if the address for this coordinates is already in the cache

        if (addressCache[coordKey]) {
          setSelectedDevice((prev) => ({
            ...prev,
            address: addressCache[coordKey],
          }));
          return;
        }

        try {
          // If the address is not in the cache, call the function to fetch it using the coordinates

          const address = await getAddressFromCoordinates(
            selectedDevice.latitude,
            selectedDevice.longitude
          );
          // Cache the fetched address by storing it in the addressCache state
          setAddressCache((prev) => ({
            ...prev,
            [coordKey]: address,
          }));
          // Update the selectedDevice state to include the fetched address

          setSelectedDevice((prev) => ({
            ...prev,
            address,
          }));
        } catch (error) {
          console.error("Failed to fetch address:", error);
        }
      }
    };

    fetchAddress();
  }, [selectedDevice?.latitude, selectedDevice?.longitude, addressCache]);

  // Fetches devices and positions data, updates device status (online/offline), and sets device coordinates, speed, and last update time.
  // Handles errors and updates the loading and refreshing states accordingly.
  const fetchData = async () => {
    try {
      setRefreshing(true);
      const devicesData = await fetchDevices();
      const positionsData = await fetchPositions();

      const devicesWithPosition = devicesData.map((device) => {
        const position = positionsData.find(
          (pos) => pos.deviceId === device.id
        );

        const lastUpdateTime = position?.deviceTime
          ? new Date(position.deviceTime)
          : null;
        const isOnline =
          lastUpdateTime && new Date() - lastUpdateTime < 5 * 60 * 1000;

        return {
          ...device,
          latitude: position?.latitude,
          longitude: position?.longitude,
          lastUpdate: position?.deviceTime || device.lastUpdate,
          status: isOnline ? "online" : "offline",
          speed: position?.speed || 0,
          course: position?.course || 0,
        };
      });

      setDevices(devicesWithPosition);
      setFilteredDevices(devicesWithPosition);

      if (selectedDevice) {
        const updatedDevice = devicesWithPosition.find(
          (d) => d.id === selectedDevice.id
        );
        if (updatedDevice) setSelectedDevice(updatedDevice);
      }

      setLoading(false);
      setRefreshing(false);
      setError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(
        "Failed to fetch data. Please check if Traccar server is running."
      );
      setLoading(false);
      setRefreshing(false);
    }
  };
  //format time functions
  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return "Unknown";
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleString();
      // eslint-disable-next-line no-unused-vars
    } catch (e) {
      return dateTimeStr;
    }
  };

  // Clears the current search term, resetting the search input field.
  const clearSearch = () => setSearchTerm("");

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50">
      <div className="w-full md:w-1/3 lg:w-1/4 border-r border-gray-200 bg-white shadow-sm flex flex-col h-screen">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h1 className="text-xl font-semibold text-gray-800">
            Device Tracker
          </h1>
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
            title="Refresh data"
          >
            <RefreshCw
              size={18}
              className={`text-gray-600 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        <div className="p-3 border-b border-gray-200">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search devices..."
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                <X size={16} className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && !refreshing ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-blue-500 animate-spin mb-2"></div>
                <p className="text-gray-500">Loading devices...</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-4 m-4 bg-red-50 text-red-600 rounded-md border border-red-200">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
              <button
                onClick={fetchData}
                className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded"
              >
                Try Again
              </button>
            </div>
          ) : (
            filteredDevices.map((device) => (
              <div key={device.id}>
                <DeviceList
                  devices={[device]}
                  onSelect={setSelectedDevice}
                  selectedDevice={selectedDevice}
                />
                {selectedDevice && selectedDevice.id === device.id && (
                  <div className="m-4 p-4 border border-gray-200 rounded-lg bg-gray-50 shadow-sm">
                    <h3 className="font-bold text-lg mb-3 text-gray-800 border-b pb-2">
                      Device Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p className="flex justify-between">
                        <span className="font-medium text-gray-600">Name:</span>
                        <span className="text-gray-800">
                          {selectedDevice.name}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="font-medium text-gray-600">
                          Status:
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            selectedDevice.status === "online"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {selectedDevice.status || "unknown"}
                        </span>
                      </p>
                      {selectedDevice.latitude && selectedDevice.longitude && (
                        <>
                          <p className="flex justify-between">
                            <span className="font-medium text-gray-600">
                              Coordinates:
                            </span>
                            <span className="text-gray-800 truncate max-w-[150px]">
                              {selectedDevice.latitude.toFixed(6)},{" "}
                              {selectedDevice.longitude.toFixed(6)}
                            </span>
                          </p>
                          {selectedDevice.address && (
                            <p className="flex flex-col">
                              <span className="font-medium text-gray-600 mb-1">
                                Address:
                              </span>
                              <span className="text-gray-800 text-xs break-words">
                                {selectedDevice.address}
                              </span>
                            </p>
                          )}
                        </>
                      )}
                      <p className="flex justify-between">
                        <span className="font-medium text-gray-600">
                          Last Update:
                        </span>
                        <span className="text-gray-800">
                          {formatDateTime(selectedDevice.lastUpdate)}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="p-3 text-xs text-center text-gray-500 border-t border-gray-200">
          Last updated:{" "}
          {refreshing
            ? "Updating..."
            : formatDateTime(new Date().toISOString())}
        </div>
      </div>

      <div className="w-full md:w-2/3 lg:w-3/4 relative h-screen">
        {loading && !refreshing ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-12 w-12 rounded-full border-4 border-t-transparent border-blue-500 animate-spin mb-4"></div>
              <p className="text-gray-600">Loading map...</p>
            </div>
          </div>
        ) : (
          <Map devices={filteredDevices} selectedDevice={selectedDevice} />
        )}
      </div>
    </div>
  );
};

export default App;
