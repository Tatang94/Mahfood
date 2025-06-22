import type { Express } from "express";
import { storage } from "../storage";
import { authenticateToken } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_multer,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export function registerRestaurantRoutes(app: Express) {
  // Get restaurant profile by user ID - HANYA untuk restaurant yang login
  app.get('/api/restaurants/profile', authenticateToken, async (req, res) => {
    try {
      const authenticatedUserId = (req as any).user.userId;
      const userRole = (req as any).user.role;
      const requestedUserId = parseInt(req.query.userId as string);
      
      // Pastikan hanya restaurant role yang bisa akses
      if (userRole !== 'restaurant') {
        return res.status(403).json({ message: "Akses ditolak. Hanya restoran yang dapat mengakses." });
      }
      
      // Pastikan restaurant hanya bisa akses profil sendiri
      if (authenticatedUserId !== requestedUserId) {
        return res.status(403).json({ message: "Tidak dapat mengakses profil restoran lain." });
      }

      const restaurant = await storage.getRestaurantByUserId(authenticatedUserId);
      
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      res.json(restaurant);
    } catch (error) {
      
      res.status(500).json({ message: "Failed to fetch restaurant profile" });
    }
  });

  // Get orders for restaurant - HANYA untuk restaurant pemilik
  app.get('/api/orders/restaurant', authenticateToken, async (req, res) => {
    try {
      const restaurantId = parseInt(req.query.restaurantId as string);
      const authenticatedUserId = (req as any).user.userId;
      const userRole = (req as any).user.role;
      
      if (!restaurantId) {
        return res.status(400).json({ message: "Restaurant ID required" });
      }
      
      // Pastikan hanya restaurant role yang bisa akses
      if (userRole !== 'restaurant') {
        return res.status(403).json({ message: "Akses ditolak. Hanya restoran yang dapat mengakses." });
      }
      
      // Verifikasi kepemilikan restoran
      const restaurant = await storage.getRestaurantById(restaurantId);
      if (!restaurant || restaurant.userId !== authenticatedUserId) {
        return res.status(403).json({ message: "Tidak dapat mengakses pesanan restoran lain." });
      }

      const orders = await storage.getOrdersByRestaurant(restaurantId);
      
      // Add customer details and items to each order
      const ordersWithDetails = await Promise.all(orders.map(async (order) => {
        const items = await storage.getOrderItems(order.id);
        return {
          ...order,
          items: items.map(item => ({
            id: item.id,
            name: item.foodItemName || "Item",
            quantity: item.quantity,
            price: item.price,
            total: item.quantity * item.price
          }))
        };
      }));
      
      res.json(ordersWithDetails);
    } catch (error) {
      
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Update order status - HANYA restaurant pemilik yang bisa update status pesanan
  app.patch('/api/orders/:id/status', authenticateToken, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;
      const authenticatedUserId = (req as any).user.userId;
      const userRole = (req as any).user.role;
      
      const validStatuses = ["pending", "confirmed", "preparing", "ready", "delivering", "delivered", "cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Status tidak valid" });
      }
      
      // Pastikan hanya restaurant dan driver yang bisa update status
      if (!['restaurant', 'driver'].includes(userRole)) {
        return res.status(403).json({ message: "Akses ditolak." });
      }
      
      // Verifikasi kepemilikan order untuk restaurant
      if (userRole === 'restaurant') {
        const order = await storage.getOrderById(orderId);
        if (!order) {
          return res.status(404).json({ message: "Pesanan tidak ditemukan" });
        }
        
        const restaurant = await storage.getRestaurantById(order.restaurantId);
        if (!restaurant || restaurant.userId !== authenticatedUserId) {
          return res.status(403).json({ message: "Tidak dapat mengupdate pesanan restoran lain." });
        }
      }

      const order = await storage.updateOrderStatus(orderId, status);
      if (!order) {
        return res.status(404).json({ message: "Pesanan tidak ditemukan" });
      }
      
      res.json(order);
    } catch (error) {
      
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Get restaurant by ID
  app.get('/api/restaurants/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const restaurant = await storage.getRestaurantById(id);
      
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      res.json(restaurant);
    } catch (error) {
      
      res.status(500).json({ message: "Failed to fetch restaurant" });
    }
  });

  // Get restaurant orders
  app.get('/api/restaurants/:id/orders', async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      const orders = await storage.getOrdersByRestaurant(restaurantId);
      
      // Mock additional data that would come from joins
      const ordersWithDetails = orders.map(order => ({
        ...order,
        customerName: "Customer Name", // In real app, join with users table
        customerPhone: "081234567890",
        items: [
          { name: "Sample Item", quantity: 1, price: order.totalAmount }
        ]
      }));
      
      res.json(ordersWithDetails);
    } catch (error) {
      
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Get restaurant menu - HANYA untuk restaurant pemilik atau customer
  app.get('/api/restaurants/:id/menu', authenticateToken, async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      const authenticatedUserId = (req as any).user.userId;
      const userRole = (req as any).user.role;
      
      // Customer bisa lihat menu semua restoran, restaurant hanya menu sendiri
      if (userRole === 'restaurant') {
        const restaurant = await storage.getRestaurantById(restaurantId);
        if (!restaurant || restaurant.userId !== authenticatedUserId) {
          return res.status(403).json({ message: "Tidak dapat mengakses menu restoran lain." });
        }
      } else if (userRole !== 'customer') {
        return res.status(403).json({ message: "Akses ditolak." });
      }
      
      const menuItems = await storage.getFoodItemsByRestaurant(restaurantId);
      res.json(menuItems);
    } catch (error) {
      res.status(500).json({ message: "Gagal mengambil menu" });
    }
  });

  // Add menu item with photo upload
  app.post('/api/restaurants/:id/menu', upload.single('photo'), async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      const { name, description, price, categoryId } = req.body;
      
      let imageUrl = '';
      if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
      }
      
      const menuItem = {
        name,
        description,
        price: parseFloat(price),
        categoryId: parseInt(categoryId),
        restaurantId,
        imageUrl,
        ingredients: [] // Default empty array for ingredients
      };
      
      const newItem = await storage.createFoodItem(menuItem);
      res.status(201).json(newItem);
    } catch (error) {
      console.error('Error creating menu item:', error);
      res.status(500).json({ message: "Failed to create menu item" });
    }
  });

  // Update menu item
  app.patch('/api/restaurants/:restaurantId/menu/:itemId', async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      const updates = req.body;
      
      const updatedItem = await storage.updateFoodItem(itemId, updates);
      
      if (!updatedItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      
      res.json(updatedItem);
    } catch (error) {
      
      res.status(500).json({ message: "Failed to update menu item" });
    }
  });

  // Delete menu item
  app.delete('/api/restaurants/:restaurantId/menu/:itemId', async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      await storage.deleteFoodItem(itemId);
      res.status(204).send();
    } catch (error) {
      
      res.status(500).json({ message: "Failed to delete menu item" });
    }
  });

  // Update restaurant profile
  app.patch('/api/restaurants/:id', async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedRestaurant = await storage.updateRestaurant(restaurantId, updates);
      
      if (!updatedRestaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      res.json(updatedRestaurant);
    } catch (error) {
      
      res.status(500).json({ message: "Failed to update restaurant" });
    }
  });

  // Get restaurant stats - HANYA untuk restaurant pemilik
  app.get('/api/restaurants/:id/stats', authenticateToken, async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      const authenticatedUserId = (req as any).user.userId;
      const userRole = (req as any).user.role;
      
      // Pastikan hanya restaurant role yang bisa akses
      if (userRole !== 'restaurant') {
        return res.status(403).json({ message: "Akses ditolak. Hanya restoran yang dapat mengakses." });
      }
      
      // Verifikasi kepemilikan restoran
      const restaurant = await storage.getRestaurantById(restaurantId);
      if (!restaurant || restaurant.userId !== authenticatedUserId) {
        return res.status(403).json({ message: "Tidak dapat mengakses data restoran lain." });
      }
      
      const orders = await storage.getOrdersByRestaurant(restaurantId);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - today.getDay());
      
      const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const todayOrders = orders.filter(o => new Date(o.createdAt!) >= today);
      const thisWeekOrders = orders.filter(o => new Date(o.createdAt!) >= thisWeekStart);
      const thisMonthOrders = orders.filter(o => new Date(o.createdAt!) >= thisMonthStart);
      
      const todayRevenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const thisWeekRevenue = thisWeekOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const thisMonthRevenue = thisMonthOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      
      res.json({
        todayOrders: todayOrders.length,
        todayRevenue,
        thisWeekRevenue,
        thisMonthRevenue,
        totalOrders: restaurant?.totalOrders || 0
      });
    } catch (error) {
      
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });
}