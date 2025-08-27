// onlineStatusService.js
import axios from 'axios';
import { AppState } from 'react-native';
import { BASE_URL } from '../config';

// Function to set user online status via API
export const setUserOnline = async (userId, token) => {
  try {
    if (!userId || !token) {
      console.log('⚠️ Missing userId or token for online status update');
      return;
    }

    console.log('👤 Setting user online status via API:', userId);
    
    const response = await axios.post(
      `${BASE_URL}/api/users/online-status`,
      { is_online: true },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      console.log('✅ User online status updated successfully');
    } else {
      console.log('⚠️ Failed to update online status:', response.data.message);
    }
  } catch (error) {
    console.error('❌ Error updating online status:', error);
  }
};

// Function to set user offline status via API
export const setUserOffline = async (userId, token) => {
  try {
    if (!userId || !token) {
      console.log('⚠️ Missing userId or token for offline status update');
      return;
    }

    console.log('👤 Setting user offline status via API:', userId);
    
    const response = await axios.post(
      `${BASE_URL}/api/users/online-status`,
      { is_online: false },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      console.log('✅ User offline status updated successfully');
    } else {
      console.log('⚠️ Failed to update offline status:', response.data.message);
    }
  } catch (error) {
    console.error('❌ Error updating offline status:', error);
  }
};

// Function to handle app state changes
export const handleAppStateChange = async (nextAppState, userId, token) => {
  if (nextAppState === 'active' && userId && token) {
    // App came to foreground
    console.log('📱 App came to foreground, setting user online');
    await setUserOnline(userId, token);
  } else if (nextAppState === 'background' && userId && token) {
    // App went to background
    console.log('📱 App went to background, setting user offline');
    await setUserOffline(userId, token);
  }
};

// Function to handle app termination
export const handleAppTermination = async (userId, token) => {
  if (userId && token) {
    console.log('📱 App terminating, setting user offline');
    await setUserOffline(userId, token);
  }
};

// Initialize app state monitoring
export const initializeAppStateMonitoring = (userId, token) => {
  if (!userId || !token) {
    console.log('⚠️ Cannot initialize app state monitoring: missing userId or token');
    return null;
  }

  console.log('📱 Initializing app state monitoring for user:', userId);
  
  // Set up app state change listener
  const subscription = AppState.addEventListener('change', (nextAppState) => {
    handleAppStateChange(nextAppState, userId, token);
  });
  
  return subscription;
};
