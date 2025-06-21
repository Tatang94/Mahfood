import type { Express } from "express";
import { storage } from "../storage";

export function registerRestaurantRoutes(app: Express) {
  // Get restaurant profile by user ID
  app.get('/api/restaurants/profile', async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }

      const restaurant = await storage.getRestaurantByUserId(userId);
      
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      res.json(restaurant);
    } catch (error) {
      
      res.status(500).json({ message: "Failed to fetch restaurant profile" });
    }
  });

  // Get orders for restaurant
  app.get('/api/orders/restaurant', async (req, res) => {
    try {
      const restaurantId = parseInt(req.query.restaurantId as string);
      if (!restaurantId) {
        return res.status(400).json({ message: "Restaurant ID required" });
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

  // Update order status
  app.patch('/api/orders/:id/status', async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;
      
      const validStatuses = ["pending", "confirmed", "preparing", "ready", "delivering", "delivered", "cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const order = await storage.updateOrderStatus(orderId, status);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
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

  // Get restaurant menu
  app.get('/api/restaurants/:id/menu', async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      const menuItems = await storage.getFoodItemsByRestaurant(restaurantId);
      res.json(menuItems);
    } catch (error) {
      
      res.status(500).json({ message: "Failed to fetch menu" });
    }
  });

  // Add menu item
  app.post('/api/restaurants/:id/menu', async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      const menuItem = { ...req.body, restaurantId };
      
      const newItem = await storage.createFoodItem(menuItem);
      res.status(201).json(newItem);
    } catch (error) {
      
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

  // Get restaurant stats
  app.get('/api/restaurants/:id/stats', async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      const orders = await storage.getOrdersByRestaurant(restaurantId);
      const restaurant = await storage.getRestaurantById(restaurantId);
      
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