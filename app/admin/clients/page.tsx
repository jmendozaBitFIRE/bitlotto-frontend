'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { ClientTable } from '@/components/admin/client-table';
import { api } from '@/lib/api';
import { Client } from '@/lib/types';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [form, setForm] = useState({ name: '', email: '' });

  const fetchClients = useCallback(async () => {
    try {
      const data = await api('/admin/clients');
      setClients(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const handleToggleStatus = async (client: Client) => {
    setTogglingId(client.id);
    try {
      const updated: Client = await api(`/admin/clients/${client.id}/toggle-status`, { method: 'PATCH' });
      setClients((prev) => prev.map((c) => (c.id === updated.id ? { ...c, status: updated.status } : c)));
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setCreateError('Nombre y email son requeridos.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      await api('/admin/clients', { method: 'POST', body: JSON.stringify(form) });
      setCreateOpen(false);
      setForm({ name: '', email: '' });
      fetchClients();
    } catch (err: any) {
      setCreateError(err.message || 'Error al crear el cliente.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Clientes</h1>
          <p className="text-muted-foreground text-sm">
            Gestiona los clientes y sus paquetes de rifas.
          </p>
        </div>
        <Button onClick={() => { setCreateError(''); setForm({ name: '', email: '' }); setCreateOpen(true); }}>
          <Plus className="h-5 w-5" />
          Nuevo cliente
        </Button>
      </div>

      <ClientTable
        clients={clients}
        loading={loading}
        onToggleStatus={handleToggleStatus}
        togglingId={togglingId}
      />

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)}>
        <DialogTitle>Nuevo cliente</DialogTitle>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Nombre
            </label>
            <Input
              placeholder="Nombre del cliente u organización"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Email
            </label>
            <Input
              type="email"
              placeholder="cliente@ejemplo.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          {createError && <p className="text-sm text-red-400">{createError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={creating}>
              {creating ? 'Creando...' : 'Crear cliente'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
