// src/NotificationContext.tsx
import React, { createContext, useContext, useState, useCallback } from "react";
import axios from "axios";
import { BASE_URL } from "./config";
import { useAuth } from "./AuthContext";

export interface Notification {
  _id: string;
  message: string;
  read: boolean;
  createdAt: string;
  image?: string;
  title?: string;
  productName?: string;
  order_id: string;
}

interface NotificationContextType {
  notifications: Notification[];
  fetchNotifications: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  unreadCount: number; //  thêm vào context
  addNotification: (noti: Notification) => void; //  thêm tiện cho socket
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch tất cả notifications từ server
  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/notifications/my-notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data || []);
    } catch (err) {
      console.error("❌ Lỗi khi fetch notifications:", err);
    }
  }, [token]);

  // Mark tất cả thành đã đọc
  const markAllAsRead = useCallback(async () => {
    if (!token) return;
    try {
      await axios.put(
        `${BASE_URL}/api/notifications/mark-all-read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("❌ Lỗi khi mark-all-read:", err);
    }
  }, [token]);

  // tiện cho socket: add vào danh sách
  const addNotification = (noti: Notification) => {
    setNotifications((prev) => [noti, ...prev]);
  };

  // đếm số chưa đọc
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        fetchNotifications,
        markAllAsRead,
        setNotifications,
        unreadCount,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications phải dùng trong <NotificationProvider>");
  return ctx;
};
