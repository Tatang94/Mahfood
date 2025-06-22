import type { Express, Request } from "express";
import { storage } from "../storage";
import { insertUserSchema, insertDriverSchema, insertRestaurantSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";

const JWT_SECRET = process.env.JWT_SECRET || "a8f5f167f44f4964e6c998dee827110c";

// Input validation and sanitization helpers
const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>\"'%;()&+]/g, '');
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

const validatePassword = (password: string): boolean => {
  return password.length >= 6 && password.length <= 128;
};

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^(\+62|62|0)[0-9]{9,13}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Configure multer for file uploads with security
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '');
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(sanitizedName));
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only allow 1 file per request
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar (JPEG, PNG, WebP) yang diizinkan'));
    }
  }
});

export function registerAuthRoutes(app: Express) {
  // Register user (customer, driver, restaurant) with file upload
  app.post('/api/auth/register', upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'photo', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const { role, ...userData } = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      // Validate required fields
      if (!userData.email || !userData.password || !userData.name || !userData.phone) {
        return res.status(400).json({ message: "Email, password, nama, dan nomor telepon harus diisi" });
      }

      // Sanitize inputs
      userData.email = sanitizeInput(userData.email.toLowerCase());
      userData.name = sanitizeInput(userData.name);
      userData.phone = sanitizeInput(userData.phone);

      // Validate inputs
      if (!validateEmail(userData.email)) {
        return res.status(400).json({ message: "Format email tidak valid" });
      }
      
      if (!validatePassword(userData.password)) {
        return res.status(400).json({ message: "Password harus minimal 6 karakter dan maksimal 128 karakter" });
      }
      
      if (!validatePhone(userData.phone)) {
        return res.status(400).json({ message: "Format nomor telepon tidak valid" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email sudah terdaftar" });
      }

      // Handle file uploads
      let logoPath = null;
      if (files?.logo && files.logo[0]) {
        logoPath = `/uploads/${files.logo[0].filename}`;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user
      const user = await storage.createUser({
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        password: hashedPassword,
        role: role || 'customer'
      });

      // Create additional records based on role
      if (role === 'driver') {
        await storage.createDriver({
          userId: user.id,
          vehicleType: req.body.vehicleType || 'motorcycle',
          vehicleNumber: req.body.vehicleNumber,
          isOnline: false,
          totalEarnings: 0,
          rating: 5.0,
          totalDeliveries: 0
        });
      } else if (role === 'restaurant') {
        await storage.createRestaurant({
          userId: user.id,
          name: req.body.restaurantName || userData.name,
          description: req.body.description || '',
          address: req.body.address || '',
          phone: userData.phone,
          imageUrl: req.body.imageUrl || ''
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: "Registrasi berhasil",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ message: "Gagal melakukan registrasi" });
    }
  });

  // Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      let { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email dan password harus diisi" });
      }

      // Sanitize and validate email
      email = sanitizeInput(email.toLowerCase());
      if (!validateEmail(email)) {
        return res.status(400).json({ message: "Format email tidak valid" });
      }

      if (!validatePassword(password)) {
        return res.status(400).json({ message: "Password tidak valid" });
      }
      
      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Email atau password salah" });
      }

      // Check password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Email atau password salah" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        message: "Login berhasil",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Gagal melakukan login" });
    }
  });

  // Get current user
  app.get('/api/auth/me', authenticateToken, async (req: AuthRequest, res: any) => {
    try {
      const user = await storage.getUserById(req.user!.userId);
      if (!user) {
        return res.status(404).json({ message: "User tidak ditemukan" });
      }

      let additionalData = {};
      
      if (user.role === 'driver') {
        const driver = await storage.getDriverByUserId(user.id);
        additionalData = { driver };
      } else if (user.role === 'restaurant') {
        const restaurant = await storage.getRestaurantByUserId(user.id);
        additionalData = { restaurant };
      }

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone
        },
        ...additionalData
      });
    } catch (error) {
      
      res.status(500).json({ message: "Gagal mengambil data user" });
    }
  });

  // Logout
  app.post('/api/auth/logout', (req, res) => {
    res.json({ message: "Logout berhasil" });
  });
}

// Extend Request interface
interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: string;
  };
}

// Middleware to authenticate JWT token
export function authenticateToken(req: AuthRequest, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: "Token tidak ditemukan" });
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) {
        return res.status(403).json({ message: "Token tidak valid" });
      }
      req.user = user;
      next();
    });
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}