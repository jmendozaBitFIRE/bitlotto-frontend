'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { Raffle } from '@/lib/types';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:3001';

export default function EditRifaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [form, setForm] = useState({
    title: '',
    prizeDescription: '',
    prizeImage: '',
    ticketPrice: '',
    domain: '',
    status: 'draft' as string,
  });
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/raffles/${id}`).then((data: Raffle) => {
      setRaffle(data);
      setForm({
        title: data.title,
        prizeDescription: data.prizeDescription,
        prizeImage: data.prizeImage ?? '',
        ticketPrice: String(data.ticketPrice),
        domain: data.domain,
        status: data.status,
      });
      if (data.prizeImage) {
        setPreview(data.prizeImage.startsWith('http') ? data.prizeImage : `${BACKEND_URL}${data.prizeImage}`);
      }
      setLoading(false);
    });
  }, [id]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api(`/raffles/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ ...form, ticketPrice: parseFloat(form.ticketPrice) }),
      });
      router.push('/dashboard/rifas');
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!raffle) return <div className="text-muted-foreground">Rifa no encontrada.</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">Editar Rifa</h1>
          <p className="text-sm text-muted-foreground line-clamp-1">{raffle.title}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Información del premio</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Título</label>
              <Input value={form.title} onChange={set('title')} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Descripción</label>
              <textarea
                className="flex w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand transition-colors hover:border-white/20 resize-none"
                rows={3}
                value={form.prizeDescription}
                onChange={set('prizeDescription')}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Foto del premio</label>
              <div
                onClick={() => fileRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-white/10 p-6 transition-colors hover:border-brand/40 hover:bg-white/[0.02]"
              >
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="preview" className="max-h-32 rounded-lg object-contain" />
                ) : (
                  <><ImageIcon className="h-8 w-8 text-muted-foreground" /><p className="text-sm text-muted-foreground">Cambiar imagen</p></>
                )}
                {uploading && <Loader2 className="h-5 w-5 animate-spin text-brand" />}
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageUpload} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Configuración</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Precio por boleto (MXN)</label>
                <Input type="number" min="1" step="0.01" value={form.ticketPrice} onChange={set('ticketPrice')} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Estado</label>
                <select
                  value={form.status}
                  onChange={set('status')}
                  className="flex h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
                >
                  <option value="draft" className="bg-surface">Borrador</option>
                  <option value="active" className="bg-surface">Activa</option>
                  <option value="closed" className="bg-surface">Cerrada</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Dominio</label>
              <Input
                value={form.domain}
                onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
                required
              />
            </div>
          </CardContent>
        </Card>

        {error && <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">{error}</div>}

        <Button type="submit" className="w-full" disabled={saving || uploading}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar cambios'}
        </Button>
      </form>
    </div>
  );
}
