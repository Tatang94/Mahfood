import { pgTable, text, serial, integer, boolean, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
});

export const foodItems = pgTable("food_items", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurants.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // in rupiah
  categoryId: integer("category_id").notNull(),
  imageUrl: text("image_url").notNull(),
  ingredients: text("ingredients").array().notNull(),
  isPopular: boolean("is_popular").default(false),
  isAvailable: boolean("is_available").default(true),
  rating: real("rating").default(0),
  prepTime: integer("prep_time").default(30), // in minutes
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  role: text("role").notNull().default("customer"), // customer, driver, restaurant, admin
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  vehicleType: text("vehicle_type").notNull(), // motorcycle, car
  vehicleNumber: text("vehicle_number").notNull(),
  isOnline: boolean("is_online").default(false),
  currentLocation: text("current_location"),
  totalEarnings: integer("total_earnings").default(0),
  rating: real("rating").default(5.0),
  totalDeliveries: integer("total_deliveries").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  rating: real("rating").default(5.0),
  totalOrders: integer("total_orders").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  isDefault: boolean("is_default").default(false),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurants.id),
  driverId: integer("driver_id").references(() => drivers.id),
  status: text("status").notNull().default("pending"), // pending, confirmed, preparing, ready, pickup, delivering, delivered, cancelled
  totalAmount: integer("total_amount").notNull(),
  deliveryFee: integer("delivery_fee").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  restaurantAddress: text("restaurant_address").notNull(),
  customerNotes: text("customer_notes"),
  paymentMethod: text("payment_method").notNull(),
  estimatedDeliveryTime: timestamp("estimated_delivery_time"),
  pickedUpAt: timestamp("picked_up_at"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const driverEarnings = pgTable("driver_earnings", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").notNull().references(() => drivers.id),
  orderId: integer("order_id").notNull().references(() => orders.id),
  amount: integer("amount").notNull(),
  type: text("type").notNull(), // delivery, bonus, tip
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  foodItemId: integer("food_item_id").notNull(),
  quantity: integer("quantity").notNull(),
  price: integer("price").notNull(),
});

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  foodItemId: integer("food_item_id").notNull(),
  quantity: integer("quantity").notNull(),
  sessionId: text("session_id").notNull(),
});

export const userWallets = pgTable("user_wallets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  balance: integer("balance").notNull().default(0),
  pin: text("pin").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const walletTransactions = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id").notNull().references(() => userWallets.id),
  orderId: integer("order_id").references(() => orders.id),
  type: text("type").notNull(), // topup, payment, refund
  amount: integer("amount").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"), // pending, completed, failed
  paymentMethod: text("payment_method"), // paydisini service code
  externalTransactionId: text("external_transaction_id"), // PayDisini unique_code
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export const insertFoodItemSchema = createInsertSchema(foodItems).omit({
  id: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertAddressSchema = createInsertSchema(addresses).omit({
  id: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export const insertDriverSchema = createInsertSchema(drivers).omit({
  id: true,
  createdAt: true,
});

export const insertRestaurantSchema = createInsertSchema(restaurants).omit({
  id: true,
  createdAt: true,
});

export const insertDriverEarningSchema = createInsertSchema(driverEarnings).omit({
  id: true,
  createdAt: true,
});

export const insertUserWalletSchema = createInsertSchema(userWallets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWalletTransactionSchema = createInsertSchema(walletTransactions).omit({
  id: true,
  createdAt: true,
});

export type Category = typeof categories.$inferSelect;
export type FoodItem = typeof foodItems.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
export type User = typeof users.$inferSelect;
export type Address = typeof addresses.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Driver = typeof drivers.$inferSelect;
export type Restaurant = typeof restaurants.$inferSelect;
export type DriverEarning = typeof driverEarnings.$inferSelect;
export type UserWallet = typeof userWallets.$inferSelect;
export type WalletTransaction = typeof walletTransactions.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertFoodItem = z.infer<typeof insertFoodItemSchema>;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertAddress = z.infer<typeof insertAddressSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;
export type InsertDriverEarning = z.infer<typeof insertDriverEarningSchema>;
export type InsertUserWallet = z.infer<typeof insertUserWalletSchema>;
export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
