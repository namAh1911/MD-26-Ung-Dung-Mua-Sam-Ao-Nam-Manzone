// src/SocketProvider.tsx
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
        console.log("👤 [SocketProvider] Current user:", user);

        if (!user) {
            if (socket.connected) {
                socket.disconnect();
                console.log("🔌 Socket disconnected vì không có user");
            }
            return;
        }

        if (!socket.connected) {
            console.log("🔄 Đang connect socket tới server...");
            socket.connect();
        }

        const handleConnect = () => {
            console.log("🟢 Socket connected:", socket.id, "for user", user.id);
            socket.emit("register", user.id);
        };

        const handleDisconnect = (reason: string) => {
            console.warn("⚠️ Socket disconnected:", reason);
        };

        const handleConnectError = (err: any) => {
            console.error("❌ Socket connect error:", err.message);
        };

        const handleOrderUpdate = async (data: any) => {
            console.log("📦 App nhận orderStatusUpdated:", data);

            // Local notification
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "🔔 Cập nhật đơn hàng",
                    body: `Đơn hàng #${data.orderId.slice(-6)} (${data.productName || "Sản phẩm"}) → ${data.newStatus}`,
                    sound: "default",
                },
                trigger: null,
            });

            // Add trực tiếp vào context để badge nhảy số
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

            fetchNotifications?.(); // Sync DB
        };

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("connect_error", handleConnectError);
        socket.on("orderStatusUpdated", handleOrderUpdate);

        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("connect_error", handleConnectError);
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
