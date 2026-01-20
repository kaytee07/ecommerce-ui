'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/lib/stores';
import { apiClient } from '@/lib/api/client';
import { Button, Input } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { Check } from 'lucide-react';

interface ProfileFormData {
  fullName: string;
  email: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const toast = useToast();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    defaultValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
    },
  });

  const passwordForm = useForm<PasswordFormData>();

  const onUpdateProfile = async (data: ProfileFormData) => {
    setIsUpdatingProfile(true);
    try {
      const response = await apiClient.put<{ status: boolean; data: typeof user; message: string }>(
        `/users/${user?.id}`,
        data
      );
      setUser(response.data.data);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const onUpdatePassword = async (data: PasswordFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      passwordForm.setError('confirmPassword', { message: 'Passwords do not match' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await apiClient.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      passwordForm.reset();
      toast.success('Password updated successfully');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>

      {/* Profile Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-6">Profile Information</h2>

        <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-4 max-w-md">
          <Input
            label="Full Name"
            {...profileForm.register('fullName', { required: 'Name is required' })}
            error={profileForm.formState.errors.fullName?.message}
          />

          <Input
            label="Email"
            type="email"
            disabled
            className="bg-gray-50"
            {...profileForm.register('email')}
          />
          <p className="text-xs text-gray-500 -mt-2">Email cannot be changed</p>

          <Button type="submit" isLoading={isUpdatingProfile}>
            Save Changes
          </Button>
        </form>
      </div>

      {/* Password Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-6">Change Password</h2>

        <form onSubmit={passwordForm.handleSubmit(onUpdatePassword)} className="space-y-4 max-w-md">
          <Input
            label="Current Password"
            type="password"
            {...passwordForm.register('currentPassword', { required: 'Current password is required' })}
            error={passwordForm.formState.errors.currentPassword?.message}
          />

          <Input
            label="New Password"
            type="password"
            {...passwordForm.register('newPassword', {
              required: 'New password is required',
              minLength: { value: 8, message: 'Password must be at least 8 characters' },
            })}
            error={passwordForm.formState.errors.newPassword?.message}
          />

          <Input
            label="Confirm New Password"
            type="password"
            {...passwordForm.register('confirmPassword', { required: 'Please confirm your password' })}
            error={passwordForm.formState.errors.confirmPassword?.message}
          />

          <Button type="submit" isLoading={isUpdatingPassword}>
            Update Password
          </Button>
        </form>
      </div>
    </div>
  );
}
