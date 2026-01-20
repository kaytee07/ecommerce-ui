'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import { Button, Spinner } from '@/components/ui';
import { CheckCircle, XCircle, Mail } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no-token'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('no-token');
      setMessage('No verification token provided.');
      return;
    }

    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await apiClient.get(`/auth/verify-email?token=${verificationToken}`);
      setStatus('success');
      setMessage(response.data.message || 'Your email has been verified successfully!');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login?verified=true');
      }, 3000);
    } catch (err: unknown) {
      setStatus('error');
      const error = err as { response?: { data?: { message?: string } } };
      setMessage(error.response?.data?.message || 'Failed to verify email. The link may have expired.');
    }
  };

  if (status === 'loading') {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="h-8 w-8 text-primary animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Your Email</h1>
        <p className="text-gray-600 mb-8">Please wait while we verify your email address...</p>
        <Spinner size="lg" />
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-8 w-8 text-success" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h1>
        <p className="text-gray-600 mb-8">{message}</p>
        <p className="text-sm text-gray-500 mb-4">Redirecting to login...</p>
        <Link href="/login">
          <Button>Go to Login</Button>
        </Link>
      </div>
    );
  }

  if (status === 'error' || status === 'no-token') {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="h-8 w-8 text-error" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
        <p className="text-gray-600 mb-8">{message}</p>
        <div className="space-y-4">
          <Link href="/login">
            <Button>Go to Login</Button>
          </Link>
          <p className="text-sm text-gray-500">
            Need a new verification link?{' '}
            <Link href="/resend-verification" className="text-primary hover:underline">
              Resend verification email
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return null;
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
