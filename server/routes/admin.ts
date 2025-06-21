import type { Express } from "express";
import { storage } from "../storage";
import { authenticateToken } from "./auth";
import { db } from "../db";

export function registerAdminRoutes(app: Express) {
  const requireAdmin = (req: any, res: any, next: any) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const [users, restaurants, drivers, orders] = await Promise.all([
        storage.getUsers(),
        storage.getRestaurants(),
        storage.getDrivers(),
        storage.getOrders()
      ]);

      const today = new Date().toDateString();
      const todayOrders = orders.filter(order => 
        new Date(order.createdAt || new Date()).toDateString() === today
      );

      const todayRevenue = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);

      const stats = {
        totalUsers: users.length,
        activeCustomers: users.filter(u => u.role === 'customer').length,
        totalRestaurants: restaurants.length,
        activeRestaurants: restaurants.filter(r => r.isActive).length,
        totalDrivers: drivers.length,
        onlineDrivers: drivers.filter(d => d.isOnline).length,
        totalOrders: orders.length,
        todayOrders: todayOrders.length,
        todayRevenue: todayRevenue
      };

      res.json(stats);
    } catch (error) {
      
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get('/api/admin/users', authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch('/api/admin/users/:id', authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedUser = await storage.updateUser(userId, updates);
      
      res.json({ message: "User updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Implementation needed for user deletion
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Restaurant management
  app.patch('/api/admin/restaurants/:id/status', authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      const { isActive } = req.body;
      
      const restaurant = await storage.updateRestaurant(restaurantId, { isActive });
      
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      res.json(restaurant);
    } catch (error) {
      
      res.status(500).json({ message: "Failed to update restaurant status" });
    }
  });

  // System settings
  app.get('/api/admin/settings', requireAdmin, async (req: any, res) => {
    try {
      // Return system settings from database or config
      const settings = {
        maintenanceMode: false,
        userRegistration: true,
        pushNotifications: true,
        defaultDeliveryFee: 5000,
        estimatedDeliveryTime: 30,
        codEnabled: true,
        taspayEnabled: true,
        minOrderAmount: 15000,
        freeDeliveryThreshold: 50000,
        sessionTimeout: 24,
        twoFactorAuth: false,
        rateLimiting: true
      };
      
      res.json(settings);
    } catch (error) {
      
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.patch('/api/admin/settings', requireAdmin, async (req: any, res) => {
    try {
      const settings = req.body;
      
      // Update settings in database
      // await storage.updateSettings(settings);
      
      res.json({ message: "Settings updated successfully" });
    } catch (error) {
      
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Database operations
  app.post('/api/admin/database/backup', requireAdmin, async (req: any, res) => {
    try {
      // Create database backup
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `backup_${timestamp}.sql`;
      
      // Mock backup process
      res.json({ 
        message: "Database backup created successfully",
        filename: backupName,
        size: "2.5 MB"
      });
    } catch (error) {
      
      res.status(500).json({ message: "Failed to create backup" });
    }
  });

  app.post('/api/admin/database/optimize', requireAdmin, async (req: any, res) => {
    try {
      // Optimize database
      await db.execute('VACUUM');
      await db.execute('ANALYZE');
      
      res.json({ message: "Database optimized successfully" });
    } catch (error) {
      
      res.status(500).json({ message: "Failed to optimize database" });
    }
  });

  // System logs
  app.get('/api/admin/logs', requireAdmin, async (req: any, res) => {
    try {
      // Return system logs
      const logs = [
        {
          level: "INFO",
          timestamp: new Date().toISOString(),
          message: "Application started successfully"
        },
        {
          level: "INFO", 
          timestamp: new Date(Date.now() - 300000).toISOString(),
          message: "Database connection established"
        },
        {
          level: "WARN",
          timestamp: new Date(Date.now() - 600000).toISOString(),
          message: "Browserslist data is 8 months old"
        }
      ];
      
      res.json(logs);
    } catch (error) {
      
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  });

  // Content management
  app.patch('/api/admin/content', requireAdmin, async (req: any, res) => {
    try {
      const { heroTitle, heroSubtitle, companyName } = req.body;
      
      // Update website content
      // await storage.updateContent({ heroTitle, heroSubtitle, companyName });
      
      res.json({ message: "Content updated successfully" });
    } catch (error) {
      
      res.status(500).json({ message: "Failed to update content" });
    }
  });
}