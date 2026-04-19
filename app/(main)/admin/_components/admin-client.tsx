'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Plus, Trash2, KeyRound, UserCheck, UserX, Shield, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

interface UserInfo {
  id: string;
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  totalROs: number;
  monthlyHours: number;
  yearlyHours: number;
  avgEarningPerDay: number;
}

export default function AdminClient() {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ email: '', password: '', firstName: '', lastName: '', username: '', role: 'user' });
  const [creating, setCreating] = useState(false);
  const [passwordModal, setPasswordModal] = useState<string | null>(null);
  const [newPw, setNewPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res?.json?.();
      if (res?.ok) setUsers(data?.users ?? []);
      else toast.error(data?.error ?? 'Failed to load users');
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const createUser = async () => {
    if (!createForm.email || !createForm.password) {
      toast.error('Email and password are required');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      const data = await res?.json?.();
      if (res?.ok) {
        toast.success('User created!');
        setShowCreate(false);
        setCreateForm({ email: '', password: '', firstName: '', lastName: '', username: '', role: 'user' });
        fetchUsers();
      } else {
        toast.error(data?.error ?? 'Failed to create user');
      }
    } catch {
      toast.error('Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (user: UserInfo) => {
    try {
      await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, action: 'toggle_active', isActive: user.isActive }),
      });
      toast.success(user.isActive ? 'User deactivated' : 'User activated');
      fetchUsers();
    } catch {
      toast.error('Failed to update user');
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Delete this user and ALL their data? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      const data = await res?.json?.();
      if (res?.ok) {
        toast.success('User deleted');
        fetchUsers();
      } else {
        toast.error(data?.error ?? 'Failed to delete user');
      }
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const changePassword = async () => {
    if (!passwordModal || !newPw || newPw.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: passwordModal, action: 'change_password', password: newPw }),
      });
      if (res?.ok) {
        toast.success('Password changed');
        setPasswordModal(null);
        setNewPw('');
      } else {
        const data = await res?.json?.();
        toast.error(data?.error ?? 'Failed');
      }
    } catch {
      toast.error('Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  const toggleRole = async (user: UserInfo) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, action: 'change_role', role: newRole }),
      });
      toast.success(`Role changed to ${newRole}`);
      fetchUsers();
    } catch {
      toast.error('Failed to change role');
    }
  };

  if (loading) return <div className="p-6 flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1e3a5f]">User Management</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">Manage technicians and admin users</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="bg-[#1e3a5f] hover:bg-[#2a4d7a]">
          <Plus className="h-4 w-4 mr-1" /> Create User
        </Button>
      </div>

      {/* Create User Form */}
      {showCreate && (
        <Card className="shadow-md border-sky-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">New User</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Email *</label>
                <Input value={createForm.email} onChange={(e: any) => setCreateForm(p => ({ ...p, email: e.target.value }))} placeholder="user@example.com" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Password *</label>
                <Input type="password" value={createForm.password} onChange={(e: any) => setCreateForm(p => ({ ...p, password: e.target.value }))} placeholder="Min 6 characters" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">First Name</label>
                <Input value={createForm.firstName} onChange={(e: any) => setCreateForm(p => ({ ...p, firstName: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Last Name</label>
                <Input value={createForm.lastName} onChange={(e: any) => setCreateForm(p => ({ ...p, lastName: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Username</label>
                <Input value={createForm.username} onChange={(e: any) => setCreateForm(p => ({ ...p, username: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Role</label>
                <select value={createForm.role} onChange={(e) => setCreateForm(p => ({ ...p, role: e.target.value }))} className="w-full border rounded-md px-3 py-2 text-sm">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={createUser} className="bg-[#1e3a5f] hover:bg-[#2a4d7a]" disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                Create
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Users className="h-5 w-5 text-sky-500" /> All Users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2 px-2 font-semibold text-gray-600">User</th>
                  <th className="text-center py-2 px-2 font-semibold text-gray-600">Role</th>
                  <th className="text-center py-2 px-2 font-semibold text-gray-600">Status</th>
                  <th className="text-right py-2 px-2 font-semibold text-gray-600 hidden sm:table-cell">ROs</th>
                  <th className="text-right py-2 px-2 font-semibold text-gray-600 hidden sm:table-cell">Mo. Hrs</th>
                  <th className="text-right py-2 px-2 font-semibold text-gray-600 hidden md:table-cell">Yr. Hrs</th>
                  <th className="text-right py-2 px-2 font-semibold text-gray-600 hidden md:table-cell">Avg $/Day</th>
                  <th className="text-center py-2 px-2 font-semibold text-gray-600 hidden md:table-cell">Joined</th>
                  <th className="text-center py-2 px-2 font-semibold text-gray-600 hidden lg:table-cell">Last Login</th>
                  <th className="text-center py-2 px-2 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className={`border-b border-gray-100 hover:bg-gray-50 ${!u.isActive ? 'opacity-50' : ''}`}>
                    <td className="py-2 px-2">
                      <div className="font-medium">{u.name ?? u.email}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                      {u.username && <div className="text-xs text-muted-foreground">@{u.username}</div>}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right hidden sm:table-cell">{u.totalROs}</td>
                    <td className="py-2 px-2 text-right hidden sm:table-cell">{u.monthlyHours.toFixed(1)}</td>
                    <td className="py-2 px-2 text-right hidden md:table-cell">{u.yearlyHours.toFixed(1)}</td>
                    <td className="py-2 px-2 text-right hidden md:table-cell font-medium text-emerald-700">${u.avgEarningPerDay.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="py-2 px-2 text-center hidden md:table-cell text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="py-2 px-2 text-center hidden lg:table-cell text-xs">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}</td>
                    <td className="py-2 px-2">
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        <button onClick={() => toggleActive(u)} className={`p-1 rounded hover:bg-gray-100 ${u.isActive ? 'text-amber-600' : 'text-green-600'}`} title={u.isActive ? 'Deactivate' : 'Activate'}>
                          {u.isActive ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                        </button>
                        <button onClick={() => { setPasswordModal(u.id); setNewPw(''); }} className="p-1 rounded hover:bg-gray-100 text-sky-600" title="Change password">
                          <KeyRound className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => toggleRole(u)} className="p-1 rounded hover:bg-gray-100 text-purple-600" title="Toggle role">
                          <Shield className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => deleteUser(u.id)} className="p-1 rounded hover:bg-gray-100 text-red-500" title="Delete user">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Password Change Modal */}
      {passwordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1e3a5f]">Change Password</h3>
              <button onClick={() => setPasswordModal(null)} className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5" /></button>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">New Password</label>
              <Input type="password" value={newPw} onChange={(e: any) => setNewPw(e.target.value)} placeholder="Min 6 characters" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPasswordModal(null)}>Cancel</Button>
              <Button onClick={changePassword} disabled={pwSaving} className="bg-[#1e3a5f] hover:bg-[#2a4d7a]">
                {pwSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
