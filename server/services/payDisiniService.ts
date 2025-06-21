import crypto from 'crypto';

export interface PayDisiniConfig {
  apiId: string;
  apiKey: string;
  baseUrl: string;
}

export interface CreateTransactionRequest {
  key: string;
  request: string;
  unique_code: string;
  service: string;
  amount: number;
  note: string;
  valid_time: number;
  type_fee: number;
  payment_guide: boolean;
  signature: string;
}

export interface TransactionResponse {
  success: boolean;
  data: {
    unique_code: string;
    service: string;
    service_name: string;
    amount: number;
    balance: number;
    fee: number;
    type_fee: string;
    note: string;
    status: string;
    expired: string;
    qr_content: string;
    qr_url: string;
    checkout_url_v2: string;
    checkout_url_beta: string;
  };
  msg: string;
}

export class PayDisiniService {
  private config: PayDisiniConfig;

  constructor() {
    this.config = {
      apiId: '3246',
      apiKey: 'e6556b536526244f7c518693edd6e439',
      baseUrl: 'https://api.paydisini.co.id/v1/'
    };
  }

  private generateSignature(data: string): string {
    return crypto
      .createHmac('md5', this.config.apiKey)
      .update(data)
      .digest('hex');
  }

  async createTransaction(
    amount: number,
    service: string,
    note: string = 'Top up TasPay',
    validTime: number = 10800 // 3 hours in seconds
  ): Promise<TransactionResponse> {
    const uniqueCode = `topup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Prepare signature data
    const signatureData = `${this.config.apiId}${this.config.apiKey}${uniqueCode}${service}${amount}${validTime}NewTransaction`;
    const signature = this.generateSignature(signatureData);

    const requestData: CreateTransactionRequest = {
      key: this.config.apiId,
      request: 'new',
      unique_code: uniqueCode,
      service: service,
      amount: amount,
      note: note,
      valid_time: validTime,
      type_fee: 1, // fee charged to merchant
      payment_guide: true,
      signature: signature
    };

    try {
      console.log('PayDisini Request:', requestData);
      
      const response = await fetch(this.config.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'FoodieID/1.0'
        },
        body: new URLSearchParams(requestData as any).toString()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json() as TransactionResponse;
      console.log('PayDisini Response:', result);
      return result;
    } catch (error) {
      console.error('PayDisini API Error:', error);
      throw new Error(`PayDisini API Error: ${error.message}`);
    }
  }

  async checkTransactionStatus(uniqueCode: string): Promise<any> {
    const signatureData = `${this.config.apiId}${this.config.apiKey}${uniqueCode}StatusTransaction`;
    const signature = this.generateSignature(signatureData);

    const requestData = {
      key: this.config.apiId,
      request: 'status',
      unique_code: uniqueCode,
      signature: signature
    };

    try {
      const response = await fetch(this.config.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(requestData).toString()
      });

      return await response.json();
    } catch (error) {
      throw new Error(`PayDisini Status Check Error: ${error.message}`);
    }
  }

  // Available payment methods
  getPaymentMethods() {
    return [
      { code: '13', name: 'DANA', fee: 0.7 }
    ];
  }
}