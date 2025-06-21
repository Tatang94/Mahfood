import type { Express } from "express";
import { storage } from "../storage";

export function registerDriverRoutes(app: Express) {
  // Get driver by ID
  app.get('/api/drivers/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const driver = await storage.getDriverById(id);
      
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
      
      res.json(driver);
    } catch (error) {
      
      res.status(500).json({ message: "Failed to fetch driver" });
    }
  });

  // Update driver status (online/offline)
  app.patch('/api/drivers/:id/status', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isOnline } = req.body;
      
      const driver = await storage.updateDriverStatus(id, isOnline);
      
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
      
      res.json(driver);
    } catch (error) {
      
      res.status(500).json({ message: "Failed to update driver status" });
    }
  });

  // Get driver earnings
  app.get('/api/drivers/:id/earnings', async (req, res) => {
    try {
      const driverId = parseInt(req.params.id);
      const earnings = await storage.getDriverEarnings(driverId);
      res.json(earnings);
    } catch (error) {
      
      res.status(500).json({ message: "Failed to fetch earnings" });
    }
  });

  // Get driver stats
  app.get('/api/drivers/:id/stats', async (req, res) => {
    try {
      const driverId = parseInt(req.params.id);
      const earnings = await storage.getDriverEarnings(driverId);
      const driver = await storage.getDriverById(driverId);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - today.getDay());
      
      const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const todayEarnings = earnings
        .filter(e => new Date(e.createdAt!) >= today)
        .reduce((sum, e) => sum + e.amount, 0);
        
      const thisWeekEarnings = earnings
        .filter(e => new Date(e.createdAt!) >= thisWeekStart)
        .reduce((sum, e) => sum + e.amount, 0);
        
      const thisMonthEarnings = earnings
        .filter(e => new Date(e.createdAt!) >= thisMonthStart)
        .reduce((sum, e) => sum + e.amount, 0);
      
      res.json({
        today: todayEarnings,
        thisWeek: thisWeekEarnings,
        thisMonth: thisMonthEarnings,
        totalDeliveries: driver?.totalDeliveries || 0
      });
    } catch (error) {
      
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Get available orders for drivers
  app.get('/api/orders/available', async (req, res) => {
    try {
      const orders = await storage.getAvailableOrders();
      
      // Mock additional data that would come from joins in a real implementation
      const ordersWithDetails = orders.map(order => ({
        ...order,
        customerName: "Customer Name", // In real app, join with users table
        customerPhone: "081234567890",
        restaurantName: "Restaurant Name", // In real app, join with restaurants table
        items: [
          { name: "Sample Item", quantity: 1, price: order.totalAmount }
        ]
      }));
      
      res.json(ordersWithDetails);
    } catch (error) {
      
      res.status(500).json({ message: "Failed to fetch available orders" });
    }
  });

  // Get active orders for driver
  app.get('/api/orders/active/:driverId', async (req, res) => {
    try {
      const driverId = parseInt(req.params.driverId);
      const orders = await storage.getOrdersByDriver(driverId);
      
      // Filter only active orders (not delivered/cancelled)
      const activeOrders = orders.filter(order => 
        !['delivered', 'cancelled'].includes(order.status)
      );
      
      // Mock additional data
      const ordersWithDetails = activeOrders.map(order => ({
        ...order,
        customerName: "Customer Name",
        customerPhone: "081234567890",
        restaurantName: "Restaurant Name",
        items: [
          { name: "Sample Item", quantity: 1, price: order.totalAmount }
        ]
      }));
      
      res.json(ordersWithDetails);
    } catch (error) {
      
      res.status(500).json({ message: "Failed to fetch active orders" });
    }
  });

  // Accept an order
  app.patch('/api/orders/:id/accept', async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { driverId } = req.body;
      
      const order = await storage.assignDriver(orderId, driverId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      
      res.status(500).json({ message: "Failed to accept order" });
    }
  });

  // Get driver current location
  app.get('/api/drivers/:id/location', async (req, res) => {
    try {
      const driverId = parseInt(req.params.id);
      
      // Get from DriverMatchingService real-time data
      const { DriverMatchingService } = await import('../services/driverMatching');
      const driverService = DriverMatchingService.getInstance();
      const location = driverService.getDriverLocation(driverId);
      
      if (!location) {
        return res.status(404).json({ message: "Driver location not found" });
      }
      
      res.json({ lat: location.lat, lng: location.lng });
    } catch (error) {
      
      res.status(500).json({ message: "Failed to fetch driver location" });
    }
  });

  // Update driver location
  app.post('/api/drivers/:id/location', async (req, res) => {
    try {
      const driverId = parseInt(req.params.id);
      const { lat, lng } = req.body;
      
      if (!lat || !lng) {
        return res.status(400).json({ message: "Latitude and longitude required" });
      }
      
      // Update in DriverMatchingService
      const { DriverMatchingService } = await import('../services/driverMatching');
      const driverService = DriverMatchingService.getInstance();
      driverService.updateDriverLocation(driverId, lat, lng);
      
      res.json({ message: "Location updated successfully", lat, lng });
    } catch (error) {
      
      res.status(500).json({ message: "Failed to update driver location" });
    }
  });
}