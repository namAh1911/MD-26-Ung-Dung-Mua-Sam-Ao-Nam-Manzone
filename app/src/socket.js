// socket.js
import { io } from 'socket.io-client';

export const socket = io('http://192.168.1.9:5000', {
  transports: ['websocket'],
  autoConnect: false,
});
