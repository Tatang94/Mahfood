import type { Express } from "express";
import { storage } from "../storage";
import { insertOrderSchema, insertOrderItemSchema } from "@shared/schema";
import { z } from "zod";

export function registerOrderRoutes(app: Express) {
  // Get all orders for seller
  app.get("/api/seller/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Update order status (for seller)
  app.patch("/api/seller/orders/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      const validStatuses = ["pending", "confirmed", "preparing", "ready", "delivering", "delivered", "cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const order = await storage.updateOrderStatus(id, status);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Get orders by driver
  app.get("/api/driver/orders", async (req, res) => {
    try {
      const { driverId } = req.query;
      if (!driverId) {
        return res.status(400).json({ message: "Driver ID required" });
      }
      
      const orders = await storage.getOrdersByDriver(parseInt(driverId as string));
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch driver orders" });
    }
  });

  // Get available orders for drivers
  app.get("/api/driver/available-orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      // Filter orders that are ready and don't have assigned driver
      const availableOrders = orders.filter(order => 
        order.status === "ready" && !order.driverId
      );
      res.json(availableOrders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch available orders" });
    }
  });

  // Accept order (for driver)
  app.patch("/api/driver/orders/:id/accept", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { driverId } = req.body;
      
      if (!driverId) {
        return res.status(400).json({ message: "Driver ID required" });
      }

      const order = await storage.assignDriver(orderId, driverId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Update status to delivering
      await storage.updateOrderStatus(orderId, "delivering");
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to accept order" });
    }
  });
}