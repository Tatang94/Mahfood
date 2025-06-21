import type { Express } from "express";
import { db } from "../db";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { authenticateToken } from "./auth";
import { PayDisiniService } from "../services/payDisiniService";
import { userWallets, walletTransactions } from "@shared/schema";

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

  // Get available payment methods for top up
  app.get('/api/wallet/payment-methods', async (req, res) => {
    try {
      const payDisini = new PayDisiniService();
      const methods = payDisini.getPaymentMethods();
      res.json(methods);
    } catch (error) {
      res.status(500).json({ message: "Gagal mengambil metode pembayaran" });
    }
  });

  // Create top up transaction
  app.post('/api/wallet/topup/create', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const { amount, paymentMethod, pin } = req.body;
      
      if (!amount || amount < 10000) {
        return res.status(400).json({ message: "Minimum top up Rp 10.000" });
      }
      
      if (!paymentMethod) {
        return res.status(400).json({ message: "Pilih metode pembayaran" });
      }
      
      if (!pin) {
        return res.status(400).json({ message: "PIN diperlukan" });
      }
      
      // Get wallet
      const walletResult = await db.select()
        .from(userWallets)
        .where(eq(userWallets.userId, userId));
      
      if (walletResult.length === 0 || !walletResult[0].isActive) {
        return res.status(400).json({ message: "TasPay belum aktif" });
      }
      
      const wallet = walletResult[0];
      
      // Verify PIN
      const validPin = await bcrypt.compare(pin, wallet.pin);
      if (!validPin) {
        return res.status(401).json({ message: "PIN salah" });
      }
      
      // Create PayDisini transaction
      const payDisini = new PayDisiniService();
      const transaction = await payDisini.createTransaction(
        amount,
        paymentMethod,
        `Top up TasPay - User ${userId}`
      );
      
      if (!transaction.success) {
        return res.status(400).json({ message: transaction.msg || "Gagal membuat transaksi" });
      }
      
      // Record transaction in database
      await db.insert(walletTransactions).values({
        walletId: wallet.id,
        type: 'topup',
        amount: amount,
        description: `Top up TasPay via ${transaction.data.service_name}`,
        status: 'pending',
        paymentMethod: paymentMethod,
        externalTransactionId: transaction.data.unique_code
      });
      
      res.json({
        success: true,
        transaction: {
          unique_code: transaction.data.unique_code,
          amount: transaction.data.amount,
          fee: transaction.data.fee,
          service_name: transaction.data.service_name,
          qr_url: transaction.data.qr_url,
          checkout_url: transaction.data.checkout_url_v2,
          expired: transaction.data.expired
        }
      });
    } catch (error) {
      console.error('Top up error:', error);
      res.status(500).json({ message: "Gagal membuat transaksi top up" });
    }
  });

  // Check transaction status and update wallet
  app.post('/api/wallet/topup/check', authenticateToken, async (req: any, res) => {
    try {
      const { uniqueCode } = req.body;
      
      if (!uniqueCode) {
        return res.status(400).json({ message: "Kode transaksi diperlukan" });
      }
      
      // Check status from PayDisini
      const payDisini = new PayDisiniService();
      const status = await payDisini.checkTransactionStatus(uniqueCode);
      
      if (status.success && status.data.status === 'Success') {
        // Get transaction from database
        const transactionResult = await db.select()
          .from(walletTransactions)
          .where(eq(walletTransactions.externalTransactionId, uniqueCode));
          
        if (transactionResult.length === 0) {
          return res.status(404).json({ message: "Transaksi tidak ditemukan" });
        }
        
        const transaction = transactionResult[0];
        
        if (transaction.status === 'completed') {
          return res.json({ success: true, message: "Transaksi sudah berhasil" });
        }
        
        // Update wallet balance
        await db.execute(`
          UPDATE user_wallets 
          SET balance = balance + $1, updated_at = NOW()
          WHERE id = $2
        `, [transaction.amount, transaction.walletId]);
        
        // Update transaction status
        await db.execute(`
          UPDATE wallet_transactions 
          SET status = 'completed'
          WHERE external_transaction_id = $1
        `, [uniqueCode]);
        
        // Get updated wallet balance
        const walletResult = await db.select()
          .from(userWallets)
          .where(eq(userWallets.id, transaction.walletId));
        
        res.json({
          success: true,
          message: "Top up berhasil!",
          balance: walletResult[0].balance
        });
      } else {
        res.json({
          success: false,
          status: status.data?.status || 'Pending',
          message: "Transaksi belum berhasil"
        });
      }
    } catch (error) {
      console.error('Check transaction error:', error);
      res.status(500).json({ message: "Gagal mengecek status transaksi" });
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