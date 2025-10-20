import { logger } from '../logger/logger';

/**
 * Unified mock services for external integrations
 * Consolidates WhatsApp, Orders, and Customers mocks into one simple service
 */

interface SendMessageParams {
  to: string;
  body: string;
  template?: string;
}

interface AddOrderNoteParams {
  orderId: string;
  note: string;
}

interface AddCustomerNoteParams {
  customerId: string;
  note: string;
}

class MocksService {
  private async simulateDelay(ms: number = 100): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  // WhatsApp mock
  async sendWhatsAppMessage(params: SendMessageParams): Promise<{ ok: boolean; id: string }> {
    logger.info('[MOCK WhatsApp] Sending message', params);
    await this.simulateDelay();
    return {
      ok: true,
      id: `msg_${Date.now()}`,
    };
  }

  // Orders mock
  async addOrderNote(params: AddOrderNoteParams): Promise<{ ok: boolean }> {
    logger.info('[MOCK Orders] Adding note', params);
    await this.simulateDelay();
    return { ok: true };
  }

  // Customers mock  
  async addCustomerNote(params: AddCustomerNoteParams): Promise<{ ok: boolean }> {
    logger.info('[MOCK Customers] Adding note', params);
    await this.simulateDelay();
    return { ok: true };
  }
}

export const mocksService = new MocksService();
