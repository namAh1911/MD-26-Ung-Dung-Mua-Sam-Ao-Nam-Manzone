// SocketProvider.tsx
import React, { createContext, useContext, useEffect } from "react";
import { socket } from "./socket";
import { useAuth } from "./AuthContext";
import * as Notifications from "expo-notifications";
import { Socket } from "socket.io-client";
import { useNotifications } from "./NotificationContext";

// Config notification
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true, // iOS
    shouldShowList: true,   // iOS
  }),
});


const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { fetchNotifications, addNotification } = useNotifications();

  useEffect(() => {
    if (!user) {
      if (socket.connected) socket.disconnect();
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }

    const handleConnect = () => {
      console.log("🟢 Socket connected:", socket.id);
      socket.emit("register", user.id);
    };

    const handleOrderUpdate = async (data: any) => {
      console.log("📦 Đơn hàng cập nhật:", data);

      // Local notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🔔 Cập nhật đơn hàng",
          body: `Đơn hàng của bạn #${data.orderId.slice(-6)} → ${data.newStatus}`,
          sound: "default",
        },
        trigger: null,
      });

      //  Add trực tiếp vào context để badge nhảy số
      addNotification({
        _id: Date.now().toString(), // tạm id local
        message: `Đơn hàng #${data.orderId.slice(-6)} → ${data.newStatus}`,
        read: false,
        createdAt: new Date().toISOString(),
        order_id: data.orderId,
        image: data.image || "",
        title: "Cập nhật đơn hàng",
        productName: data.productName || "",
      });

      // Fetch lại từ server (đảm bảo sync DB)
      fetchNotifications?.();
    };

    socket.on("connect", handleConnect);
    socket.on("orderStatusUpdated", handleOrderUpdate);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("orderStatusUpdated", handleOrderUpdate);
    };
  }, [user, fetchNotifications, addNotification]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket phải nằm trong <SocketProvider>");
  return ctx;
};
