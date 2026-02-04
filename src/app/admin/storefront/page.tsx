'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { apiClient } from '@/lib/api/client';
import { StorefrontBanner } from '@/types';
import { Card, Button, Input, Spinner, ImageUpload } from '@/components/ui';
import { Image as ImageIcon, Save, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const slots = ['PRIMARY', 'SECONDARY'] as const;

type BannerSlot = typeof slots[number];

type BannerFormState = {
  eyebrow: string;
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
  active: boolean;
};

const createEmptyState = (): BannerFormState => ({
  eyebrow: '',
  headline: '',
  subheadline: '',
  ctaText: '',
  ctaLink: '',
  imageUrl: '',
  active: true,
});

export default function AdminStorefrontBannersPage() {
  const [banners, setBanners] = useState<StorefrontBanner[]>([]);
  const [formState, setFormState] = useState<Record<BannerSlot, BannerFormState>>({
    PRIMARY: createEmptyState(),
    SECONDARY: createEmptyState(),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [savingSlot, setSavingSlot] = useState<BannerSlot | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadBanners = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get<{ status: boolean; data: StorefrontBanner[] }>(
          '/admin/storefront/banners'
        );
        const data = response.data.data || [];
        setBanners(data);
      } catch (error) {
        console.error('Failed to fetch storefront banners', error);
        setBanners([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadBanners();
  }, []);

  useEffect(() => {
    if (!banners.length) {
      return;
    }

    setFormState((prev) => {
      const nextState = { ...prev };
      slots.forEach((slot) => {
        const banner = banners.find((item) => item.slot === slot);
        if (banner) {
          nextState[slot] = {
            eyebrow: banner.eyebrow || '',
            headline: banner.headline || '',
            subheadline: banner.subheadline || '',
            ctaText: banner.ctaText || '',
            ctaLink: banner.ctaLink || '',
            imageUrl: banner.imageUrl || '',
            active: banner.active !== false,
          };
        }
      });
      return nextState;
    });
  }, [banners]);

  const handleChange = (slot: BannerSlot, field: keyof BannerFormState, value: string | boolean) => {
    setFormState((prev) => ({
      ...prev,
      [slot]: {
        ...prev[slot],
        [field]: value,
      },
    }));
  };

  const handleSave = async (slot: BannerSlot) => {
    setSaveMessage(null);
    setSavingSlot(slot);
    try {
      const payload = formState[slot];
      const response = await apiClient.put<{ status: boolean; data: StorefrontBanner }>(
        `/admin/storefront/banners/${slot}`,
        payload
      );
      const updated = response.data.data;
      setBanners((prev) => {
        const next = prev.filter((banner) => banner.slot !== slot);
        return [...next, updated];
      });
      setSaveMessage(`${slot === 'PRIMARY' ? 'Primary' : 'Secondary'} banner updated.`);
    } catch (error) {
      console.error('Failed to update banner', error);
      setSaveMessage('Failed to update banner. Please try again.');
    } finally {
      setSavingSlot(null);
    }
  };

  const handleImageUpload = async (slot: BannerSlot, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<{ status: boolean; data: StorefrontBanner }>(
      `/admin/storefront/banners/${slot}/image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    const updated = response.data.data;
    setBanners((prev) => {
      const next = prev.filter((banner) => banner.slot !== slot);
      return [...next, updated];
    });
    setFormState((prev) => ({
      ...prev,
      [slot]: {
        ...prev[slot],
        imageUrl: updated.imageUrl || '',
      },
    }));
  };

  const previewBySlot = useMemo(() => {
    const previews: Record<BannerSlot, string | null> = {
      PRIMARY: null,
      SECONDARY: null,
    };

    slots.forEach((slot) => {
      const imageUrl = formState[slot].imageUrl;
      previews[slot] = imageUrl ? imageUrl : null;
    });

    return previews;
  }, [formState]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-gray-900">Storefront Banners</h1>
        <p className="text-sm text-gray-600">
          Update the hero and secondary banners on the storefront homepage. Changes are live immediately.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-3 text-gray-500">
          <Spinner size="sm" />
          Loading banners...
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {slots.map((slot) => {
            const form = formState[slot];
            const preview = previewBySlot[slot];
            const isSaving = savingSlot === slot;
            const title = slot === 'PRIMARY' ? 'Primary Hero Banner' : 'Secondary Banner';
            return (
              <Card key={slot} className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-gray-400">{slot}</p>
                    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                  </div>
                  <div
                    className={cn(
                      'flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full',
                      form.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    )}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {form.active ? 'Active' : 'Inactive'}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Upload Banner Image</p>
                    <ImageUpload
                      currentImage={form.imageUrl}
                      onUpload={(file) => handleImageUpload(slot, file)}
                      onRemove={() => handleChange(slot, 'imageUrl', '')}
                    />
                  </div>
                  <Input
                    label="Eyebrow"
                    placeholder="Short label (e.g. New Collection)"
                    value={form.eyebrow}
                    onChange={(e) => handleChange(slot, 'eyebrow', e.target.value)}
                  />
                  <Input
                    label="Headline"
                    placeholder="Main banner headline"
                    value={form.headline}
                    onChange={(e) => handleChange(slot, 'headline', e.target.value)}
                  />
                  <Input
                    label="Subheadline"
                    placeholder="Short supporting copy"
                    value={form.subheadline}
                    onChange={(e) => handleChange(slot, 'subheadline', e.target.value)}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="CTA Text"
                      placeholder="Button label"
                      value={form.ctaText}
                      onChange={(e) => handleChange(slot, 'ctaText', e.target.value)}
                    />
                    <Input
                      label="CTA Link"
                      placeholder="/products or https://"
                      value={form.ctaLink}
                      onChange={(e) => handleChange(slot, 'ctaLink', e.target.value)}
                    />
                  </div>
                  <Input
                    label="Image URL (optional)"
                    placeholder="Paste a URL instead of uploading"
                    value={form.imageUrl}
                    onChange={(e) => handleChange(slot, 'imageUrl', e.target.value)}
                  />
                </div>

                <div className="border border-dashed border-gray-200 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 text-xs uppercase tracking-widest text-gray-500">
                    <ImageIcon className="h-4 w-4" />
                    Preview
                  </div>
                  <div className="relative aspect-[16/9] bg-gray-100">
                    {preview ? (
                      <Image
                        src={preview}
                        alt={`${slot} banner preview`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
                        No image selected
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => handleChange(slot, 'active', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    Banner is active
                  </label>
                  <Button
                    onClick={() => handleSave(slot)}
                    disabled={isSaving}
                    className="min-w-[150px] justify-center"
                  >
                    {isSaving ? (
                      <span className="flex items-center gap-2">
                        <Spinner size="sm" />
                        Saving...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Save banner
                      </span>
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {saveMessage && (
        <div className="text-sm text-gray-600">{saveMessage}</div>
      )}
    </div>
  );
}
