import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Edit2,
  Trash2,
  UserPlus,
  Shield,
  X,
  Check,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  TrendingUp,
  UserCheck,
  UserX,
  Loader2,
  Eye,
  ShoppingBag,
} from "lucide-react";
import { UserProfile } from "../../types";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";

// ── Types ────────────────────────────────────────────────────────────────────

interface UserManagementProps {
  users: UserProfile[];
  onUpdateUsers: (users: UserProfile[]) => void;
  isLoading?: boolean;
}

const PAGE_SIZE = 25;

// ── Helpers ──────────────────────────────────────────────────────────────────

const ADMIN_API_BASE = "/api/admin/users";

async function adminFetch(action: string, method: "GET" | "POST" | "DELETE", body?: object) {
  const url = `${ADMIN_API_BASE}?action=${action}`;
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

function safeStatus(status?: string): "active" | "suspended" | "locked" {
  if (status === "suspended" || status === "locked") return status;
  return "active";
}

function safeRole(role?: string): "admin" | "customer" | "moderator" {
  if (role === "admin" || role === "moderator") return role;
  return "customer";
}

// ── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className={`flex items-center gap-3 bg-white border rounded-2xl p-4 shadow-sm`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{label}</div>
        <div className="text-lg font-black text-gray-900">{value}</div>
      </div>
    </div>
  );
}

// ── Skeleton Row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
          <div className="space-y-1.5">
            <div className="h-3 w-28 bg-gray-200 rounded" />
            <div className="h-2.5 w-36 bg-gray-100 rounded" />
          </div>
        </div>
      </td>
      <td className="p-4"><div className="h-5 w-16 bg-gray-200 rounded-full" /></td>
      <td className="p-4">
        <div className="h-3 w-20 bg-gray-200 rounded mb-1.5" />
        <div className="h-2.5 w-16 bg-gray-100 rounded" />
      </td>
      <td className="p-4"><div className="h-5 w-14 bg-gray-200 rounded-full" /></td>
      <td className="p-4">
        <div className="flex items-center justify-end gap-2">
          <div className="w-7 h-7 bg-gray-200 rounded-lg" />
          <div className="w-7 h-7 bg-gray-200 rounded-lg" />
          <div className="w-7 h-7 bg-gray-200 rounded-lg" />
        </div>
      </td>
    </tr>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function UserManagement({ users, onUpdateUsers, isLoading = false }: UserManagementProps) {
  // ── Filters & pagination ──────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "customer" | "moderator">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended" | "locked">("all");
  const [currentPage, setCurrentPage] = useState(1);

  // ── Modal / editing ───────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // ── Form state ────────────────────────────────────────────────────────────
  const [formFullName, setFormFullName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRole, setFormRole] = useState<"admin" | "customer" | "moderator">("customer");
  const [formStatus, setFormStatus] = useState<"active" | "suspended" | "locked">("active");
  const [formPassword, setFormPassword] = useState("");

  // ── Action states ─────────────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ── Detail view ───────────────────────────────────────────────────────────
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, roleFilter, statusFilter]);

  // ── Derived filtered list ─────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        const q = searchQuery.toLowerCase();
        const matchSearch =
          (u.fullName || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q) ||
          (u.phone || "").toLowerCase().includes(q);
        const matchRole = roleFilter === "all" || safeRole(u.role) === roleFilter;
        const matchStatus = statusFilter === "all" || safeStatus(u.accountStatus) === statusFilter;
        return matchSearch && matchRole && matchStatus;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [users, searchQuery, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((u) => safeStatus(u.accountStatus) === "active").length,
    suspended: users.filter((u) => safeStatus(u.accountStatus) === "suspended").length,
    admins: users.filter((u) => safeRole(u.role) === "admin").length,
    totalSpending: users.reduce((s, u) => s + (u.totalSpending || 0), 0),
  }), [users]);

  // ── Refresh spending stats from server ────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const json = await adminFetch("list", "GET");
      if (json.users) {
        onUpdateUsers(json.users);
        toast.success("User data refreshed.");
      }
    } catch (err: any) {
      // Fallback: re-fetch directly from supabase with anon key
      try {
        const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
        if (data && !error) {
          const mapped: UserProfile[] = data.map((u: any) => ({
            id: u.id,
            fullName: u.full_name || "",
            email: u.email || "",
            phone: u.phone || "",
            avatarUrl: u.avatar_url || "",
            role: safeRole(u.role),
            accountStatus: safeStatus(u.account_status),
            createdAt: u.created_at,
            lastLogin: u.last_login || null,
            totalSpending: Number(u.total_spending || 0),
            orderCount: Number(u.order_count || 0),
            loyaltyPoints: u.loyalty_points || 0,
          }));
          onUpdateUsers(mapped);
          toast.success("User data refreshed.");
        }
      } catch (_) {
        toast.error("Refresh failed: " + err.message);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [onUpdateUsers]);

  // ── Open modal ────────────────────────────────────────────────────────────
  const openModal = (user?: UserProfile) => {
    if (user) {
      setEditingUser(user);
      setFormFullName(user.fullName || "");
      setFormEmail(user.email || "");
      setFormPhone(user.phone || "");
      setFormRole(safeRole(user.role));
      setFormStatus(safeStatus(user.accountStatus));
      setFormPassword("");
    } else {
      setEditingUser(null);
      setFormFullName("");
      setFormEmail("");
      setFormPhone("");
      setFormRole("customer");
      setFormStatus("active");
      setFormPassword("");
    }
    setIsModalOpen(true);
  };

  // ── Save (create or update) ───────────────────────────────────────────────
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (editingUser) {
        // Update via API (uses service-role to bypass RLS restrictions)
        try {
          await adminFetch("update-profile", "POST", {
            userId: editingUser.id,
            fullName: formFullName,
            phone: formPhone,
            role: formRole,
            accountStatus: formStatus,
          });
        } catch {
          // Fallback: direct supabase update (works if admin RLS policy is set correctly)
          const { error } = await supabase.from("profiles").update({
            full_name: formFullName,
            phone: formPhone || null,
            role: formRole,
            account_status: formStatus,
          }).eq("id", editingUser.id);
          if (error) throw error;
        }

        const updatedUsers = users.map((u) =>
          u.id === editingUser.id
            ? { ...u, fullName: formFullName, phone: formPhone, role: formRole, accountStatus: formStatus }
            : u
        );
        onUpdateUsers(updatedUsers);
        toast.success("User updated successfully.");
      } else {
        // Create via server API (requires service-role key)
        const json = await adminFetch("create", "POST", {
          fullName: formFullName,
          email: formEmail,
          phone: formPhone,
          role: formRole,
          accountStatus: formStatus,
          password: formPassword || undefined,
        });

        const newProfile: UserProfile = {
          id: json.user.id,
          fullName: formFullName,
          email: formEmail,
          phone: formPhone,
          role: formRole,
          accountStatus: formStatus,
          createdAt: new Date().toISOString(),
          totalSpending: 0,
          orderCount: 0,
        };
        onUpdateUsers([newProfile, ...users]);
        toast.success("User created. They can use 'Forgot Password' to set their credentials.");
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error("Error saving user: " + (err.message || "Unknown error"));
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete user ───────────────────────────────────────────────────────────
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Permanently delete "${userName}"? This removes them from both auth and profiles and cannot be undone.`)) return;
    setDeletingId(userId);

    try {
      await adminFetch("delete", "DELETE", { userId });
      onUpdateUsers(users.filter((u) => u.id !== userId));
      toast.success("User permanently deleted.");
    } catch (err: any) {
      // Fallback: delete from profiles only (admin RLS must allow this)
      try {
        const { error } = await supabase.from("profiles").delete().eq("id", userId);
        if (error) throw error;
        onUpdateUsers(users.filter((u) => u.id !== userId));
        toast.success("User profile removed. Auth account may still exist.");
      } catch {
        toast.error("Delete failed: " + err.message);
      }
    } finally {
      setDeletingId(null);
    }
  };

  // ── Toggle status ─────────────────────────────────────────────────────────
  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = safeStatus(currentStatus) === "active" ? "suspended" : "active";
    setTogglingId(userId);

    try {
      try {
        await adminFetch("update-status", "POST", { userId, accountStatus: newStatus });
      } catch {
        const { error } = await supabase.from("profiles").update({ account_status: newStatus }).eq("id", userId);
        if (error) throw error;
      }
      const updated = users.map((u) => (u.id === userId ? { ...u, accountStatus: newStatus as any } : u));
      onUpdateUsers(updated);
      toast.success(`User ${newStatus === "active" ? "activated" : "suspended"}.`);
    } catch (err: any) {
      toast.error("Failed to update status: " + err.message);
    } finally {
      setTogglingId(null);
    }
  };

  // ── Role badge style ──────────────────────────────────────────────────────
  const roleBadgeClass = (role: string) =>
    role === "admin"
      ? "bg-purple-100 text-purple-800"
      : role === "moderator"
      ? "bg-blue-100 text-blue-800"
      : "bg-gray-100 text-gray-700";

  const statusBadgeClass = (status: string) =>
    status === "active"
      ? "bg-emerald-100 text-emerald-800"
      : status === "suspended"
      ? "bg-red-100 text-red-800"
      : "bg-amber-100 text-amber-800";

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-left">

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-950 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-800" /> User Management
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Control customer access, roles, and monitor user statistics. Synced in real-time with Supabase.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 font-bold text-xs py-2 px-3 rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
            title="Refresh user data and spending stats"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button
            onClick={() => openModal()}
            className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-2 transition"
          >
            <UserPlus className="w-4 h-4" /> Add User
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<Users className="w-4 h-4 text-blue-600" />}
          label="Total Users"
          value={stats.total.toLocaleString()}
          color="bg-blue-50"
        />
        <StatCard
          icon={<UserCheck className="w-4 h-4 text-emerald-600" />}
          label="Active"
          value={stats.active.toLocaleString()}
          color="bg-emerald-50"
        />
        <StatCard
          icon={<UserX className="w-4 h-4 text-red-500" />}
          label="Suspended"
          value={stats.suspended.toLocaleString()}
          color="bg-red-50"
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4 text-purple-600" />}
          label="Total Revenue"
          value={`KES ${stats.totalSpending.toLocaleString()}`}
          color="bg-purple-50"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end bg-gray-50 p-4 rounded-xl border">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border rounded-lg text-xs focus:outline-none focus:border-emerald-800"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase">Role</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="block w-full bg-white border rounded-lg text-xs px-3 py-2 focus:outline-none focus:border-emerald-800"
          >
            <option value="all">All Roles</option>
            <option value="customer">Customer</option>
            <option value="admin">Admin</option>
            <option value="moderator">Moderator</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="block w-full bg-white border rounded-lg text-xs px-3 py-2 focus:outline-none focus:border-emerald-800"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="locked">Locked</option>
          </select>
        </div>

        <div className="text-[11px] text-gray-400 font-medium self-center ml-auto pt-4">
          {filteredUsers.length} result{filteredUsers.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 border-b text-gray-500 font-bold text-[10px] uppercase">
              <tr>
                <th className="p-4">User Details</th>
                <th className="p-4">Role</th>
                <th className="p-4">Account Stats</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : paginatedUsers.length > 0 ? (
                paginatedUsers.map((u) => {
                  const status = safeStatus(u.accountStatus);
                  const role = safeRole(u.role);
                  const initials = (u.fullName || u.email || "?").charAt(0).toUpperCase();
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/60 transition group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.fullName} className="w-8 h-8 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                              {initials}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-gray-900">{u.fullName || "Unnamed User"}</div>
                            <div className="text-gray-400">{u.email}</div>
                            {u.phone && <div className="text-[10px] text-gray-400">{u.phone}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold ${roleBadgeClass(role)}`}>
                          {role === "admin" && <Shield className="w-3 h-3" />}
                          {role.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 font-bold text-gray-900">
                          <ShoppingBag className="w-3 h-3 text-emerald-600" />
                          KES {(u.totalSpending || 0).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{u.orderCount || 0} lifetime orders</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          Joined {new Date(u.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                        {u.lastLogin && (
                          <div className="text-[10px] text-gray-300">
                            Last login {new Date(u.lastLogin).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${statusBadgeClass(status)}`}>
                          {status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View detail */}
                          <button
                            onClick={() => setViewingUser(u)}
                            className="p-1.5 rounded-lg border text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {/* Toggle status */}
                          <button
                            onClick={() => handleToggleStatus(u.id, u.accountStatus)}
                            disabled={togglingId === u.id}
                            className={`p-1.5 rounded-lg border transition disabled:opacity-50 ${
                              status === "active" ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"
                            }`}
                            title={status === "active" ? "Suspend User" : "Activate User"}
                          >
                            {togglingId === u.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : status === "active" ? (
                              <X className="w-3.5 h-3.5" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                          </button>
                          {/* Edit */}
                          <button
                            onClick={() => openModal(u)}
                            className="p-1.5 rounded-lg border text-blue-600 hover:bg-blue-50 transition"
                            title="Edit User"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteUser(u.id, u.fullName || u.email)}
                            disabled={deletingId === u.id}
                            className="p-1.5 rounded-lg border text-red-500 hover:bg-red-50 transition disabled:opacity-50"
                            title="Delete User"
                          >
                            {deletingId === u.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <Users className="w-8 h-8 opacity-30" />
                      <p className="text-sm font-medium">No users found</p>
                      <p className="text-xs">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between bg-gray-50">
            <div className="text-[11px] text-gray-500">
              Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredUsers.length)}–
              {Math.min(currentPage * PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border text-gray-500 hover:bg-white disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const page = totalPages <= 7 ? i + 1 : i + Math.max(1, currentPage - 3);
                if (page > totalPages) return null;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg text-[11px] font-bold border transition ${
                      page === currentPage ? "bg-emerald-800 text-white border-emerald-800" : "text-gray-600 hover:bg-white"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border text-gray-500 hover:bg-white disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── User Detail Modal ─────────────────────────────────────────────── */}
      {viewingUser && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">User Profile</h3>
              <button onClick={() => setViewingUser(null)} className="text-gray-400 hover:text-gray-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xl">
                  {(viewingUser.fullName || viewingUser.email || "?").charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-base">{viewingUser.fullName || "Unnamed User"}</div>
                  <div className="text-gray-500 text-xs">{viewingUser.email}</div>
                  {viewingUser.phone && <div className="text-gray-400 text-xs">{viewingUser.phone}</div>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                {[
                  { label: "Role", value: safeRole(viewingUser.role).toUpperCase() },
                  { label: "Status", value: safeStatus(viewingUser.accountStatus).toUpperCase() },
                  { label: "Total Spent", value: `KES ${(viewingUser.totalSpending || 0).toLocaleString()}` },
                  { label: "Orders", value: String(viewingUser.orderCount || 0) },
                  { label: "Loyalty Points", value: String(viewingUser.loyaltyPoints || 0) },
                  { label: "Joined", value: new Date(viewingUser.createdAt).toLocaleDateString() },
                  ...(viewingUser.lastLogin ? [{ label: "Last Login", value: new Date(viewingUser.lastLogin).toLocaleDateString() }] : []),
                  ...(viewingUser.hairType ? [{ label: "Hair Type", value: viewingUser.hairType }] : []),
                  ...(viewingUser.skinType ? [{ label: "Skin Type", value: viewingUser.skinType }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-2.5">
                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">{label}</div>
                    <div className="font-bold text-gray-900">{value}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setViewingUser(null); openModal(viewingUser); }}
                  className="flex-1 py-2.5 border border-blue-200 text-blue-700 font-bold text-xs rounded-xl hover:bg-blue-50 transition"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => setViewingUser(null)}
                  className="flex-1 py-2.5 bg-emerald-800 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Create / Edit Modal ───────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900 text-lg">
                {editingUser ? "Edit User Profile" : "Add New User"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4 text-sm">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  className="w-full p-2.5 border rounded-xl focus:outline-none focus:border-emerald-800 text-sm"
                  placeholder="e.g. Jane Doe"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Email Address</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  disabled={!!editingUser}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full p-2.5 border rounded-xl focus:outline-none focus:border-emerald-800 text-sm disabled:bg-gray-50 disabled:text-gray-400"
                  placeholder="e.g. jane@example.com"
                />
                {editingUser && (
                  <p className="text-[10px] text-gray-400">Email cannot be changed after account creation.</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Phone Number (Optional)</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full p-2.5 border rounded-xl focus:outline-none focus:border-emerald-800 text-sm"
                  placeholder="e.g. 0700123456"
                />
              </div>

              {!editingUser && (
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">
                    Temporary Password <span className="text-gray-400 font-normal">(optional — auto-generated if blank)</span>
                  </label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full p-2.5 border rounded-xl focus:outline-none focus:border-emerald-800 text-sm"
                    placeholder="Leave blank to auto-generate"
                    minLength={6}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">System Role</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as any)}
                    className="w-full p-2.5 border rounded-xl focus:outline-none focus:border-emerald-800 bg-white text-sm"
                  >
                    <option value="customer">Customer</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Account Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full p-2.5 border rounded-xl focus:outline-none focus:border-emerald-800 bg-white text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="locked">Locked</option>
                  </select>
                </div>
              </div>

              {!editingUser && (
                <div className="flex items-start gap-2.5 text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-100">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Note:</strong> This creates the user in Supabase Auth bypassing email confirmation.
                    The user should use <em>"Forgot Password"</em> to set their own password if none is specified.
                  </span>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-3 bg-emerald-800 text-white font-bold rounded-xl hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSaving ? "Saving..." : editingUser ? "Save Changes" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
