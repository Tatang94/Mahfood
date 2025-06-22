import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { db } from "./db";
import { storage } from "./storage";
import { insertCartItemSchema, insertUserSchema, insertOrderSchema, insertFoodItemSchema, orderItems } from "@shared/schema";
import { z } from "zod";
import { registerOrderRoutes } from "./routes/orders";
import { registerDriverRoutes } from "./routes/drivers";
import { registerRestaurantRoutes } from "./routes/restaurants";
import { registerAuthRoutes } from "./routes/auth";
import { registerWalletRoutes } from "./routes/wallet";
import { registerAdminRoutes } from "./routes/admin";
import { NotificationService } from "./services/notificationService";
import { DriverMatchingService } from "./services/driverMatching";

// Global WebSocket server variable
let wss: WebSocketServer;

export async function registerRoutes(app: Express): Promise<Server> {
  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      // Set cache headers for categories (static data)
      res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getCategoryById(id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  // Food Items
  app.get("/api/food-items", async (req, res) => {
    try {
      // Set cache headers for food items
      res.set('Cache-Control', 'public, max-age=180'); // 3 minutes
      
      const { category, popular, search } = req.query;
      
      let foodItems;
      if (search) {
        foodItems = await storage.searchFoodItems(search as string);
      } else if (popular === "true") {
        foodItems = await storage.getPopularFoodItems();
      } else if (category) {
        foodItems = await storage.getFoodItemsByCategory(parseInt(category as string));
      } else {
        foodItems = await storage.getFoodItems();
      }
      
      res.json(foodItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch food items" });
    }
  });

  app.get("/api/food-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const foodItem = await storage.getFoodItemById(id);
      if (!foodItem) {
        return res.status(404).json({ message: "Food item not found" });
      }
      res.json(foodItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch food item" });
    }
  });

  // Cart Items
  app.get("/api/cart", async (req, res) => {
    try {
      const sessionId = req.query.sessionId as string;
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }
      const cartItems = await storage.getCartItems(sessionId);
      
      // Fetch food item details for each cart item
      const cartWithDetails = await Promise.all(
        cartItems.map(async (cartItem) => {
          const foodItem = await storage.getFoodItemById(cartItem.foodItemId);
          return {
            ...cartItem,
            foodItem,
            restaurantId: foodItem?.restaurantId,
            total: foodItem ? foodItem.price * cartItem.quantity : 0
          };
        })
      );
      
      const subtotal = cartWithDetails.reduce((sum, item) => sum + item.total, 0);
      const shipping = 5000; // Fixed shipping cost
      const total = subtotal + shipping;
      
      res.json({
        items: cartWithDetails,
        subtotal,
        shipping,
        total,
        itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0)
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cart items" });
    }
  });

  app.post("/api/cart", async (req, res) => {
    try {
      const validatedData = insertCartItemSchema.parse(req.body);
      const cartItem = await storage.addToCart(validatedData);
      res.json(cartItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add item to cart" });
    }
  });

  app.patch("/api/cart/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { quantity } = req.body;
      
      if (quantity <= 0) {
        await storage.removeFromCart(id);
        return res.json({ message: "Item removed from cart" });
      }
      
      const cartItem = await storage.updateCartItem(id, quantity);
      if (!cartItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      res.json(cartItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.removeFromCart(id);
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove item from cart" });
    }
  });

  app.delete("/api/cart/clear/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      await storage.clearCart(sessionId);
      res.json({ message: "Cart cleared" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // Users Routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUserById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Orders Routes
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/customer", async (req, res) => {
    try {
      // Get customer ID from session/auth token
      const customerId = parseInt(req.query.customerId as string);
      if (!customerId) {
        return res.status(400).json({ message: "Customer ID is required" });
      }
      const orders = await storage.getOrdersByCustomer(customerId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer orders" });
    }
  });

  app.get("/api/orders/restaurant", async (req, res) => {
    try {
      const restaurantId = parseInt(req.query.restaurantId as string);
      if (!restaurantId) {
        return res.status(400).json({ message: "Restaurant ID is required" });
      }
      const orders = await storage.getOrdersByRestaurant(restaurantId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch restaurant orders" });
    }
  });

  app.get("/api/orders/driver/:driverId", async (req, res) => {
    try {
      const driverId = parseInt(req.params.driverId);
      const orders = await storage.getOrdersByDriver(driverId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch driver orders" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const { customerId, restaurantId, items, totalAmount, deliveryFee, deliveryAddress, customerNotes, paymentMethod } = req.body;
      
      // Get restaurant info for address
      const restaurant = await storage.getRestaurantById(Number(restaurantId));
      const restaurantAddress = restaurant?.address || "Jl. Malioboro No. 10, Yogyakarta";
      
      // Create order with proper schema
      const orderData = {
        customerId: Number(customerId),
        restaurantId: Number(restaurantId),
        totalAmount: Number(totalAmount),
        deliveryFee: Number(deliveryFee),
        deliveryAddress: String(deliveryAddress),
        restaurantAddress,
        customerNotes: customerNotes || "",
        paymentMethod: String(paymentMethod),
        status: "pending"
      };
      
      const order = await storage.createOrder(orderData);
      
      // Create order items
      if (items && items.length > 0) {
        for (const item of items) {
          await db.insert(orderItems).values({
            orderId: order.id,
            foodItemId: Number(item.foodItemId),
            quantity: Number(item.quantity),
            price: Number(item.price)
          });
        }
      }
      
      // Send notifications using notification service
      const notificationService = NotificationService.getInstance();
      const driverMatchingService = DriverMatchingService.getInstance();
      
      // Notify restaurant with sound
      await notificationService.notifyRestaurantNewOrder(order);
      
      // Send payment notification if already paid
      if (paymentMethod === 'taspay') {
        await notificationService.notifyPaymentReceived(order);
      }
      
      // Find and notify nearby drivers
      const nearbyDrivers = await driverMatchingService.findNearestDrivers(restaurantAddress);
      if (nearbyDrivers.length > 0) {
        const driverIds = nearbyDrivers.map(d => d.driverId);
        await notificationService.notifyNearbyDrivers(order, driverIds);
      }
      
      // Also broadcast via WebSocket for immediate UI updates
      if (wss) {
        const orderWithItems = {
          ...order,
          items: items,
          orderNumber: `ORD-${order.id.toString().padStart(4, '0')}`
        };
        
        wss.clients.forEach((client: any) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'new_order',
              data: orderWithItems,
              restaurantId: restaurantId,
              totalAmount: totalAmount
            }));
          }
        });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const order = await storage.updateOrderStatus(id, status);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Notify all connected clients about status change
      if (wss) {
        const orderUpdate = {
          type: 'order_status_update',
          data: order,
          orderId: order.id,
          status: status
        };
        
        wss.clients.forEach((client: any) => {
          if (client.readyState === WebSocket.OPEN) {
            // Send to restaurant if it's their order
            if (client.restaurantId === order.restaurantId || 
                client.customerId === order.customerId ||
                client.driverId === order.driverId) {
              client.send(JSON.stringify(orderUpdate));
            }
          }
        });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  app.patch("/api/orders/:id/assign-driver", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { driverId } = req.body;
      const order = await storage.assignDriver(orderId, driverId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to assign driver" });
    }
  });

  // Seller specific routes
  app.post("/api/seller/menu", async (req, res) => {
    try {
      const validatedData = insertFoodItemSchema.parse(req.body);
      const foodItem = await storage.createFoodItem(validatedData);
      res.json(foodItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create menu item" });
    }
  });

  app.get("/api/seller/stats", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      const foodItems = await storage.getFoodItems();
      
      const today = new Date().toDateString();
      const todayOrders = orders.filter(order => 
        new Date(order.createdAt || new Date()).toDateString() === today
      );
      
      const stats = {
        todayOrders: todayOrders.length,
        todayRevenue: todayOrders.reduce((sum, order) => sum + order.totalAmount, 0),
        activeMenus: foodItems.length,
        avgRating: 4.8 // Mock average rating
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Register auth routes
  registerAuthRoutes(app);
  
  // Register wallet routes
  registerWalletRoutes(app);
  
  // Register order routes
  registerOrderRoutes(app);
  
  // Register driver routes
  registerDriverRoutes(app);

  // Register admin routes
  registerAdminRoutes(app);
  
  // Restaurant profile endpoint
  app.get("/api/restaurants/profile", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
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

  // Main restaurants endpoint - get all restaurants
  app.get("/api/restaurants", async (req, res) => {
    try {
      const restaurants = await storage.getRestaurants();
      res.json(restaurants);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch restaurants" });
    }
  });

  // Main drivers endpoint - get all drivers
  app.get("/api/drivers", async (req, res) => {
    try {
      const drivers = await storage.getDrivers();
      res.json(drivers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch drivers" });
    }
  });

  // Register restaurant routes
  registerRestaurantRoutes(app);

  const httpServer = createServer(app);
  
  // Setup WebSocket server for real-time notifications
  wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Initialize services
  const notificationService = NotificationService.getInstance();
  const driverMatchingService = DriverMatchingService.getInstance();
  
  notificationService.setWebSocketServer(wss);
  // Real driver locations only - no demo initialization
  
  wss.on('connection', (ws: any) => {
    
    ws.on('message', (message: any) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle different message types
        if (data.type === 'join_restaurant') {
          ws.restaurantId = data.restaurantId;
          
          // Get notification service if available
          try {
            const notificationService = NotificationService.getInstance();
            notificationService.registerConnection(ws, 'restaurant', data.restaurantId);
          } catch (error) {
          }
        } else if (data.type === 'join_driver') {
          ws.driverId = data.driverId;
          
          try {
            const notificationService = NotificationService.getInstance();
            notificationService.registerConnection(ws, 'driver', data.driverId);
            
            // Update driver location if provided
            if (data.location) {
              const driverMatchingService = DriverMatchingService.getInstance();
              driverMatchingService.updateDriverLocation(
                data.driverId, 
                data.location.lat, 
                data.location.lng
              );
            }
          } catch (error) {
          }
        } else if (data.type === 'join_customer') {
          ws.customerId = data.customerId;
          
          try {
            const notificationService = NotificationService.getInstance();
            notificationService.registerConnection(ws, 'customer', data.customerId);
          } catch (error) {
          }
        } else if (data.type === 'update_driver_location') {
          // Update driver location - dengan validasi keamanan
          if (data.driverId && data.location && ws.driverId === data.driverId) {
            try {
              const { lat, lng } = data.location;
              
              // Validasi koordinat Indonesia
              const INDONESIA_BOUNDS = {
                north: 6.5, south: -11.5, west: 95.0, east: 141.0
              };
              
              if (lat >= INDONESIA_BOUNDS.south && lat <= INDONESIA_BOUNDS.north && 
                  lng >= INDONESIA_BOUNDS.west && lng <= INDONESIA_BOUNDS.east) {
                const driverMatchingService = DriverMatchingService.getInstance();
                driverMatchingService.updateDriverLocation(data.driverId, lat, lng);
              }
            } catch (error) {
            }
          }
        }
      } catch (error) {
      }
    });
    
    ws.on('close', () => {
      // Remove driver from online list if it was a driver connection
      if (ws.driverId) {
        driverMatchingService.removeDriver(ws.driverId);
      }
    });
  });
  
  return httpServer;
}
