'use client';

import { useState } from 'react';
import { Pencil, Trash2, Plus, Package as PackageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PackageForm } from './package-form';
import { Package } from '@/lib/types';
import { api } from '@/lib/api';

interface PackageListProps {
  clientId: string;
  packages: Package[];
  loading: boolean;
  onRefresh: () => void;
}

export function PackageList({ clientId, packages, loading, onRefresh }: PackageListProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Package | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = async (data: { type: string; value: string; active: boolean }) => {
    await api(`/admin/clients/${clientId}/packages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    onRefresh();
  };

  const handleUpdate = async (data: { type: string; value: string; active: boolean }) => {
    await api(`/admin/clients/${clientId}/packages/${editing!.id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    onRefresh();
  };

  const handleDelete = async (pkg: Package) => {
    if (!confirm(`¿Eliminar el paquete "${pkg.type === 'raffle_count' ? pkg.value + ' rifas' : pkg.value}"?`)) return;
    setDeletingId(pkg.id);
    try {
      await api(`/admin/clients/${clientId}/packages/${pkg.id}`, { method: 'DELETE' });
      onRefresh();
    } finally {
      setDeletingId(null);
    }
  };

  const openEdit = (pkg: Package) => {
    setEditing(pkg);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Paquetes</h2>
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" />
          Nuevo paquete
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-surface p-8 text-center">
          <PackageIcon className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Este cliente no tiene paquetes asignados.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="px-6 py-3 font-medium text-muted-foreground">Tipo</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Valor</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Estado</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Creado</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {packages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <Badge variant="secondary">
                      {pkg.type === 'raffle_count' ? 'Cantidad' : 'Rifa específica'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-white font-medium">
                    {pkg.type === 'raffle_count' ? `${pkg.value} rifas` : pkg.value}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={pkg.active ? 'success' : 'destructive'}>
                      {pkg.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(pkg.createdAt).toLocaleDateString('es-MX', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEdit(pkg)}
                        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(pkg)}
                        disabled={deletingId === pkg.id}
                        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PackageForm
        open={formOpen}
        onClose={closeForm}
        onSubmit={editing ? handleUpdate : handleCreate}
        initial={editing}
      />
    </div>
  );
}
