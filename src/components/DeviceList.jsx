"use client";

const DeviceList = ({ devices, onSelect, selectedDevice }) => {
  if (!devices || devices.length === 0) {
    return null;
  }

  // Helper function to format time as "X minutes ago"
  function formatTimeAgo(dateTimeStr) {
    if (!dateTimeStr) return "Unknown";

    try {
      const date = new Date(dateTimeStr);
      const now = new Date();
      const diffMs = now - date;
      const diffSec = Math.floor(diffMs / 1000);

      if (diffSec < 60) return "Just now";
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return `${Math.floor(diffSec / 86400)}d ago`;
      // eslint-disable-next-line no-unused-vars
    } catch (e) {
      return "Unknown";
    }
  }
  return (
    <div className="divide-y divide-gray-100">
      {devices.map((device) => (
        <div
          key={device.id}
          onClick={() => onSelect(device)}
          className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
            selectedDevice?.id === device.id
              ? "bg-blue-50 border-l-4 border-blue-500"
              : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="font-medium">{device.name}</div>
            <div
              className={`w-2 h-2 rounded-full ${
                device.status === "online" ? "bg-green-500" : "bg-gray-300"
              }`}
            ></div>
          </div>

          <div className="mt-1 text-sm text-gray-500 flex items-center justify-between">
            <span>
              {device.latitude && device.longitude
                ? `${device.latitude.toFixed(4)}, ${device.longitude.toFixed(
                    4
                  )}`
                : "No location data"}
            </span>
            <span className="text-xs text-gray-400">
              {formatTimeAgo(device.lastUpdate)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DeviceList;
