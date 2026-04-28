'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/api';
import { Raffle, TicketOrder } from '@/lib/types';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:3001';

const orderStatusVariant: Record<string, 'secondary' | 'success' | 'destructive'> = {
  pending: 'secondary',
  confirmed: 'success',
  rejected: 'destructive',
};
const orderStatusLabel: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  rejected: 'Rechazado',
};

export default function RaffleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [orders, setOrders] = useState<TicketOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [raffleData, ordersData] = await Promise.all([
        api(`/raffles/${id}`),
        api(`/raffles/${id}/orders`),
      ]);
      setRaffle(raffleData);
      setOrders(ordersData);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAction = async (orderId: string, status: 'confirmed' | 'rejected') => {
    setActionId(orderId);
    try {
      const updated: TicketOrder = await api(`/raffles/${id}/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!raffle) return <div className="text-muted-foreground">Rifa no encontrada.</div>;

  const sold = raffle.soldCount ?? 0;
  const pending = orders.filter((o) => o.status === 'pending').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Image preview modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setPreviewImage(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewImage} alt="comprobante" className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain" />
        </div>
      )}

      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-white truncate">{raffle.title}</h1>
          <p className="text-sm text-muted-foreground">/rifas/{raffle.domain}</p>
        </div>
        {raffle.status === 'active' && (
          <a href={`/rifas/${raffle.domain}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4" />
              Ver landing
            </Button>
          </a>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Boletos vendidos', value: sold },
          { label: 'Total boletos', value: raffle.totalTickets },
          { label: 'Precio', value: `$${raffle.ticketPrice} MXN` },
          { label: 'Órdenes pendientes', value: pending },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Órdenes de compra</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">No hay órdenes todavía.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead>Comprador</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Boletos</TableHead>
                  <TableHead>Comprobante</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} className="border-white/5">
                    <TableCell className="font-medium text-white">{order.buyerName}</TableCell>
                    <TableCell className="text-muted-foreground">{order.buyerPhone}</TableCell>
                    <TableCell className="text-muted-foreground">{order.buyerCity}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {(Array.isArray(order.ticketIds) ? order.ticketIds : []).slice(0, 5).map((tid) => (
                          <span key={tid} className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand font-mono">
                            #{tid.slice(-4)}
                          </span>
                        ))}
                        {order.ticketIds.length > 5 && (
                          <span className="text-xs text-muted-foreground">+{order.ticketIds.length - 5}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.receiptImage ? (
                        <button
                          onClick={() => setPreviewImage(`${BACKEND_URL}${order.receiptImage}`)}
                          className="text-xs text-brand hover:text-gold-400 underline underline-offset-2 transition-colors"
                        >
                          Ver comprobante
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin comprobante</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={orderStatusVariant[order.status] ?? 'secondary'}>
                        {orderStatusLabel[order.status] ?? order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {order.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleAction(order.id, 'confirmed')}
                            disabled={actionId === order.id}
                            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-green-500/10 hover:text-green-500 disabled:opacity-50"
                            title="Confirmar"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleAction(order.id, 'rejected')}
                            disabled={actionId === order.id}
                            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
                            title="Rechazar"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
