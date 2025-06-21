import { WebSocketServer, WebSocket } from "ws";
import type { Order, Restaurant, Driver } from "@shared/schema";
import { storage } from "../storage";

interface NotificationPayload {
  type: 'new_order' | 'driver_assignment' | 'order_status_update' | 'payment_received';
  orderId: number;
  restaurantId?: number;
  driverId?: number;
  message: string;
  data?: any;
  timestamp: string;
  playSound?: boolean;
}

export class NotificationService {
  private static instance: NotificationService;
  private wss: WebSocketServer | null = null;
  private connections: Map<string, Set<WebSocket>> = new Map();

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  setWebSocketServer(wss: WebSocketServer): void {
    this.wss = wss;
  }

  // Register connection for a specific role
  registerConnection(ws: WebSocket, role: string, userId?: number): void {
    const key = userId ? `${role}_${userId}` : role;
    
    if (!this.connections.has(key)) {
      this.connections.set(key, new Set());
    }
    
    this.connections.get(key)?.add(ws);

    ws.on('close', () => {
      this.connections.get(key)?.delete(ws);
      if (this.connections.get(key)?.size === 0) {
        this.connections.delete(key);
      }
    });
  }

  // Send notification to specific role or user
  private sendNotification(targetKey: string, notification: NotificationPayload): void {
    const connections = this.connections.get(targetKey);
    if (!connections) return;

    const message = JSON.stringify({
      type: 'notification',
      data: notification
    });

    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  // Notify restaurant about new order
  async notifyRestaurantNewOrder(order: Order): Promise<void> {
    try {
      const restaurant = await storage.getRestaurantById(order.restaurantId);
      if (!restaurant) return;

      const notification: NotificationPayload = {
        type: 'new_order',
        orderId: order.id,
        restaurantId: order.restaurantId,
        message: `Pesanan baru #${order.id} dengan total ${this.formatCurrency(order.totalAmount)}`,
        data: {
          order,
          restaurant,
          customerAddress: order.deliveryAddress,
          paymentMethod: order.paymentMethod
        },
        timestamp: new Date().toISOString(),
        playSound: true
      };

      // Send to specific restaurant
      this.sendNotification(`restaurant_${restaurant.userId}`, notification);
      
      // Send to all restaurant connections (dashboard)
      this.sendNotification('restaurant', notification);

      
    } catch (error) {
      
    }
  }

  // Notify drivers about available order
  async notifyNearbyDrivers(order: Order, driverIds: number[]): Promise<void> {
    try {
      const restaurant = await storage.getRestaurantById(order.restaurantId);
      if (!restaurant) return;

      for (const driverId of driverIds) {
        const driver = await storage.getDriverById(driverId);
        if (!driver) continue;

        const driverEarnings = Math.floor(order.deliveryFee * 0.8); // 80% for driver
        
        const notification: NotificationPayload = {
          type: 'new_order',
          orderId: order.id,
          driverId: driver.id,
          message: `🚗 Pesanan Baru Tersedia!\n📍 ${restaurant.name}\n💰 Tarif: ${this.formatCurrency(driverEarnings)}\n📦 Total: ${this.formatCurrency(order.totalAmount)}`,
          data: {
            order: {
              id: order.id,
              totalAmount: order.totalAmount,
              deliveryFee: order.deliveryFee,
              driverEarnings,
              deliveryAddress: order.deliveryAddress
            },
            restaurant: {
              name: restaurant.name,
              address: restaurant.address,
              phone: restaurant.phone
            },
            estimatedDistance: '< 1 km',
            timeLimit: 60, // 60 seconds to accept like GoJek
            priority: 'high'
          },
          timestamp: new Date().toISOString(),
          playSound: true
        };

        // Send to specific driver
        this.sendNotification(`driver_${driver.userId}`, notification);
      }

      // Send to all driver connections (dashboard)
      const notification: NotificationPayload = {
        type: 'driver_assignment',
        orderId: order.id,
        message: `Orderan baru tersedia dari ${restaurant.name}`,
        data: {
          order,
          restaurant: { name: restaurant.name, address: restaurant.address },
          deliveryAddress: order.deliveryAddress,
          totalAmount: order.totalAmount,
          deliveryFee: order.deliveryFee
        },
        timestamp: new Date().toISOString(),
        playSound: true
      };

      this.sendNotification('driver', notification);

      
    } catch (error) {
      
    }
  }

  // Notify about payment received
  async notifyPaymentReceived(order: Order): Promise<void> {
    try {
      const notification: NotificationPayload = {
        type: 'payment_received',
        orderId: order.id,
        message: `Pembayaran diterima untuk pesanan #${order.id}`,
        data: {
          orderId: order.id,
          amount: order.totalAmount,
          paymentMethod: order.paymentMethod
        },
        timestamp: new Date().toISOString(),
        playSound: false
      };

      // Notify restaurant
      this.sendNotification(`restaurant_${order.restaurantId}`, notification);
      this.sendNotification('restaurant', notification);

      
    } catch (error) {
      
    }
  }

  // Notify order status update
  async notifyOrderStatusUpdate(order: Order, oldStatus: string): Promise<void> {
    try {
      const statusMessages = {
        'confirmed': 'Pesanan dikonfirmasi restoran',
        'preparing': 'Pesanan sedang disiapkan',
        'ready': 'Pesanan siap diambil',
        'pickup': 'Pesanan sedang diambil driver',
        'delivering': 'Pesanan dalam perjalanan',
        'delivered': 'Pesanan telah sampai',
        'cancelled': 'Pesanan dibatalkan'
      };

      const notification: NotificationPayload = {
        type: 'order_status_update',
        orderId: order.id,
        message: statusMessages[order.status as keyof typeof statusMessages] || `Status pesanan diubah menjadi ${order.status}`,
        data: {
          orderId: order.id,
          oldStatus,
          newStatus: order.status,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString(),
        playSound: ['ready', 'pickup', 'delivering', 'delivered'].includes(order.status)
      };

      // Notify customer
      this.sendNotification(`customer_${order.customerId}`, notification);
      
      // Notify driver if assigned
      if (order.driverId) {
        this.sendNotification(`driver_${order.driverId}`, notification);
      }

      // Notify restaurant
      this.sendNotification(`restaurant_${order.restaurantId}`, notification);

      
    } catch (error) {
      
    }
  }

  // Utility method to format currency
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  // Get connection statistics
  getConnectionStats(): { [key: string]: number } {
    const stats: { [key: string]: number } = {};
    
    for (const [key, connections] of this.connections) {
      stats[key] = connections.size;
    }
    
    return stats;
  }
}