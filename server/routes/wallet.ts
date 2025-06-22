import type { Express } from "express";
import { db } from "../db";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { authenticateToken } from "./auth";
import { PayDisiniService } from "../services/payDisiniService";
import { userWallets, walletTransactions } from "@shared/schema";

export function registerWalletRoutes(app: Express) {
  // Get user wallet info
  app.get('/api/wallet', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      
      const result = await db.select()
        .from(userWallets)
        .where(eq(userWallets.userId, userId));
      
      if (result.length === 0) {
        return res.json({ balance: 0, isActive: false });
      }
      
      const wallet = result[0];
      res.json({
        balance: wallet.balance,
        isActive: wallet.isActive
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
      
      // Check if wallet exists
      const existingWallet = await db.select()
        .from(userWallets)
        .where(eq(userWallets.userId, userId));
      
      if (existingWallet.length === 0) {
        // Create new wallet
        await db.insert(userWallets).values({
          userId: userId,
          pin: hashedPin,
          isActive: true,
          balance: 0
        });
      } else {
        // Update existing wallet
        await db.update(userWallets)
          .set({
            pin: hashedPin,
            isActive: true
          })
          .where(eq(userWallets.userId, userId));
      }
      
      res.json({ message: "TasPay berhasil diaktifkan" });
    } catch (error) {
      res.status(500).json({ message: "Gagal mengaktifkan TasPay" });
    }
  });

  // Get payment methods
  app.get('/api/wallet/payment-methods', async (req, res) => {
    try {
      const payDisini = new PayDisiniService();
      const methods = payDisini.getPaymentMethods();
      res.json(methods);
    } catch (error) {
      res.status(500).json({ message: "Gagal mengambil metode pembayaran" });
    }
  });

  // Top up wallet
  app.post('/api/wallet/topup', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const { amount, paymentMethod, pin } = req.body;
      
      if (!amount || amount < 10000) {
        return res.status(400).json({ message: "Minimum top up Rp 10.000" });
      }
      
      if (!paymentMethod || !pin) {
        return res.status(400).json({ message: "Data tidak lengkap" });
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
        externalTransactionId: transaction.data.unique_code
      });
      
      res.json({
        success: true,
        message: "Transaksi berhasil dibuat",
        checkoutUrl: transaction.data.checkout_url_v2,
        uniqueCode: transaction.data.unique_code
      });
    } catch (error) {
      res.status(500).json({ message: "Gagal membuat transaksi" });
    }
  });
}