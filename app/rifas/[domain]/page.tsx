'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Upload, CheckCircle2 } from 'lucide-react';
import { PublicRaffle, Ticket } from '@/lib/types';

import { API_URL as API, BACKEND_URL as BACKEND } from '@/lib/constants';
const RESERVE_SECONDS = 15 * 60;

type Phase = 'selecting' | 'reserved' | 'buyer-info' | 'payment' | 'done';

function formatTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error en la petición');
  return data;
}

export default function PublicRafflePage() {
  const { domain } = useParams<{ domain: string }>();

  const [raffle, setRaffle] = useState<PublicRaffle | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<Phase>('selecting');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(RESERVE_SECONDS);
  const [buyerForm, setBuyerForm] = useState({ name: '', phone: '', city: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'done'>('idle');
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchRaffle = useCallback(async () => {
    try {
      const data: PublicRaffle = await fetch(`${API}/public/raffles/${domain}`).then((r) => r.json());
      if (!data.id) throw new Error('Rifa no encontrada');
      setRaffle(data);
      setTickets(data.tickets);
    } catch (err: any) {
      setError(err.message || 'Rifa no disponible');
    } finally {
      setLoading(false);
    }
  }, [domain]);

  useEffect(() => { fetchRaffle(); }, [fetchRaffle]);

  // 15-min countdown during reserved phase
  useEffect(() => {
    if (phase !== 'reserved' && phase !== 'buyer-info') return;
    if (timeLeft <= 0) {
      setPhase('selecting');
      setSelected(new Set());
      setTimeLeft(RESERVE_SECONDS);
      fetchRaffle();
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [phase, timeLeft, fetchRaffle]);

  const availableTickets = useMemo(
    () => tickets.filter((t) => t.status === 'available'),
    [tickets],
  );

  const toggleTicket = (ticket: Ticket) => {
    if (ticket.status !== 'available') return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(ticket.id) ? next.delete(ticket.id) : next.add(ticket.id);
      return next;
    });
  };

  const quickPick = (n: number) => {
    const pool = availableTickets.filter((t) => !selected.has(t.id));
    const picks = pool.sort(() => Math.random() - 0.5).slice(0, n);
    setSelected((prev) => {
      const next = new Set(prev);
      picks.forEach((t) => next.add(t.id));
      return next;
    });
  };

  const handleReserve = async () => {
    if (selected.size === 0 || !raffle) return;
    setSubmitting(true);
    setError('');
    try {
      await postJson(`${API}/public/tickets/reserve`, {
        raffleId: raffle.id,
        ticketIds: Array.from(selected),
      });
      setPhase('reserved');
      setTimeLeft(RESERVE_SECONDS);
      // Update local ticket states optimistically
      setTickets((prev) =>
        prev.map((t) => (selected.has(t.id) ? { ...t, status: 'reserved' as const } : t)),
      );
    } catch (err: any) {
      setError(err.message);
      fetchRaffle();
    } finally {
      setSubmitting(false);
    }
  };

  const handleBuyerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!raffle) return;
    setSubmitting(true);
    setError('');
    try {
      const order = await postJson(`${API}/public/orders`, {
        raffleId: raffle.id,
        ticketIds: Array.from(selected),
        buyerName: buyerForm.name,
        buyerPhone: buyerForm.phone,
        buyerCity: buyerForm.city,
      });
      setOrderId(order.id);
      setPhase('payment');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !orderId) return;
    setUploadStatus('uploading');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API}/public/orders/${orderId}/receipt`, {
        method: 'PATCH',
        body: formData,
      });
      if (!res.ok) throw new Error('Error al subir comprobante');
      setUploadStatus('done');
      setPhase('done');
    } catch (err: any) {
      setError(err.message);
      setUploadStatus('idle');
    }
  };

  const selectedTicketNumbers = useMemo(
    () => tickets.filter((t) => selected.has(t.id)).map((t) => t.number),
    [tickets, selected],
  );

  const total = raffle ? selectedTicketNumbers.length * raffle.ticketPrice : 0;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="h-8 w-8 animate-spin text-[#F5A623]" />
      </div>
    );
  }

  if (error && !raffle) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-center px-4">
        <div>
          <p className="text-2xl font-bold text-white mb-2">Rifa no disponible</p>
          <p className="text-[#A1A1AA]">{error}</p>
        </div>
      </div>
    );
  }

  if (!raffle) return null;

  const imageUrl = raffle.prizeImage
    ? raffle.prizeImage.startsWith('http') ? raffle.prizeImage : `${BACKEND}${raffle.prizeImage}`
    : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-[system-ui]">

      {/* ─── SECTION 1: Hero ─── */}
      <section className="relative h-[70vh] min-h-[480px] w-full overflow-hidden">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={raffle.title} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-[#1c1c1c]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
        <div className="absolute bottom-0 left-0 p-8 sm:p-14 max-w-2xl">
          <span className="mb-4 inline-block rounded-full bg-[#F5A623] px-4 py-1.5 text-sm font-bold text-black">
            ${raffle.ticketPrice} MXN por boleto
          </span>
          <h1 className="text-4xl sm:text-6xl font-black leading-tight text-white mb-3">
            {raffle.title}
          </h1>
          <p className="text-[#A1A1AA] text-lg leading-relaxed">{raffle.prizeDescription}</p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-10 space-y-10">

        {/* ─── SECTION 2: Máquina de la Suerte ─── */}
        {phase === 'selecting' && (
          <div className="rounded-xl bg-[#1c1c1c] p-6">
            <div className="mb-4">
              <p className="text-lg font-bold">🎟 Máquina de la Suerte</p>
              <p className="text-sm text-[#A1A1AA]">Selecciona boletos al azar rápidamente.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {[1, 2, 5, 10, 20].map((n) => (
                <button
                  key={n}
                  onClick={() => quickPick(n)}
                  disabled={availableTickets.length < n}
                  className="rounded-full border border-[#F5A623]/30 bg-[#F5A623]/10 px-5 py-2 text-sm font-semibold text-[#F5A623] transition-colors hover:bg-[#F5A623]/20 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  +{n}
                </button>
              ))}
              {selected.size > 0 && (
                <button
                  onClick={() => setSelected(new Set())}
                  className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-[#A1A1AA] transition-colors hover:bg-white/10"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>
        )}

        {/* ─── SECTION 3: Ticket grid (only in selecting phase) ─── */}
        {phase === 'selecting' && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Elige tus números</h2>
              <div className="flex items-center gap-4 text-xs text-[#A1A1AA]">
                <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm bg-[#1e1e1e] border border-white/20" /> Disponible</span>
                <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm bg-[#F5A623]" /> Seleccionado</span>
                <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm bg-[#1e1e1e] border border-[#8B0000]/40" /> Ocupado</span>
              </div>
            </div>
            <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
              {tickets.map((ticket) => {
                const isSelected = selected.has(ticket.id);
                const isOccupied = ticket.status !== 'available';
                return (
                  <button
                    key={ticket.id}
                    onClick={() => toggleTicket(ticket)}
                    disabled={isOccupied}
                    className={[
                      'aspect-square rounded-md text-xs font-mono font-semibold transition-colors',
                      isSelected
                        ? 'bg-[#F5A623] text-black'
                        : isOccupied
                        ? 'cursor-not-allowed bg-[#1e1e1e] text-[#8B0000]/70 border border-[#8B0000]/20'
                        : 'bg-[#1e1e1e] text-white hover:bg-[#2a2a2a] border border-white/5',
                    ].join(' ')}
                  >
                    {ticket.number}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── RESERVED CONFIRMATION + BUYER FORM ─── */}
        {(phase === 'reserved' || phase === 'buyer-info') && (
          <div className="space-y-6">
            <div className="rounded-xl border border-[#F5A623]/30 bg-[#1a1500] p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[#F5A623] font-bold text-xl mb-1">¡Boletos Apartados!</p>
                  <p className="text-sm text-[#A1A1AA]">
                    Tienes <span className="text-white font-semibold">{formatTime(timeLeft)}</span> para completar tu pago antes de que se liberen.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedTicketNumbers.map((num) => (
                  <span key={num} className="rounded-full bg-[#F5A623] px-3 py-1 text-xs font-mono font-bold text-black">
                    {num}
                  </span>
                ))}
              </div>
              <p className="text-2xl font-bold text-white">
                Total a pagar: <span className="text-[#F5A623]">${total.toFixed(2)} MXN</span>
              </p>
            </div>

            <div className="rounded-xl bg-[#1c1c1c] p-6">
              <h3 className="text-lg font-bold mb-5">Tus Datos</h3>
              <form onSubmit={handleBuyerSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={buyerForm.name}
                  onChange={(e) => setBuyerForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white placeholder:text-[#A1A1AA] focus:outline-none focus:ring-1 focus:ring-[#F5A623]"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="tel"
                    placeholder="Teléfono WhatsApp (10 dígitos)"
                    value={buyerForm.phone}
                    onChange={(e) => setBuyerForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    required
                    maxLength={10}
                    className="rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white placeholder:text-[#A1A1AA] focus:outline-none focus:ring-1 focus:ring-[#F5A623]"
                  />
                  <input
                    type="text"
                    placeholder="Estado / Ciudad"
                    value={buyerForm.city}
                    onChange={(e) => setBuyerForm((f) => ({ ...f, city: e.target.value }))}
                    required
                    className="rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white placeholder:text-[#A1A1AA] focus:outline-none focus:ring-1 focus:ring-[#F5A623]"
                  />
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-[#B8860B] py-4 text-base font-bold text-white transition-colors hover:bg-[#9a7009] disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : 'Continuar al Pago'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ─── PAYMENT: Receipt upload ─── */}
        {phase === 'payment' && (
          <div className="rounded-xl bg-[#1c1c1c] p-6 space-y-5">
            <div>
              <h3 className="text-lg font-bold mb-1">Sube tu comprobante de pago</h3>
              <p className="text-sm text-[#A1A1AA]">
                Realiza tu transferencia por <span className="text-white font-semibold">${total.toFixed(2)} MXN</span> y sube la foto o captura del comprobante.
              </p>
            </div>

            <div className="rounded-xl border border-[#F5A623]/20 bg-[#1a1500] p-4 text-sm text-[#A1A1AA]">
              <p className="font-medium text-[#F5A623] mb-1">Tus boletos apartados:</p>
              <div className="flex flex-wrap gap-2">
                {selectedTicketNumbers.map((num) => (
                  <span key={num} className="rounded-full bg-[#F5A623]/10 px-2.5 py-0.5 text-xs font-mono text-[#F5A623] border border-[#F5A623]/20">
                    {num}
                  </span>
                ))}
              </div>
            </div>

            <div
              onClick={() => fileRef.current?.click()}
              className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[#F5A623]/20 p-10 transition-colors hover:border-[#F5A623]/40 hover:bg-[#F5A623]/[0.03]"
            >
              {uploadStatus === 'uploading' ? (
                <Loader2 className="h-8 w-8 animate-spin text-[#F5A623]" />
              ) : (
                <Upload className="h-8 w-8 text-[#F5A623]" />
              )}
              <p className="text-sm text-[#A1A1AA]">Haz clic para subir tu comprobante (JPG, PNG)</p>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleReceiptUpload} />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>
        )}

        {/* ─── DONE ─── */}
        {phase === 'done' && (
          <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-10 text-center space-y-4">
            <CheckCircle2 className="mx-auto h-14 w-14 text-green-500" />
            <h3 className="text-2xl font-bold text-white">¡Comprobante enviado!</h3>
            <p className="text-[#A1A1AA] max-w-sm mx-auto">
              Tu pago está en revisión. El organizador confirmará tu orden pronto. ¡Mucha suerte!
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {selectedTicketNumbers.map((num) => (
                <span key={num} className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-mono text-green-400 border border-green-500/20">
                  {num}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── STICKY BOTTOM BAR ─── */}
      {phase === 'selecting' && selected.size > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-white/5 bg-[#0a0a0a]/90 backdrop-blur-md px-4 py-4">
          <div className="mx-auto flex max-w-4xl items-center justify-between">
            <div>
              <p className="text-sm text-[#A1A1AA]">{selected.size} boleto{selected.size !== 1 ? 's' : ''} seleccionado{selected.size !== 1 ? 's' : ''}</p>
              <p className="text-xl font-bold text-[#F5A623]">${total.toFixed(2)} MXN</p>
            </div>
            <button
              onClick={handleReserve}
              disabled={submitting}
              className="rounded-full bg-[#F5A623] px-8 py-3 text-base font-bold text-black transition-colors hover:bg-[#d4911f] disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Apartar Boletos'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
