// socket.js
import { io } from 'socket.io-client';

export const socket = io('http://192.168.0.101:5001', {
  transports: ['websocket'],
  autoConnect: false,
});
