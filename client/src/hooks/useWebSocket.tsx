import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface WebSocketMessage {
  type: string;
  data: any;
  orderId?: number;
  status?: string;
  restaurantId?: number;
}

export function useWebSocket(userType: 'customer' | 'restaurant' | 'driver', userId?: number) {
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  useEffect(() => {
    if (!userId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        
        if (wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: `join_${userType}`,
            [`${userType}Id`]: userId
          }));
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          
          // Handle different message types
          if (message.type === 'new_order' && userType === 'restaurant') {
            toast({
              title: "Pesanan Baru!",
              description: `Pesanan #${message.data.id} masuk dari pelanggan`,
            });
          } else if (message.type === 'order_status_update') {
            const statusText = getStatusText(message.status);
            toast({
              title: "Status Pesanan Diperbarui",
              description: `Pesanan #${message.orderId} - ${statusText}`,
            });
          } else if (message.type === 'driver_assigned' && userType === 'customer') {
            toast({
              title: "Driver Ditugaskan",
              description: "Driver sedang menuju restoran untuk mengambil pesanan Anda",
            });
          }
        } catch (error) {
          // Handle parsing errors silently
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
      };

      wsRef.current.onerror = () => {
        setIsConnected(false);
      };

    } catch (error) {
      setIsConnected(false);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [userId, userType, toast]);

  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  return {
    isConnected,
    lastMessage,
    sendMessage
  };
}

function getStatusText(status?: string): string {
  switch (status) {
    case 'pending': return 'Menunggu konfirmasi';
    case 'confirmed': return 'Dikonfirmasi restoran';
    case 'preparing': return 'Sedang dipersiapkan';
    case 'ready': return 'Siap diambil';
    case 'picked_up': return 'Sedang diantar';
    case 'delivered': return 'Berhasil diantar';
    case 'cancelled': return 'Dibatalkan';
    default: return status || 'Status tidak dikenal';
  }
}