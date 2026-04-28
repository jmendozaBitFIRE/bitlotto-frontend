'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PackageList } from '@/components/admin/package-list';
import { api } from '@/lib/api';
import { Client, Package } from '@/lib/types';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [client, setClient] = useState<Client | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loadingClient, setLoadingClient] = useState(true);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [togglingStatus, setTogglingStatus] = useState(false);

  const fetchClient = useCallback(async () => {
    try {
      const data = await api(`/admin/clients/${id}`);
      setClient(data);
    } finally {
      setLoadingClient(false);
    }
  }, [id]);

  const fetchPackages = useCallback(async () => {
    setLoadingPackages(true);
    try {
      const data = await api(`/admin/clients/${id}/packages`);
      setPackages(data);
    } finally {
      setLoadingPackages(false);
    }
  }, [id]);

  useEffect(() => { fetchClient(); fetchPackages(); }, [fetchClient, fetchPackages]);

  const handleToggleStatus = async () => {
    if (!client) return;
    setTogglingStatus(true);
    try {
      const updated: Client = await api(`/admin/clients/${id}/toggle-status`, { method: 'PATCH' });
      setClient((prev) => prev ? { ...prev, status: updated.status } : prev);
    } finally {
      setTogglingStatus(false);
    }
  };

  if (loadingClient) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Cliente no encontrado.
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">{client.name}</h1>
          <p className="text-sm text-muted-foreground">{client.email}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información del cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div>
              <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Estado
              </dt>
              <dd>
                <Badge variant={client.status === 'active' ? 'success' : 'destructive'}>
                  {client.status === 'active' ? 'Activo' : 'Inactivo'}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Usuarios vinculados
              </dt>
              <dd className="flex items-center gap-1.5 text-white font-medium">
                <Users className="h-4 w-4 text-muted-foreground" />
                {client._count?.users ?? 0}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Miembro desde
              </dt>
              <dd className="text-white font-medium">
                {new Date(client.createdAt).toLocaleDateString('es-MX', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Activar / Desactivar
              </dt>
              <dd>
                <Switch
                  checked={client.status === 'active'}
                  onCheckedChange={handleToggleStatus}
                  disabled={togglingStatus}
                />
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <PackageList
        clientId={id}
        packages={packages}
        loading={loadingPackages}
        onRefresh={fetchPackages}
      />
    </div>
  );
}
