import { IncomingMessage, ServerResponse } from 'http';
import { createClient } from '@supabase/supabase-js';

// ─── Helpers ───────────────────────────────────────────────────────────────

async function getRequestBody(req: IncomingMessage): Promise<any> {
  if ((req as any).body) return (req as any).body;
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
      if (body.length > 50000) reject(new Error('Payload too large'));
    });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function applyCors(res: ServerResponse) {
  const allowed = [
    'https://aloefloraproducts.com',
    'https://www.aloefloraproducts.com',
    'http://localhost:3000',
    'http://localhost:5173',
  ];
  // Vercel sets origin on the response automatically; we just set the methods/headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function sendJSON(res: ServerResponse, status: number, data: any) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// ─── Service-role Supabase client (server-side only) ───────────────────────

function getAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !serviceKey) throw new Error('Missing Supabase service credentials');
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

// ─── Route Handler ──────────────────────────────────────────────────────────

export default async function handler(req: IncomingMessage & { url?: string; method?: string }, res: ServerResponse) {
  applyCors(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://localhost`);
  const action = url.searchParams.get('action') || url.pathname.split('/').pop();

  try {
    const supabaseAdmin = getAdminClient();

    // ── GET /api/admin/users?action=list ────────────────────────────────────
    // Fetches all profiles with recalculated spending stats from orders
    if (req.method === 'GET' && action === 'list') {
      const { data: profiles, error: profError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profError) throw profError;

      // Recalculate spending & order count per user from orders table
      const { data: orders } = await supabaseAdmin
        .from('orders')
        .select('email, total_amount, payment_status');

      const spendingMap: Record<string, { total: number; count: number }> = {};
      if (orders) {
        for (const order of orders) {
          if (order.payment_status === 'paid' && order.email) {
            const email = order.email.toLowerCase();
            if (!spendingMap[email]) spendingMap[email] = { total: 0, count: 0 };
            spendingMap[email].total += Number(order.total_amount || 0);
            spendingMap[email].count += 1;
          }
        }
      }

      const enriched = (profiles || []).map((p: any) => ({
        id: p.id,
        fullName: p.full_name || '',
        email: p.email || '',
        phone: p.phone || '',
        avatarUrl: p.avatar_url || '',
        address: p.address || '',
        hairType: p.hair_type || '',
        skinType: p.skin_type || '',
        role: p.role || 'customer',
        accountStatus: p.account_status || 'active',
        createdAt: p.created_at,
        lastLogin: p.last_login || null,
        loyaltyPoints: p.loyalty_points || 0,
        totalSpending: spendingMap[p.email?.toLowerCase()]?.total ?? Number(p.total_spending || 0),
        orderCount: spendingMap[p.email?.toLowerCase()]?.count ?? Number(p.order_count || 0),
      }));

      return sendJSON(res, 200, { users: enriched });
    }

    // ── POST /api/admin/users?action=create ─────────────────────────────────
    // Creates user in auth.users + profiles via service-role
    if (req.method === 'POST' && action === 'create') {
      const body = await getRequestBody(req);
      const { fullName, email, phone, role, accountStatus, password } = body;

      if (!email) return sendJSON(res, 400, { error: 'Email is required' });

      // Create auth user first (no email confirmation needed — admin-initiated)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: password || generateTempPassword(),
        email_confirm: true, // Bypass email confirmation
        user_metadata: { full_name: fullName, role: role || 'customer' },
      });

      if (authError) {
        // If user already exists in auth, try to just create/update the profile
        if (authError.message?.includes('already registered')) {
          return sendJSON(res, 409, { error: 'A user with this email already exists.' });
        }
        throw authError;
      }

      const userId = authData.user.id;

      // Upsert profile row (trigger may have already created it)
      const { error: profError } = await supabaseAdmin.from('profiles').upsert({
        id: userId,
        full_name: fullName || '',
        email,
        phone: phone || null,
        role: role || 'customer',
        account_status: accountStatus || 'active',
        created_at: new Date().toISOString(),
        total_spending: 0,
        order_count: 0,
      }, { onConflict: 'id' });

      if (profError) {
        // Roll back auth user creation if profile upsert fails
        await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => {});
        throw profError;
      }

      return sendJSON(res, 201, {
        message: 'User created successfully',
        user: { id: userId, email, fullName, role: role || 'customer', accountStatus: accountStatus || 'active' }
      });
    }

    // ── DELETE /api/admin/users?action=delete ───────────────────────────────
    // Deletes user from both auth.users and profiles (cascade handles profiles)
    if (req.method === 'DELETE' && (action === 'delete' || req.method === 'DELETE')) {
      const body = await getRequestBody(req);
      const { userId } = body;

      if (!userId) return sendJSON(res, 400, { error: 'userId is required' });

      // Deleting from auth.users cascades to profiles via ON DELETE CASCADE
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (deleteError) {
        // Try deleting from profiles only as fallback (e.g. manually-created profiles)
        const { error: profDeleteError } = await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('id', userId);
        if (profDeleteError) throw deleteError;
      }

      return sendJSON(res, 200, { message: 'User deleted successfully' });
    }

    // ── POST /api/admin/users?action=update-status ──────────────────────────
    // Updates account_status in profiles (toggle suspend/activate)
    if (req.method === 'POST' && action === 'update-status') {
      const body = await getRequestBody(req);
      const { userId, accountStatus } = body;

      if (!userId || !accountStatus) return sendJSON(res, 400, { error: 'userId and accountStatus are required' });

      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ account_status: accountStatus })
        .eq('id', userId);

      if (error) throw error;
      return sendJSON(res, 200, { message: 'Status updated successfully' });
    }

    // ── POST /api/admin/users?action=update-profile ─────────────────────────
    // Updates profile fields (full_name, phone, role, account_status)
    if (req.method === 'POST' && action === 'update-profile') {
      const body = await getRequestBody(req);
      const { userId, fullName, phone, role, accountStatus } = body;

      if (!userId) return sendJSON(res, 400, { error: 'userId is required' });

      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone || null,
          role,
          account_status: accountStatus,
        })
        .eq('id', userId);

      if (error) throw error;
      return sendJSON(res, 200, { message: 'Profile updated successfully' });
    }

    return sendJSON(res, 404, { error: 'Unknown action. Use ?action=list|create|delete|update-status|update-profile' });

  } catch (err: any) {
    console.error('[Admin Users API Error]', err);
    return sendJSON(res, 500, { error: err?.message || 'Internal server error' });
  }
}

// ─── Utilities ──────────────────────────────────────────────────────────────

function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$';
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
