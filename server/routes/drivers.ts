import type { Express } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { drivers, users, driverEarnings, orders, userWallets, walletTransactions } from "@shared/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

export function registerDriverRoutes(app: Express) {
  // Get driver profile by user ID
  app.get('/api/drivers/me', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: "Authorization required" });
      }

      // In real app, decode JWT token to get user ID
      // For now, we'll use a simple approach
      const userId = req.query.userId || 1; // Fallback for testing
      
      const driver = await db
        .select()
        .from(drivers)
        .leftJoin(users, eq(drivers.userId, users.id))
        .where(eq(drivers.userId, Number(userId)))
        .limit(1);

      if (!driver.length) {
        return res.status(404).json({ message: "Driver not found" });
      }

      res.json(driver[0].drivers);
    } catch (error) {
      console.error('Error fetching driver profile:', error);
      res.status(500).json({ message: "Failed to fetch driver profile" });
    }
  });

  // Update driver profile
  app.put('/api/drivers/profile', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: "Authorization required" });
      }

      const { name, phone, vehicleType, vehicleNumber } = req.body;
      const userId = req.body.userId || 1; // In real app, get from JWT

      // Update user table
      if (name) {
        await db
          .update(users)
          .set({ name, phone })
          .where(eq(users.id, Number(userId)));
      }

      // Update driver table
      const updatedDriver = await db
        .update(drivers)
        .set({ 
          vehicleType: vehicleType || 'motorcycle',
          vehicleNumber: vehicleNumber || 'B 1234 CD'
        })
        .where(eq(drivers.userId, Number(userId)))
        .returning();

      res.json(updatedDriver[0]);
    } catch (error) {
      console.error('Error updating driver profile:', error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Get driver orders
  app.get('/api/orders/driver', async (req, res) => {
    try {
      const userId = req.query.userId || 1;
      
      // Get driver ID from user ID
      const driver = await db
        .select()
        .from(drivers)
        .where(eq(drivers.userId, Number(userId)))
        .limit(1);

      if (!driver.length) {
        return res.json([]);
      }

      const driverOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.driverId, driver[0].id))
        .orderBy(desc(orders.createdAt));

      res.json(driverOrders);
    } catch (error) {
      console.error('Error fetching driver orders:', error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Withdraw earnings
  app.post('/api/drivers/withdraw', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: "Authorization required" });
      }

      const { amount } = req.body;
      const userId = req.body.userId || 1;

      // Get driver
      const driver = await db
        .select()
        .from(drivers)
        .where(eq(drivers.userId, Number(userId)))
        .limit(1);

      if (!driver.length) {
        return res.status(404).json({ message: "Driver not found" });
      }

      const currentEarnings = driver[0].totalEarnings;
      if (amount > currentEarnings) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Update driver earnings
      await db
        .update(drivers)
        .set({ totalEarnings: currentEarnings - amount })
        .where(eq(drivers.id, driver[0].id));

      // Create earnings record
      await db.insert(driverEarnings).values({
        driverId: driver[0].id,
        orderId: 0, // Withdrawal record
        amount: -amount,
        type: 'withdrawal'
      });

      res.json({ message: "Withdrawal successful", newBalance: currentEarnings - amount });
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      res.status(500).json({ message: "Failed to process withdrawal" });
    }
  });

  // Get driver wallet
  app.get('/api/drivers/wallet', async (req, res) => {
    try {
      const userId = req.query.userId || 1;
      
      const wallet = await db
        .select()
        .from(userWallets)
        .where(eq(userWallets.userId, Number(userId)))
        .limit(1);

      if (!wallet.length) {
        return res.json({ balance: 0, isActive: false });
      }

      // Get transaction history
      const transactions = await db
        .select()
        .from(walletTransactions)
        .where(eq(walletTransactions.walletId, wallet[0].id))
        .orderBy(desc(walletTransactions.createdAt))
        .limit(20);

      res.json({
        ...wallet[0],
        transactions
      });
    } catch (error) {
      console.error('Error fetching wallet:', error);
      res.status(500).json({ message: "Failed to fetch wallet" });
    }
  });

  // Update driver settings
  app.put('/api/drivers/settings', async (req, res) => {
    try {
      const { notifications, workingHours, location } = req.body;
      const userId = req.body.userId || 1;

      // In a real app, store these in a driver_settings table
      // For now, we'll just return success
      res.json({ 
        message: "Settings updated successfully",
        settings: {
          notifications,
          workingHours,
          location
        }
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Get driver earnings statistics
  app.get('/api/drivers/earnings/stats', async (req, res) => {
    try {
      const userId = req.query.userId || 1;
      
      const driver = await db
        .select()
        .from(drivers)
        .where(eq(drivers.userId, Number(userId)))
        .limit(1);

      if (!driver.length) {
        return res.json({ today: 0, week: 0, month: 0, total: 0 });
      }

      const earnings = await db
        .select()
        .from(driverEarnings)
        .where(eq(driverEarnings.driverId, driver[0].id))
        .orderBy(desc(driverEarnings.createdAt));

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const todayEarnings = earnings
        .filter(e => new Date(e.createdAt!) >= today && e.amount > 0)
        .reduce((sum, e) => sum + e.amount, 0);

      const weekEarnings = earnings
        .filter(e => new Date(e.createdAt!) >= weekStart && e.amount > 0)
        .reduce((sum, e) => sum + e.amount, 0);

      const monthEarnings = earnings
        .filter(e => new Date(e.createdAt!) >= monthStart && e.amount > 0)
        .reduce((sum, e) => sum + e.amount, 0);

      const totalEarnings = earnings
        .filter(e => e.amount > 0)
        .reduce((sum, e) => sum + e.amount, 0);

      res.json({
        today: todayEarnings,
        week: weekEarnings,
        month: monthEarnings,
        total: totalEarnings,
        transactions: earnings.slice(0, 10)
      });
    } catch (error) {
      console.error('Error fetching earnings stats:', error);
      res.status(500).json({ message: "Failed to fetch earnings statistics" });
    }
  });
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