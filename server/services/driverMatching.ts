import { storage } from "../storage";
import type { Driver, Restaurant, Order } from "@shared/schema";

interface DriverLocation {
  driverId: number;
  lat: number;
  lng: number;
  distance?: number;
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Parse coordinates from address string (fallback for demo)
function parseCoordinatesFromAddress(address: string): { lat: number; lng: number } {
  // Default Jakarta coordinates for demo
  const defaultCoords = { lat: -6.2088, lng: 106.8456 };
  
  // In real app, use geocoding service
  if (address.toLowerCase().includes('sudirman')) {
    return { lat: -6.2088, lng: 106.8230 };
  } else if (address.toLowerCase().includes('kemang')) {
    return { lat: -6.2615, lng: 106.8106 };
  } else if (address.toLowerCase().includes('senayan')) {
    return { lat: -6.2297, lng: 106.8075 };
  }
  
  return defaultCoords;
}

export class DriverMatchingService {
  private static instance: DriverMatchingService;
  private onlineDrivers: Map<number, DriverLocation> = new Map();

  static getInstance(): DriverMatchingService {
    if (!DriverMatchingService.instance) {
      DriverMatchingService.instance = new DriverMatchingService();
    }
    return DriverMatchingService.instance;
  }

  // Update driver location
  updateDriverLocation(driverId: number, lat: number, lng: number): void {
    this.onlineDrivers.set(driverId, { driverId, lat, lng });
  }

  // Remove driver from online list
  removeDriver(driverId: number): void {
    this.onlineDrivers.delete(driverId);
  }

  // Get driver current location
  getDriverLocation(driverId: number): DriverLocation | undefined {
    return this.onlineDrivers.get(driverId);
  }

  // Find nearest available drivers (GoJek style - 1km default)
  async findNearestDrivers(restaurantAddress: string, maxDistance: number = 1): Promise<DriverLocation[]> {
    try {
      // Get restaurant coordinates
      const restaurantCoords = parseCoordinatesFromAddress(restaurantAddress);
      
      // Get all online drivers with their locations
      const nearbyDrivers: DriverLocation[] = [];
      
      for (const [driverId, location] of this.onlineDrivers) {
        // Check if driver is actually online and available
        const driver = await storage.getDriverById(driverId);
        if (!driver || !driver.isOnline) {
          this.onlineDrivers.delete(driverId);
          continue;
        }

        // Calculate distance
        const distance = calculateDistance(
          restaurantCoords.lat, 
          restaurantCoords.lng,
          location.lat, 
          location.lng
        );

        if (distance <= maxDistance) {
          nearbyDrivers.push({
            ...location,
            distance
          });
        }
      }

      // Sort by distance (nearest first)
      nearbyDrivers.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      
      return nearbyDrivers.slice(0, 5); // Return top 5 nearest drivers
    } catch (error) {
      
      return [];
    }
  }

  // Auto-assign driver to order
  async autoAssignDriver(orderId: number): Promise<boolean> {
    try {
      const order = await storage.getOrderById(orderId);
      if (!order) return false;

      const restaurant = await storage.getRestaurantById(order.restaurantId);
      if (!restaurant) return false;

      // Find nearest drivers
      const nearestDrivers = await this.findNearestDrivers(restaurant.address);
      
      if (nearestDrivers.length === 0) {
        
        return false;
      }

      // Try to assign to the nearest driver
      const nearestDriver = nearestDrivers[0];
      const assignedOrder = await storage.assignDriver(orderId, nearestDriver.driverId);
      
      if (assignedOrder) {
        
        return true;
      }

      return false;
    } catch (error) {
      
      return false;
    }
  }

  // Real driver locations only - no demo data

  // Get all online drivers with their locations
  getOnlineDrivers(): DriverLocation[] {
    return Array.from(this.onlineDrivers.values());
  }
}