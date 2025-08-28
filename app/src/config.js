
const isDevelopment = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production';
const isProduction = !isDevelopment;

// Manual IP selection - change this value to switch between IPs
// Options: '192.168.1.2', '192.168.1.9', 'localhost'
const SELECTED_IP = '192.168.1.9';

// Function to get the best available local IP
const getLocalBaseURL = () => {
  const localIPs = {
    '192.168.1.2': 'http://192.168.1.2:5001',
    '192.168.1.9': 'http://192.168.1.9:5001',
    'localhost': 'http://localhost:5001'
  };
  
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Try to detect which IP is working by checking the current location
    const currentHost = window.location.hostname;
    const currentPort = window.location.port;
    
    // If we're already on one of the local IPs, use it
    if (currentHost === '192.168.1.2' || currentHost === '192.168.1.9') {
      return `http://${currentHost}:5001`;
    }
    
    // For development, try to use the same host as the current page
    if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
      return `http://${currentHost}:5001`;
    }
  }
  
  // Use manually selected IP or fallback to first IP
  return localIPs[SELECTED_IP] || localIPs['192.168.1.2'];
};

// Base URL for API calls
export const BASE_URL = isProduction 
  ? 'https://mazonepoly-server.onrender.com'
  : getLocalBaseURL();

// Socket URL for real-time communication
export const SOCKET_URL = isProduction
  ? 'https://mazonepoly-server.onrender.com'
  : getLocalBaseURL();

// API endpoints
export const API_ENDPOINTS = {
  CHAT: '/api/chat',
  AUTH: '/api/auth',
  PRODUCTS: '/api/products',
  ORDERS: '/api/orders',
  USERS: '/api/users',
  ADMIN: '/api/admin'
};

// Socket configuration
export const SOCKET_CONFIG = {
  transports: ['websocket'],
  autoConnect: false,
  timeout: 10000,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
};
