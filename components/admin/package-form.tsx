'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Package } from '@/lib/types';

interface PackageFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { type: string; value: string; active: boolean }) => Promise<void>;
  initial?: Package | null;
}

export function PackageForm({ open, onClose, onSubmit, initial }: PackageFormProps) {
  const [type, setType] = useState<'raffle' | 'raffle_count'>('raffle_count');
  const [value, setValue] = useState('');
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initial) {
      setType(initial.type);
      setValue(initial.value);
      setActive(initial.active);
    } else {
      setType('raffle_count');
      setValue('');
      setActive(true);
    }
    setError('');
  }, [initial, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) {
      setError('El valor es requerido.');
      return;
    }
    if (type === 'raffle_count' && (isNaN(Number(value)) || Number(value) <= 0)) {
      setError('La cantidad debe ser un número positivo.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSubmit({ type, value: value.trim(), active });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el paquete.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{initial ? 'Editar paquete' : 'Nuevo paquete'}</DialogTitle>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Tipo de paquete
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['raffle_count', 'raffle'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setType(t); setValue(''); }}
                className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  type === t
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-white/10 bg-white/5 text-muted-foreground hover:border-white/20 hover:text-white'
                }`}
              >
                {t === 'raffle_count' ? 'Cantidad de rifas' : 'Rifa específica'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {type === 'raffle_count' ? 'Cantidad de rifas' : 'Referencia de rifa'}
          </label>
          <Input
            type={type === 'raffle_count' ? 'number' : 'text'}
            min={type === 'raffle_count' ? 1 : undefined}
            placeholder={type === 'raffle_count' ? 'Ej. 10' : 'Ej. RIFA-2024-001'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            {type === 'raffle_count'
              ? 'Número total de rifas disponibles para este cliente.'
              : 'Identificador único de la rifa asignada.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="pkg-active"
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-white/5 accent-brand"
          />
          <label htmlFor="pkg-active" className="text-sm text-white cursor-pointer">
            Paquete activo
          </label>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? 'Guardando...' : initial ? 'Guardar cambios' : 'Crear paquete'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
