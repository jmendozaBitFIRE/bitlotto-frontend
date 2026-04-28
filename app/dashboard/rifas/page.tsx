'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RifaCard } from '@/components/dashboard/rifa-card';
import { api } from '@/lib/api';
import { Raffle, RaffleLimit } from '@/lib/types';

export default function RifasPage() {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [limit, setLimit] = useState<RaffleLimit | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [rafflesData, limitData] = await Promise.all([
        api('/raffles'),
        api('/raffles/limit'),
      ]);
      setRaffles(rafflesData);
      setLimit(limitData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Mis Rifas</h1>
          <p className="text-muted-foreground text-sm">Gestiona tus sorteos activos y crea nuevos.</p>
        </div>
        {limit && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {limit.used} / {limit.limit} este mes
            </span>
            <Button asChild={limit.canCreate} disabled={!limit.canCreate}>
              {limit.canCreate ? (
                <Link href="/dashboard/rifas/new" className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Nueva Rifa
                </Link>
              ) : (
                <span className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Nueva Rifa
                </span>
              )}
            </Button>
          </div>
        )}
      </div>

      {limit && !limit.canCreate && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-400">Límite mensual alcanzado</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Has usado {limit.used} de {limit.limit} rifas disponibles este mes. Contacta al administrador para actualizar tu plan.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
        </div>
      ) : raffles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-xl font-semibold text-white mb-2">No tienes rifas aún</p>
          <p className="text-muted-foreground text-sm mb-6">Crea tu primera rifa para empezar a vender boletos.</p>
          {limit?.canCreate && (
            <Button asChild>
              <Link href="/dashboard/rifas/new">
                <Plus className="h-5 w-5" />
                Crear primera rifa
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {raffles.map((raffle) => (
            <RifaCard key={raffle.id} raffle={raffle} />
          ))}
        </div>
      )}
    </div>
  );
}
