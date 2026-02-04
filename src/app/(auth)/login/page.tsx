'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/lib/stores';
import { loginSchema, type LoginFormData } from '@/lib/validations';
import { Button, Input, Spinner } from '@/components/ui';
import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { Eye, EyeOff } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    try {
      await login(data);
      router.push(redirect);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; code?: string };
      // If backend is not available, show appropriate message
      if (error.code === 'ERR_NETWORK') {
        setError('Unable to connect to server. Please ensure the backend is running on localhost:8080');
      } else {
        setError(error.response?.data?.message || 'Invalid email or password');
      }
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Sign in to your account</h1>
      <p className="text-center text-gray-600 mb-8">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-primary font-medium hover:underline">
          Create one
        </Link>
      </p>

      {error && (
        <div className="mb-4 p-4 bg-error-bg text-error rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="mb-6">
        <OAuthButtons />
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-500 uppercase tracking-wide">Or</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.usernameOrEmail?.message}
          {...register('usernameOrEmail')}
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            error={errors.password?.message}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <span className="ml-2 text-sm text-gray-600">Remember me</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isSubmitting}
        >
          Sign in
        </Button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-8"><Spinner /></div>}>
      <LoginForm />
    </Suspense>
  );
}
