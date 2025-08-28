// app/src/services/password.ts
import axios from 'axios';
import { BASE_URL } from '../config';

export const sendOtp = (email: string) =>
  axios.post(`${BASE_URL}/api/admin/send-otp`, { email: email.trim().toLowerCase() });

export const resetPassword = (email: string, code: string, newPassword: string) =>
  axios.post(`${BASE_URL}/api/admin/reset-password`, {
    email: email.trim().toLowerCase(),
    code: code.trim(),
    newPassword,
  });
