// socket.js
import { io } from 'socket.io-client';
import { SOCKET_CONFIG, SOCKET_URL } from './config';

// Create socket instance with improved configuration
export const socket = io(SOCKET_URL, {
  ...SOCKET_CONFIG,
  // Additional mobile-specific settings
  forceNew: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  // Better error handling for mobile
  autoUnref: false,
  // Debug mode in development
  debug: __DEV__
});

// Connection event handlers
socket.on('connect', () => {
  console.log('🔌 Socket connected:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Socket disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.error('🔌 Socket connection error:', error);
  // Try to reconnect on connection error
  if (socket.connected === false) {
    console.log('🔄 Attempting to reconnect...');
  }
});

socket.on('reconnect', (attemptNumber) => {
  console.log('🔌 Socket reconnected after', attemptNumber, 'attempts');
});

socket.on('reconnect_error', (error) => {
  console.error('🔌 Socket reconnection error:', error);
});

socket.on('reconnect_failed', () => {
  console.error('🔌 Socket reconnection failed');
});

// Chat event handlers
socket.on('newMessage', (data) => {
  console.log('📱 New message received:', data);
});

socket.on('userTyping', (data) => {
  console.log('⌨️ User typing indicator:', data);
});

// Admin chat specific events
socket.on('newAdminMessage', (data) => {
  console.log('📱 New admin message received:', data);
});

socket.on('adminTyping', (data) => {
  console.log('⌨️ Admin typing indicator:', data);
});

socket.on('newUserMessage', (data) => {
  console.log('👤 New user message for admin:', data);
});

socket.on('userTypingInAdminChat', (data) => {
  console.log('⌨️ User typing in admin chat:', data);
});

socket.on('newAdminChatSession', (data) => {
  console.log('🆕 New admin chat session:', data);
});

// NEW: Message confirmation events
socket.on('messageSent', (data) => {
  console.log('✅ Message sent confirmation:', data);
});

// NEW: Admin response events
socket.on('adminResponse', (data) => {
  console.log('👨‍💼 Admin response received:', data);
});

// Error handling
socket.on('error', (error) => {
  console.error('🔌 Socket error:', error);
});

// Connection state monitoring
setInterval(() => {
  if (socket.connected === false) {
    console.log('🔌 Socket connection status: Disconnected');
  }
}, 30000); // Check every 30 seconds

export default socket;
