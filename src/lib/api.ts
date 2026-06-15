import { Product, Order, SupportTicket } from '../types';

/**
 * Data Access Layer
 * Currently wraps LocalStorage for rapid prototyping.
 * Can be hot-swapped to use Supabase/Vercel Postgres by changing the implementation here.
 */
export const api = {
  products: {
    get: async (): Promise<Product[]> => {
      const data = localStorage.getItem('aloeflora_db_products');
      return data ? JSON.parse(data) : [];
    },
    save: async (products: Product[]) => {
      localStorage.setItem('aloeflora_db_products', JSON.stringify(products));
    }
  },
  orders: {
    get: async (): Promise<Order[]> => {
      const data = localStorage.getItem('aloeflora_db_orders');
      return data ? JSON.parse(data) : [];
    },
    save: async (orders: Order[]) => {
      localStorage.setItem('aloeflora_db_orders', JSON.stringify(orders));
    }
  },
  // Extendable to tickets, campaigns, etc.
};
