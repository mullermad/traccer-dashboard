import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const EMAIL = import.meta.env.VITE_EMAIL;
const PASSWORD = import.meta.env.VITE_PASSWORD;

// Combine email and password  to create authorization header
const AUTH_CREDENTIALS = btoa(`${EMAIL}:${PASSWORD}`);

// Create an axios instance with default config
const traccarApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Basic ${AUTH_CREDENTIALS}`,
    "Content-Type": "application/json",
  },
});

export const fetchDevices = async () => {
  try {
    const response = await traccarApi.get("/devices");
    console.log("Devices fetched successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching devices:", error.message);
    throw new Error(error.response?.data?.message || "Failed to fetch devices");
  }
};

export const fetchPositions = async () => {
  try {
    const response = await traccarApi.get("/positions");
    console.log("Positions fetched successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching positions:", error.message);
    throw new Error(
      error.response?.data?.message || "Failed to fetch positions"
    );
  }
};

// Reverse geocoding to get address from coordinates
export const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse`,
      {
        params: {
          format: "json",
          lat: latitude,
          lon: longitude,
          zoom: 18,
          addressdetails: 1,
        },
      }
    );

    return response.data.display_name || "Unknown location";
  } catch (error) {
    console.error("Error fetching address:", error.message);
    return "Address lookup failed";
  }
};
