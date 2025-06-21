import { useState, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';

interface Notification {
  type: 'new_order' | 'driver_assignment' | 'order_status_update' | 'payment_received';
  orderId: number;
  restaurantId?: number;
  driverId?: number;
  message: string;
  data?: any;
  timestamp: string;
  playSound?: boolean;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Return early if user is not available
  if (!user) {
    return {
      notifications: [],
      isConnected: false,
      clearNotifications: () => {},
      markAsRead: () => {},
      requestNotificationPermission: async () => {},
      updateDriverLocation: () => {},
      playNotificationSound: () => {}
    };
  }

  // Initialize audio for notifications
  useEffect(() => {
    audioRef.current = new Audio('/notification-sound.mp3');
    audioRef.current.preload = 'auto';
    audioRef.current.volume = 0.8;
  }, []);

  // Play notification sound
  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  // Connect to WebSocket
  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      
      // Join appropriate room based on user role
      const joinMessage = {
        type: `join_${user.role}`,
        [`${user.role}Id`]: user.id,
        userId: user.id
      };
      
      ws.send(JSON.stringify(joinMessage));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'notification') {
          const notification = message.data as Notification;
          
          // Add to notifications list
          setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50
          
          // Play sound if requested
          if (notification.playSound) {
            playNotificationSound();
          }
          
          // Show browser notification if permission granted
          if (Notification.permission === 'granted') {
            new Notification(`FoodDelivery - ${notification.message}`, {
              icon: '/icon-192.png',
              body: notification.message,
              tag: `order-${notification.orderId}`
            });
          }
        }
      } catch (error) {
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      
      // Reconnect after 3 seconds
      setTimeout(() => {
        if (user) {
          // Reconnect logic here if needed
        }
      }, 3000);
    };

    ws.onerror = (error) => {
      setIsConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [user]);

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  // Clear notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Mark notification as read
  const markAsRead = (timestamp: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.timestamp === timestamp 
          ? { ...notif, read: true } 
          : notif
      )
    );
  };

  // Update driver location (for drivers)
  const updateDriverLocation = (lat: number, lng: number) => {
    if (wsRef.current && user?.role === 'driver') {
      const message = {
        type: 'update_driver_location',
        driverId: user.id,
        location: { lat, lng }
      };
      
      wsRef.current.send(JSON.stringify(message));
    }
  };

  return {
    notifications,
    isConnected,
    clearNotifications,
    markAsRead,
    requestNotificationPermission,
    updateDriverLocation,
    playNotificationSound
  };
}