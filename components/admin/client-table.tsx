'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Client } from '@/lib/types';

interface ClientTableProps {
  clients: Client[];
  loading: boolean;
  onToggleStatus: (client: Client) => void;
  togglingId: string | null;
}

export function ClientTable({ clients, loading, onToggleStatus, togglingId }: ClientTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-surface p-12 text-center">
        <p className="text-muted-foreground">No hay clientes registrados todavía.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-surface overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left">
            <th className="px-6 py-4 font-medium text-muted-foreground">Cliente</th>
            <th className="px-6 py-4 font-medium text-muted-foreground">Email</th>
            <th className="px-6 py-4 font-medium text-muted-foreground">Estado</th>
            <th className="px-6 py-4 font-medium text-muted-foreground">Paquetes activos</th>
            <th className="px-6 py-4 font-medium text-muted-foreground">Activar / Desactivar</th>
            <th className="px-6 py-4" />
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {clients.map((client) => (
            <tr key={client.id} className="transition-colors hover:bg-white/[0.02]">
              <td className="px-6 py-4 font-medium text-white">{client.name}</td>
              <td className="px-6 py-4 text-muted-foreground">{client.email}</td>
              <td className="px-6 py-4">
                <Badge variant={client.status === 'active' ? 'success' : 'destructive'}>
                  {client.status === 'active' ? 'Activo' : 'Inactivo'}
                </Badge>
              </td>
              <td className="px-6 py-4 text-muted-foreground">
                {client.packages?.length ?? 0} paquete{(client.packages?.length ?? 0) !== 1 ? 's' : ''}
              </td>
              <td className="px-6 py-4">
                <Switch
                  checked={client.status === 'active'}
                  onCheckedChange={() => onToggleStatus(client)}
                  disabled={togglingId === client.id}
                />
              </td>
              <td className="px-6 py-4 text-right">
                <Link
                  href={`/admin/clients/${client.id}`}
                  className="inline-flex items-center gap-1 text-sm text-brand hover:text-gold-400 transition-colors"
                >
                  Ver detalle
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
