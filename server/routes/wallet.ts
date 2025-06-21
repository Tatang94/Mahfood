import type { Express } from "express";
import { db } from "../db";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { authenticateToken } from "./auth";

// Define wallet and transaction schemas
const userWallets = {
  id: 'id',
  userId: 'user_id', 
  balance: 'balance',
  pin: 'pin',
  isActive: 'is_active',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

const walletTransactions = {
  id: 'id',
  walletId: 'wallet_id',
  orderId: 'order_id', 
  type: 'type',
  amount: 'amount',
  description: 'description',
  status: 'status',
  createdAt: 'created_at'
};

export function registerWalletRoutes(app: Express) {
  // Get user wallet info
  app.get('/api/wallet', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      
      const result = await db.execute(`
        SELECT balance, is_active 
        FROM user_wallets 
        WHERE user_id = $1
      `, [userId]);
      
      if (result.rows.length === 0) {
        return res.json({ balance: 0, isActive: false });
      }
      
      const wallet = result.rows[0];
      res.json({
        balance: wallet.balance,
        isActive: wallet.is_active
      });
    } catch (error) {
      
      res.status(500).json({ message: "Gagal mengambil data dompet" });
    }
  });

  // Create/activate wallet
  app.post('/api/wallet/activate', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const { pin } = req.body;
      
      if (!pin || pin.length !== 6) {
        return res.status(400).json({ message: "PIN harus 6 digit" });
      }
      
      const hashedPin = await bcrypt.hash(pin, 10);
      
      await db.execute(`
        INSERT INTO user_wallets (user_id, balance, pin, is_active)
        VALUES ($1, 0, $2, true)
        ON CONFLICT (user_id) DO UPDATE SET
          pin = $2,
          is_active = true,
          updated_at = NOW()
      `, [userId, hashedPin]);
      
      res.json({ message: "TasPay berhasil diaktifkan" });
    } catch (error) {
      
      res.status(500).json({ message: "Gagal mengaktifkan TasPay" });
    }
  });

  // Top up wallet
  app.post('/api/wallet/topup', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const { amount, pin } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Jumlah top up tidak valid" });
      }
      
      if (!pin) {
        return res.status(400).json({ message: "PIN diperlukan" });
      }
      
      // Get wallet
      const walletResult = await db.execute(`
        SELECT id, balance, pin, is_active 
        FROM user_wallets 
        WHERE user_id = $1
      `, [userId]);
      
      if (walletResult.rows.length === 0 || !walletResult.rows[0].is_active) {
        return res.status(400).json({ message: "TasPay belum aktif" });
      }
      
      const wallet = walletResult.rows[0];
      
      // Verify PIN
      const validPin = await bcrypt.compare(pin, wallet.pin);
      if (!validPin) {
        return res.status(401).json({ message: "PIN salah" });
      }
      
      // Update balance
      const newBalance = wallet.balance + amount;
      await db.execute(`
        UPDATE user_wallets 
        SET balance = $1, updated_at = NOW()
        WHERE id = $2
      `, [newBalance, wallet.id]);
      
      // Record transaction
      await db.execute(`
        INSERT INTO wallet_transactions (wallet_id, type, amount, description, status)
        VALUES ($1, 'topup', $2, 'Top up saldo TasPay', 'completed')
      `, [wallet.id, amount]);
      
      res.json({ 
        message: "Top up berhasil",
        balance: newBalance 
      });
    } catch (error) {
      
      res.status(500).json({ message: "Gagal melakukan top up" });
    }
  });

  // Process payment
  app.post('/api/wallet/pay', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const { amount, pin, orderId, description } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Jumlah pembayaran tidak valid" });
      }
      
      if (!pin) {
        return res.status(400).json({ message: "PIN diperlukan" });
      }
      
      // Get wallet
      const walletResult = await db.execute(`
        SELECT id, balance, pin, is_active 
        FROM user_wallets 
        WHERE user_id = $1
      `, [userId]);
      
      if (walletResult.rows.length === 0 || !walletResult.rows[0].is_active) {
        return res.status(400).json({ message: "TasPay belum aktif" });
      }
      
      const wallet = walletResult.rows[0];
      
      // Verify PIN
      const validPin = await bcrypt.compare(pin, wallet.pin);
      if (!validPin) {
        return res.status(401).json({ message: "PIN salah" });
      }
      
      // Check balance
      if (wallet.balance < amount) {
        return res.status(400).json({ message: "Saldo tidak mencukupi" });
      }
      
      // Update balance
      const newBalance = wallet.balance - amount;
      await db.execute(`
        UPDATE user_wallets 
        SET balance = $1, updated_at = NOW()
        WHERE id = $2
      `, [newBalance, wallet.id]);
      
      // Record transaction
      await db.execute(`
        INSERT INTO wallet_transactions (wallet_id, order_id, type, amount, description, status)
        VALUES ($1, $2, 'payment', $3, $4, 'completed')
      `, [wallet.id, orderId || null, amount, description || 'Pembayaran pesanan']);
      
      res.json({ 
        message: "Pembayaran berhasil",
        balance: newBalance 
      });
    } catch (error) {
      
      res.status(500).json({ message: "Gagal memproses pembayaran" });
    }
  });

  // Get transaction history
  app.get('/api/wallet/transactions', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      
      const result = await db.execute(`
        SELECT wt.*, uw.user_id
        FROM wallet_transactions wt
        JOIN user_wallets uw ON wt.wallet_id = uw.id
        WHERE uw.user_id = $1
        ORDER BY wt.created_at DESC
        LIMIT 50
      `, [userId]);
      
      res.json(result.rows);
    } catch (error) {
      
      res.status(500).json({ message: "Gagal mengambil riwayat transaksi" });
    }
  });
}