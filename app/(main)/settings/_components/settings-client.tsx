'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DollarSign, Plus, Trash2, Save, Loader2, User, Lock, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';
import SettingsBackupCard from './settings-backup-card';

interface HourlyRate {
  id: string;
  rate: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  description: string | null;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  name: string;
}

interface RateForm {
  rate: string;
  effectiveFrom: string;
  effectiveTo: string;
  description: string;
}

function toDateInputValue(value: string | null | undefined) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toISOString().slice(0, 10);
}

export default function SettingsClient() {
  const [rates, setRates] = useState<HourlyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [editingRate, setEditingRate] = useState<RateForm>({
    rate: '',
    effectiveFrom: '',
    effectiveTo: '',
    description: '',
  });
  const [rateUpdating, setRateUpdating] = useState(false);
  const [newRate, setNewRate] = useState<RateForm>({
    rate: '',
    effectiveFrom: '',
    effectiveTo: '',
    description: '',
  });

  const [profile, setProfile] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    name: '',
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);

  const fetchRates = useCallback(async () => {
    try {
      const res = await fetch('/api/rates');
      const data = await res?.json?.();
      setRates(data?.rates ?? []);
    } catch {
      toast.error('Failed to load rates');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/profile');
      const data = await res?.json?.();
      if (data?.user) {
        setProfile({
          firstName: data.user.firstName ?? '',
          lastName: data.user.lastName ?? '',
          username: data.user.username ?? '',
          email: data.user.email ?? '',
          name: data.user.name ?? '',
        });
      }
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
    fetchProfile();
  }, [fetchRates, fetchProfile]);

  const addRate = useCallback(async () => {
    if (!newRate?.rate || !newRate?.effectiveFrom) {
      toast.error('Rate and start date are required');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rate: parseFloat(newRate.rate),
          effectiveFrom: newRate.effectiveFrom,
          effectiveTo: newRate.effectiveTo || null,
          description: newRate.description || null,
        }),
      });

      if (res?.ok) {
        toast.success('Rate added!');
        setNewRate({ rate: '', effectiveFrom: '', effectiveTo: '', description: '' });
        fetchRates();
      } else {
        const d = await res?.json?.();
        toast.error(d?.error ?? 'Failed to add rate');
      }
    } catch {
      toast.error('Failed to add rate');
    } finally {
      setSaving(false);
    }
  }, [newRate, fetchRates]);

  const startEditingRate = useCallback((rate: HourlyRate) => {
    setEditingRateId(rate.id);
    setEditingRate({
      rate: String(rate.rate ?? ''),
      effectiveFrom: toDateInputValue(rate.effectiveFrom),
      effectiveTo: toDateInputValue(rate.effectiveTo),
      description: rate.description ?? '',
    });
  }, []);

  const cancelEditingRate = useCallback(() => {
    setEditingRateId(null);
    setEditingRate({ rate: '', effectiveFrom: '', effectiveTo: '', description: '' });
  }, []);

  const saveRate = useCallback(async () => {
    if (!editingRateId) return;

    const rateAmount = parseFloat(editingRate.rate);
    if (!Number.isFinite(rateAmount) || rateAmount < 0 || !editingRate.effectiveFrom) {
      toast.error('Valid rate and start date are required');
      return;
    }

    if (editingRate.effectiveTo && editingRate.effectiveTo < editingRate.effectiveFrom) {
      toast.error('End date must be after start date');
      return;
    }

    setRateUpdating(true);
    try {
      const res = await fetch('/api/rates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRateId,
          rate: rateAmount,
          effectiveFrom: editingRate.effectiveFrom,
          effectiveTo: editingRate.effectiveTo || null,
          description: editingRate.description || null,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to update rate');
      }

      toast.success('Rate updated');
      cancelEditingRate();
      fetchRates();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update rate');
    } finally {
      setRateUpdating(false);
    }
  }, [editingRate, editingRateId, cancelEditingRate, fetchRates]);

  const deleteRate = useCallback(async (id: string) => {
    if (!confirm('Delete this rate?')) return;

    try {
      const res = await fetch(`/api/rates?id=${id}`, { method: 'DELETE' });
      if (res?.ok) {
        toast.success('Rate deleted');
        fetchRates();
      } else {
        toast.error('Failed to delete rate');
      }
    } catch {
      toast.error('Failed to delete rate');
    }
  }, [fetchRates]);

  const saveProfile = async () => {
    setProfileSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const data = await res?.json?.();

      if (res?.ok) {
        toast.success('Profile updated!');
      } else {
        toast.error(data?.error ?? 'Failed to update profile');
      }
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const changePassword = async () => {
    if (!passwords.currentPassword || !passwords.newPassword) {
      toast.error('Current and new password are required');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });

      const data = await res?.json?.();

      if (res?.ok) {
        toast.success('Password changed!');
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(data?.error ?? 'Failed to change password');
      }
    } catch {
      toast.error('Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#1e3a5f]">Settings</h1>
        <p className="text-muted-foreground text-xs sm:text-sm">
          Manage your profile, password, hourly rates, and backup
        </p>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-5 w-5 text-sky-500" /> Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">First Name</label>
              <Input
                value={profile.firstName}
                onChange={(e: any) => setProfile((p) => ({ ...p, firstName: e?.target?.value ?? '' }))}
                placeholder="First name"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Last Name</label>
              <Input
                value={profile.lastName}
                onChange={(e: any) => setProfile((p) => ({ ...p, lastName: e?.target?.value ?? '' }))}
                placeholder="Last name"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Username</label>
              <Input
                value={profile.username}
                onChange={(e: any) => setProfile((p) => ({ ...p, username: e?.target?.value ?? '' }))}
                placeholder="Username"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Email</label>
              <Input
                value={profile.email}
                onChange={(e: any) => setProfile((p) => ({ ...p, email: e?.target?.value ?? '' }))}
                placeholder="Email"
                type="email"
              />
            </div>
          </div>

          <Button
            onClick={saveProfile}
            className="bg-[#1e3a5f] hover:bg-[#2a4d7a]"
            disabled={profileSaving}
          >
            {profileSaving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Save Profile
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-500" /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Current Password</label>
            <Input
              type="password"
              value={passwords.currentPassword}
              onChange={(e: any) => setPasswords((p) => ({ ...p, currentPassword: e?.target?.value ?? '' }))}
              placeholder="Current password"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">New Password</label>
              <Input
                type="password"
                value={passwords.newPassword}
                onChange={(e: any) => setPasswords((p) => ({ ...p, newPassword: e?.target?.value ?? '' }))}
                placeholder="New password"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Confirm New Password</label>
              <Input
                type="password"
                value={passwords.confirmPassword}
                onChange={(e: any) => setPasswords((p) => ({ ...p, confirmPassword: e?.target?.value ?? '' }))}
                placeholder="Confirm password"
              />
            </div>
          </div>

          <Button
            onClick={changePassword}
            className="bg-amber-600 hover:bg-amber-700 text-white"
            disabled={passwordSaving}
          >
            {passwordSaving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Lock className="h-4 w-4 mr-1" />
            )}
            Change Password
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" /> Hourly Rates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {(rates ?? []).map((r: HourlyRate) => {
              const isEditing = editingRateId === r.id;

              if (isEditing) {
                return (
                  <div key={r?.id} className="bg-muted/50 rounded-lg p-3 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground">Rate ($/hr)</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editingRate.rate}
                          onChange={(e) => setEditingRate((p) => ({ ...p, rate: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Description</label>
                        <Input
                          value={editingRate.description}
                          onChange={(e) => setEditingRate((p) => ({ ...p, description: e.target.value }))}
                          placeholder="Standard rate"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Effective From</label>
                        <Input
                          type="date"
                          value={editingRate.effectiveFrom}
                          onChange={(e) => setEditingRate((p) => ({ ...p, effectiveFrom: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Effective To (blank = ongoing)</label>
                        <Input
                          type="date"
                          value={editingRate.effectiveTo}
                          onChange={(e) => setEditingRate((p) => ({ ...p, effectiveTo: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button size="sm" onClick={saveRate} disabled={rateUpdating}>
                        {rateUpdating ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-1" />
                        )}
                        Save Rate
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEditingRate} disabled={rateUpdating}>
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={r?.id} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg">${r?.rate?.toFixed?.(2) ?? '0.00'}/hr</span>
                    {r?.description && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {r.description}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {r?.effectiveFrom ? new Date(r.effectiveFrom).toLocaleDateString() : 'N/A'}
                    {' → '}
                    {r?.effectiveTo ? new Date(r.effectiveTo).toLocaleDateString() : 'Ongoing'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => startEditingRate(r)}>
                    <Pencil className="h-4 w-4 text-sky-600" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteRate(r?.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
              );
            })}
            {(rates?.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No rates configured</p>
            )}
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Add New Rate</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Rate ($/hr) *</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="55.00"
                  value={newRate?.rate ?? ''}
                  onChange={(e: any) => setNewRate((p: any) => ({ ...(p ?? {}), rate: e?.target?.value ?? '' }))}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Description</label>
                <Input
                  placeholder="e.g. New rate increase"
                  value={newRate?.description ?? ''}
                  onChange={(e: any) => setNewRate((p: any) => ({ ...(p ?? {}), description: e?.target?.value ?? '' }))}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Effective From *</label>
                <Input
                  type="date"
                  value={newRate?.effectiveFrom ?? ''}
                  onChange={(e: any) => setNewRate((p: any) => ({ ...(p ?? {}), effectiveFrom: e?.target?.value ?? '' }))}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Effective To (blank = ongoing)</label>
                <Input
                  type="date"
                  value={newRate?.effectiveTo ?? ''}
                  onChange={(e: any) => setNewRate((p: any) => ({ ...(p ?? {}), effectiveTo: e?.target?.value ?? '' }))}
                />
              </div>
            </div>

            <Button
              onClick={addRate}
              className="mt-3 bg-[#1e3a5f] hover:bg-[#2a4d7a]"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-1" />
              )}
              Add Rate
            </Button>
          </div>
        </CardContent>
      </Card>

      <SettingsBackupCard />
    </div>
  );
}
