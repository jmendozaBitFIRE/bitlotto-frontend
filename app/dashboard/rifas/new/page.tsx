'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Loader2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';

import { BACKEND_URL } from '@/lib/constants';

export default function NewRifaPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '',
    prizeDescription: '',
    prizeImage: '',
    ticketPrice: '',
    totalTickets: '',
    domain: '',
    status: 'draft' as 'draft' | 'active',
  });
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = (await import('@/lib/auth')).getAccessToken();
      const res = await fetch(`${BACKEND_URL}/api/raffles/upload/image`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setForm((f) => ({ ...f, prizeImage: data.url }));
      setPreview(`${BACKEND_URL}${data.url}`);
    } catch (err: any) {
      setError(err.message || 'Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, publish = false) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api('/raffles', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          ticketPrice: parseFloat(form.ticketPrice),
          totalTickets: parseInt(form.totalTickets, 10),
          status: publish ? 'active' : 'draft',
        }),
      });
      router.push('/dashboard/rifas');
    } catch (err: any) {
      setError(err.message || 'Error al crear la rifa');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">Nueva Rifa</h1>
          <p className="text-sm text-muted-foreground">Completa los datos del sorteo</p>
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Información del premio</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Título del sorteo</label>
              <Input placeholder="Ej. iPhone 16 Pro Max 256GB" value={form.title} onChange={set('title')} required />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Descripción del premio</label>
              <textarea
                className="flex w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand transition-colors hover:border-white/20 resize-none"
                rows={3}
                placeholder="Describe el premio en detalle..."
                value={form.prizeDescription}
                onChange={set('prizeDescription')}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Foto del premio</label>
              <div
                onClick={() => fileRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-white/10 p-8 transition-colors hover:border-brand/40 hover:bg-white/[0.02]"
              >
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="preview" className="max-h-40 rounded-lg object-contain" />
                ) : (
                  <>
                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Haz clic para subir imagen (JPG, PNG, max 5MB)</p>
                  </>
                )}
                {uploading && <Loader2 className="h-5 w-5 animate-spin text-brand" />}
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageUpload} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Configuración de boletos</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Precio por boleto (MXN)</label>
                <Input type="number" min="1" step="0.01" placeholder="50" value={form.ticketPrice} onChange={set('ticketPrice')} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total de boletos</label>
                <Input type="number" min="1" step="1" placeholder="100" value={form.totalTickets} onChange={set('totalTickets')} required />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Dominio (slug único)</label>
              <Input
                placeholder="iphone-16-pro"
                value={form.domain}
                onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
                required
              />
              <p className="text-xs text-muted-foreground">Solo letras minúsculas, números y guiones. Tu landing: /rifas/{form.domain || 'tu-dominio'}</p>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" variant="secondary" disabled={saving || uploading} className="flex-1">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar como borrador'}
          </Button>
          <Button
            type="button"
            disabled={saving || uploading}
            className="flex-1"
            onClick={(e) => handleSubmit(e as any, true)}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Publicar rifa'}
          </Button>
        </div>
      </form>
    </div>
  );
}
