import { 
  categories, 
  foodItems, 
  cartItems,
  users,
  addresses,
  orders,
  orderItems,
  drivers,
  restaurants,
  driverEarnings,
  type Category, 
  type FoodItem, 
  type CartItem,
  type User,
  type Address,
  type Order,
  type OrderItem,
  type Driver,
  type Restaurant,
  type DriverEarning,
  type InsertCategory,
  type InsertFoodItem,
  type InsertCartItem,
  type InsertUser,
  type InsertAddress,
  type InsertOrder,
  type InsertOrderItem,
  type InsertDriver,
  type InsertRestaurant,
  type InsertDriverEarning
} from "@shared/schema";
import { db } from "./db";
import { eq, and, ilike, desc } from "drizzle-orm";

export interface IStorage {
  // Categories
  getCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Food Items
  getFoodItems(): Promise<FoodItem[]>;
  getFoodItemById(id: number): Promise<FoodItem | undefined>;
  getFoodItemsByCategory(categoryId: number): Promise<FoodItem[]>;
  getFoodItemsByRestaurant(restaurantId: number): Promise<FoodItem[]>;
  getPopularFoodItems(): Promise<FoodItem[]>;
  searchFoodItems(query: string): Promise<FoodItem[]>;
  createFoodItem(foodItem: InsertFoodItem): Promise<FoodItem>;
  updateFoodItem(id: number, updates: Partial<InsertFoodItem>): Promise<FoodItem | undefined>;
  deleteFoodItem(id: number): Promise<void>;

  // Cart Items
  getCartItems(sessionId: string): Promise<CartItem[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: number): Promise<void>;
  clearCart(sessionId: string): Promise<void>;

  // Users
  getUsers(): Promise<User[]>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;

  // Orders
  getOrders(): Promise<Order[]>;
  getOrderById(id: number): Promise<Order | undefined>;
  getOrdersByCustomer(customerId: number): Promise<Order[]>;
  getOrdersByDriver(driverId: number): Promise<Order[]>;
  getOrdersByRestaurant(restaurantId: number): Promise<Order[]>;
  getAvailableOrders(): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  assignDriver(orderId: number, driverId: number): Promise<Order | undefined>;

  // Drivers
  getDrivers(): Promise<Driver[]>;
  getDriverById(id: number): Promise<Driver | undefined>;
  getDriverByUserId(userId: number): Promise<Driver | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriverStatus(id: number, isOnline: boolean): Promise<Driver | undefined>;
  getDriverEarnings(driverId: number): Promise<DriverEarning[]>;
  addDriverEarning(earning: InsertDriverEarning): Promise<DriverEarning>;

  // Restaurants
  getRestaurants(): Promise<Restaurant[]>;
  getRestaurantById(id: number): Promise<Restaurant | undefined>;
  getRestaurantByUserId(userId: number): Promise<Restaurant | undefined>;
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  updateRestaurant(id: number, updates: Partial<InsertRestaurant>): Promise<Restaurant | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }

  // Food Items
  async getFoodItems(): Promise<FoodItem[]> {
    return await db.select().from(foodItems).orderBy(desc(foodItems.rating));
  }

  async getFoodItemById(id: number): Promise<FoodItem | undefined> {
    const [item] = await db.select().from(foodItems).where(eq(foodItems.id, id));
    return item;
  }

  async getFoodItemsByCategory(categoryId: number): Promise<FoodItem[]> {
    return await db.select().from(foodItems).where(eq(foodItems.categoryId, categoryId));
  }

  async getFoodItemsByRestaurant(restaurantId: number): Promise<FoodItem[]> {
    return await db.select().from(foodItems).where(eq(foodItems.restaurantId, restaurantId));
  }

  async getPopularFoodItems(): Promise<FoodItem[]> {
    return await db.select().from(foodItems).where(eq(foodItems.isPopular, true));
  }

  async searchFoodItems(query: string): Promise<FoodItem[]> {
    return await db.select().from(foodItems).where(ilike(foodItems.name, `%${query}%`));
  }

  async createFoodItem(insertFoodItem: InsertFoodItem): Promise<FoodItem> {
    const [item] = await db.insert(foodItems).values(insertFoodItem).returning();
    return item;
  }

  async updateFoodItem(id: number, updates: Partial<InsertFoodItem>): Promise<FoodItem | undefined> {
    const [item] = await db.update(foodItems).set(updates).where(eq(foodItems.id, id)).returning();
    return item;
  }

  async deleteFoodItem(id: number): Promise<void> {
    await db.delete(foodItems).where(eq(foodItems.id, id));
  }

  // Cart Items
  async getCartItems(sessionId: string): Promise<CartItem[]> {
    return await db.select().from(cartItems).where(eq(cartItems.sessionId, sessionId));
  }

  async addToCart(insertCartItem: InsertCartItem): Promise<CartItem> {
    const [item] = await db.insert(cartItems).values(insertCartItem).returning();
    return item;
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    const [item] = await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, id)).returning();
    return item;
  }

  async removeFromCart(id: number): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearCart(sessionId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.sessionId, sessionId));
  }

  // Users
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrdersByCustomer(customerId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.customerId, customerId));
  }

  async getOrdersByDriver(driverId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.driverId, driverId));
  }

  async getOrdersByRestaurant(restaurantId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.restaurantId, restaurantId));
  }

  async getAvailableOrders(): Promise<Order[]> {
    return await db.select().from(orders).where(
      and(
        eq(orders.status, 'ready'), 
        eq(orders.driverId, null as any)
      )
    );
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(insertOrder).returning();
    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [order] = await db.update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async assignDriver(orderId: number, driverId: number): Promise<Order | undefined> {
    const [order] = await db.update(orders)
      .set({ driverId, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();
    return order;
  }

  // Order Items
  async getOrderItems(orderId: number): Promise<any[]> {
    return await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        foodItemId: orderItems.foodItemId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        foodItemName: foodItems.name
      })
      .from(orderItems)
      .leftJoin(foodItems, eq(orderItems.foodItemId, foodItems.id))
      .where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const [item] = await db.insert(orderItems).values(insertOrderItem).returning();
    return item;
  }

  // Drivers
  async getDrivers(): Promise<Driver[]> {
    return await db.select().from(drivers);
  }

  async getDriverById(id: number): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.id, id));
    return driver;
  }

  async getDriverByUserId(userId: number): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.userId, userId));
    return driver;
  }

  async createDriver(insertDriver: InsertDriver): Promise<Driver> {
    const [driver] = await db.insert(drivers).values(insertDriver).returning();
    return driver;
  }

  async updateDriverStatus(id: number, isOnline: boolean): Promise<Driver | undefined> {
    const [driver] = await db.update(drivers)
      .set({ isOnline })
      .where(eq(drivers.id, id))
      .returning();
    return driver;
  }

  async getDriverEarnings(driverId: number): Promise<DriverEarning[]> {
    return await db.select().from(driverEarnings).where(eq(driverEarnings.driverId, driverId));
  }

  async addDriverEarning(insertEarning: InsertDriverEarning): Promise<DriverEarning> {
    const [earning] = await db.insert(driverEarnings).values(insertEarning).returning();
    return earning;
  }

  // Restaurants
  async getRestaurants(): Promise<Restaurant[]> {
    return await db.select().from(restaurants);
  }

  async getRestaurantById(id: number): Promise<Restaurant | undefined> {
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, id));
    return restaurant;
  }

  async getRestaurantByUserId(userId: number): Promise<Restaurant | undefined> {
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.userId, userId));
    return restaurant;
  }

  async createRestaurant(insertRestaurant: InsertRestaurant): Promise<Restaurant> {
    const [restaurant] = await db.insert(restaurants).values(insertRestaurant).returning();
    return restaurant;
  }

  async updateRestaurant(id: number, updates: Partial<InsertRestaurant>): Promise<Restaurant | undefined> {
    const [restaurant] = await db.update(restaurants)
      .set(updates)
      .where(eq(restaurants.id, id))
      .returning();
    return restaurant;
  }
}

// Initialize database with seed data
async function initializeDatabase() {
  try {
    const existingCategories = await db.select().from(categories);
    
    if (existingCategories.length === 0) {
      // Seed categories
      const categoriesData: InsertCategory[] = [
        { name: "Nasi & Lauk", description: "Makanan tradisional Indonesia", icon: "utensils", color: "from-primary to-secondary" },
        { name: "Makanan Cepat", description: "Makanan siap saji", icon: "pizza-slice", color: "from-orange-400 to-red-500" },
        { name: "Minuman", description: "Minuman segar", icon: "coffee", color: "from-blue-400 to-purple-500" },
        { name: "Dessert", description: "Makanan penutup", icon: "birthday-cake", color: "from-pink-400 to-red-400" },
      ];

      await db.insert(categories).values(categoriesData);

      // Seed users
      const seedUsers = [
        { email: "admin@foodie.id", password: "admin123", name: "Admin", phone: "081234567890", role: "admin" },
        { email: "restaurant1@foodie.id", password: "resto123", name: "Warung Sari", phone: "081234567891", role: "restaurant" },
        { email: "restaurant2@foodie.id", password: "resto123", name: "Pizza Corner", phone: "081234567892", role: "restaurant" },
        { email: "restaurant3@foodie.id", password: "resto123", name: "Bakery Delicious", phone: "081234567893", role: "restaurant" },
        { email: "driver1@foodie.id", password: "driver123", name: "Budi Driver", phone: "081234567894", role: "driver" },
        { email: "driver2@foodie.id", password: "driver123", name: "Sari Driver", phone: "081234567895", role: "driver" },
      ];
      
      await db.insert(users).values(seedUsers);

      // Seed restaurants
      const seedRestaurants = [
        { userId: 2, name: "Warung Sari", description: "Warung tradisional Indonesia", address: "Jl. Sudirman No. 123, Jakarta", phone: "081234567891", imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500" },
        { userId: 3, name: "Pizza Corner", description: "Authentic Italian Pizza", address: "Jl. Thamrin No. 456, Jakarta", phone: "081234567892", imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500" },
        { userId: 4, name: "Bakery Delicious", description: "Fresh baked goods daily", address: "Jl. Gatot Subroto No. 789, Jakarta", phone: "081234567893", imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500" },
      ];
      
      await db.insert(restaurants).values(seedRestaurants);

      // Seed drivers
      const seedDrivers = [
        { userId: 5, vehicleType: "motorcycle", vehicleNumber: "B 1234 ABC", isOnline: false, totalEarnings: 150000, rating: 4.8, totalDeliveries: 25 },
        { userId: 6, vehicleType: "motorcycle", vehicleNumber: "B 5678 DEF", isOnline: true, totalEarnings: 200000, rating: 4.9, totalDeliveries: 35 },
      ];
      
      await db.insert(drivers).values(seedDrivers);

      // Seed food items
      const seedFoodItems: InsertFoodItem[] = [
        {
          restaurantId: 1,
          name: "Gudeg Jogja Komplit",
          description: "Gudeg ayam dengan nasi, telur, dan sambal krecek",
          price: 25000,
          categoryId: 1,
          imageUrl: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=500",
          ingredients: ["Nangka muda", "Ayam", "Telur", "Santan", "Bumbu tradisional"],
          isPopular: true,
          rating: 4.8,
          prepTime: 25
        },
        {
          restaurantId: 1,
          name: "Nasi Padang Spesial",
          description: "Nasi dengan rendang, ayam gulai, dan sayuran",
          price: 32000,
          categoryId: 1,
          imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500",
          ingredients: ["Nasi", "Rendang", "Ayam gulai", "Sayuran", "Sambal"],
          isPopular: true,
          rating: 4.9,
          prepTime: 20
        },
        {
          restaurantId: 2,
          name: "Pizza Margherita",
          description: "Pizza klasik dengan keju mozzarella dan basil",
          price: 45000,
          categoryId: 2,
          imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500",
          ingredients: ["mozzarella", "tomat", "basil", "olive oil"],
          isPopular: false,
          rating: 4.6,
          prepTime: 15
        },
        {
          restaurantId: 2,
          name: "Nasi Goreng Spesial",
          description: "Nasi goreng dengan telur, ayam, dan sayuran",
          price: 20000,
          categoryId: 1,
          imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500",
          ingredients: ["nasi", "telur", "ayam", "kecap"],
          isPopular: false,
          rating: 4.3,
          prepTime: 15
        },
        {
          restaurantId: 1,
          name: "Es Teh Manis",
          description: "Teh manis segar dengan es batu",
          price: 5000,
          categoryId: 3,
          imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500",
          ingredients: ["teh", "gula", "es batu"],
          isPopular: true,
          rating: 4.5,
          prepTime: 5
        },
        {
          restaurantId: 3,
          name: "Kue Lapis Legit",
          description: "Kue lapis dengan rasa manis dan tekstur lembut",
          price: 35000,
          categoryId: 4,
          imageUrl: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=500",
          ingredients: ["tepung", "telur", "mentega", "gula"],
          isPopular: false,
          rating: 4.4,
          prepTime: 45
        },
        {
          restaurantId: 1,
          name: "Sate Ayam Madura",
          description: "Sate ayam dengan bumbu kacang khas Madura",
          price: 22000,
          categoryId: 1,
          imageUrl: "https://images.unsplash.com/photo-1529563021893-cc83c992d75d?w=500",
          ingredients: ["ayam", "bumbu kacang", "kecap manis"],
          isPopular: true,
          rating: 4.7,
          prepTime: 20
        },
        {
          restaurantId: 3,
          name: "Gado-gado Jakarta",
          description: "Sayuran segar dengan bumbu kacang",
          price: 18000,
          categoryId: 1,
          imageUrl: "https://images.unsplash.com/photo-1565299585323-38174c5e8b30?w=500",
          ingredients: ["sayuran", "bumbu kacang", "kerupuk"],
          isPopular: false,
          rating: 4.4,
          prepTime: 10
        }
      ];

      await db.insert(foodItems).values(seedFoodItems);
    }
  } catch (error) {
  }
}

initializeDatabase();

export const storage = new DatabaseStorage();