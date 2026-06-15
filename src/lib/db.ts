// Stub for future Supabase or Vercel Postgres integration
export const db = {
  // To be initialized with real client:
  // client: createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
  
  isConnected: () => true,
  
  query: async (sql: string, params?: any[]) => {
    console.log(`[DB Stub] Query: ${sql}`, params);
    return [];
  }
};
