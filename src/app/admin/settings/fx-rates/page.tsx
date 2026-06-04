'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores';
import { getPermissions } from '@/lib/auth/permissions';
import { apiClient } from '@/lib/api/client';
import { Button, Input, Skeleton } from '@/components/ui';
import { Coins, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface FxRate {
  id: string;
  base: string;
  quote: string;
  rate: number;
  updatedAt: string;
  updatedBy: string | null;
}

const BASE = 'GHS';
const QUOTE = 'GBP';
const SAMPLE_GHS = 200;

function formatRelative(iso?: string): string {
  if (!iso) return 'never';
  const then = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return 'just now';
  const m = Math.floor(diffSec / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? '' : 's'} ago`;
}

function formatGbp(n: number): string {
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);
  } catch {
    return `£${n.toFixed(2)}`;
  }
}

export default function FxRatesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const permissions = useMemo(() => (user ? getPermissions(user.roles) : null), [user]);

  const [current, setCurrent] = useState<FxRate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login?redirect=/admin/settings/fx-rates');
      return;
    }
    if (permissions && !permissions.canManageFxRates) {
      router.push('/admin');
    }
  }, [authLoading, isAuthenticated, permissions, router]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiClient.get<{ status: boolean; data: FxRate }>(
          `/admin/settings/fx-rates/${BASE}/${QUOTE}`
        );
        setCurrent(res.data.data);
        setInput(String(res.data.data.rate));
      } catch {
        setError(`No ${BASE} → ${QUOTE} rate is configured yet. Set one below.`);
      } finally {
        setIsLoading(false);
      }
    };
    if (permissions?.canManageFxRates) {
      load();
    }
  }, [permissions]);

  const parsedRate = Number(input);
  const rateIsValid = !Number.isNaN(parsedRate) && parsedRate >= 0.001 && parsedRate <= 100;
  const isDirty = !current || Math.abs(parsedRate - current.rate) > 1e-9;

  const previewDisplay = rateIsValid ? SAMPLE_GHS * parsedRate : 0;
  const currentDisplay = current ? SAMPLE_GHS * current.rate : 0;
  const previewDelta = current ? previewDisplay - currentDisplay : 0;

  const handleSave = async () => {
    if (!rateIsValid) return;
    setSaving(true);
    setError(null);
    try {
      const res = await apiClient.put<{ status: boolean; data: FxRate }>(
        `/admin/settings/fx-rates/${BASE}/${QUOTE}`,
        { rate: parsedRate }
      );
      setCurrent(res.data.data);
      setInput(String(res.data.data.rate));
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 4000);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to update FX rate. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !permissions) {
    return null;
  }

  if (!permissions.canManageFxRates) {
    return null;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <Coins className="h-6 w-6 text-primary" />
          Display FX Rate
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Buyers outside Ghana see prices in their local currency. This rate controls only
          what they see on the storefront — Hubtel always charges in GHS.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Pair</p>
                <p className="font-medium text-gray-900">{BASE} → {QUOTE}</p>
              </div>
              <div>
                <p className="text-gray-500">Current rate</p>
                <p className="font-medium text-gray-900">
                  {current ? `1 ${BASE} = ${current.rate} ${QUOTE}` : 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Last updated</p>
                <p className="font-medium text-gray-900">{formatRelative(current?.updatedAt)}</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New rate (1 {BASE} = ? {QUOTE})
              </label>
              <Input
                type="number"
                step="0.0001"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. 0.05"
                error={!rateIsValid && input !== '' ? 'Rate must be between 0.001 and 100' : undefined}
              />

              <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-1">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Live preview</p>
                <p className="text-base text-gray-900">
                  A product priced{' '}
                  <span className="font-semibold">GHS {SAMPLE_GHS.toFixed(2)}</span>{' '}
                  will display to UK buyers as{' '}
                  <span className="font-semibold text-primary">
                    {rateIsValid ? formatGbp(previewDisplay) : '—'}
                  </span>
                </p>
                {current && rateIsValid && isDirty && (
                  <p className={`text-xs ${previewDelta >= 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                    Was {formatGbp(currentDisplay)} — change of {previewDelta >= 0 ? '+' : ''}
                    {formatGbp(previewDelta)} per GHS {SAMPLE_GHS.toFixed(2)}
                  </p>
                )}
              </div>

              {!rateIsValid && input !== '' && (
                <div className="mt-4 flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    That rate looks off. For GHS → GBP we expect roughly 0.04 – 0.07. Double-check
                    before saving.
                  </span>
                </div>
              )}

              {error && (
                <div className="mt-4 text-sm text-error bg-error-bg rounded-lg p-3">
                  {error}
                </div>
              )}

              {savedAt && (
                <div className="mt-4 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <CheckCircle2 className="h-4 w-4" />
                  Rate saved.
                </div>
              )}

              <div className="mt-6 flex items-center gap-3">
                <Button
                  onClick={handleSave}
                  isLoading={saving}
                  disabled={!rateIsValid || !isDirty}
                >
                  Save rate
                </Button>
                {current && isDirty && (
                  <button
                    type="button"
                    onClick={() => setInput(String(current.rate))}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <p><strong>Tip:</strong> rates outside 0.001 – 100 are rejected by the server as likely typos.</p>
        <p><strong>Reminder:</strong> changing this rate immediately updates what every UK buyer sees on the storefront.</p>
      </div>
    </div>
  );
}
