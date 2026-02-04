'use client';

import { Button } from '@/components/ui';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
const OAUTH_BASE_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
const GOOGLE_OAUTH_URL = `${OAUTH_BASE_URL}/oauth2/authorization/google?prompt=select_account`;

export function OAuthButtons() {
  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2 border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
        onClick={() => {
          window.location.href = GOOGLE_OAUTH_URL;
        }}
      >
        <GoogleIcon />
        Continue with Google
      </Button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
      className="h-5 w-5"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.7 1.23 9.2 3.64l6.9-6.9C35.9 2.4 30.3 0 24 0 14.6 0 6.4 5.4 2.5 13.3l8 6.2C12.5 13.2 17.8 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.1 24.5c0-1.6-.14-2.8-.45-4.1H24v7.8h12.6c-.25 2-1.6 5-4.6 7.1l7.1 5.5c4.1-3.8 6.4-9.4 6.4-16.3z"
      />
      <path
        fill="#FBBC05"
        d="M10.5 28.1c-.5-1.6-.8-3.3-.8-5.1s.3-3.5.8-5.1l-8-6.2C.9 14.7 0 19.2 0 24s.9 9.3 2.5 12.3l8-6.2z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.3 0 11.6-2.1 15.5-5.7l-7.1-5.5c-1.9 1.3-4.5 2.2-8.4 2.2-6.2 0-11.5-3.7-13.5-9.4l-8 6.2C6.4 42.6 14.6 48 24 48z"
      />
    </svg>
  );
}
