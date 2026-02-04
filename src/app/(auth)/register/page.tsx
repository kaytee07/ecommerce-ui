'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/lib/stores';
import { registerSchema, type RegisterFormData } from '@/lib/validations';
import { Button, Input } from '@/components/ui';
import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { Eye, EyeOff, Check } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { register: registerUser } = useAuthStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      acceptTerms: false,
    },
  });

  const password = watch('password', '');

  const passwordRequirements = [
    { met: password.length >= 8, text: 'At least 8 characters' },
    { met: /[A-Z]/.test(password), text: 'One uppercase letter' },
    { met: /[0-9]/.test(password), text: 'One number' },
  ];

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    try {
      await registerUser({
        username: data.username,
        email: data.email,
        password: data.password,
        fullName: data.fullName,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto w-16 h-16 bg-success-bg rounded-full flex items-center justify-center mb-4">
          <Check className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration successful!</h2>
        <p className="text-gray-600 mb-4">
          Please check your email to verify your account.
        </p>
        <p className="text-sm text-gray-500">
          Redirecting to login...
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Create your account</h1>
      <p className="text-center text-gray-600 mb-8">
        Already have an account?{' '}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Sign in
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
          label="Full Name"
          placeholder="John Doe"
          error={errors.fullName?.message}
          {...register('fullName')}
        />

        <Input
          label="Username"
          placeholder="johndoe"
          error={errors.username?.message}
          {...register('username')}
        />

        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a password"
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

        {/* Password Requirements */}
        <div className="space-y-1">
          {passwordRequirements.map((req, i) => (
            <div key={i} className="flex items-center text-sm">
              <Check
                className={`h-4 w-4 mr-2 ${
                  req.met ? 'text-success' : 'text-gray-300'
                }`}
              />
              <span className={req.met ? 'text-success' : 'text-gray-500'}>
                {req.text}
              </span>
            </div>
          ))}
        </div>

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <div className="flex items-start">
          <input
            type="checkbox"
            id="acceptTerms"
            className="h-4 w-4 mt-0.5 text-primary border-gray-300 rounded focus:ring-primary"
            {...register('acceptTerms')}
          />
          <label htmlFor="acceptTerms" className="ml-2 text-sm text-gray-600">
            I agree to the{' '}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </label>
        </div>
        {errors.acceptTerms && (
          <p className="text-sm text-error">{errors.acceptTerms.message}</p>
        )}

        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isSubmitting}
        >
          Create account
        </Button>
      </form>
    </div>
  );
}
