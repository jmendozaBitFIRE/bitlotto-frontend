import Link from 'next/link';
import { ExternalLink, Pencil, Eye } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Raffle } from '@/lib/types';
import { BACKEND_URL } from '@/lib/constants';

const statusVariant: Record<string, 'success' | 'secondary' | 'destructive'> = {
  active: 'success',
  draft: 'secondary',
  closed: 'destructive',
};

const statusLabel: Record<string, string> = {
  active: 'Activa',
  draft: 'Borrador',
  closed: 'Cerrada',
};

interface RifaCardProps {
  raffle: Raffle;
}

export function RifaCard({ raffle }: RifaCardProps) {
  const sold = raffle.soldCount ?? 0;
  const progress = raffle.totalTickets > 0 ? (sold / raffle.totalTickets) * 100 : 0;
  const imageUrl = raffle.prizeImage
    ? raffle.prizeImage.startsWith('http') ? raffle.prizeImage : `${BACKEND_URL}${raffle.prizeImage}`
    : null;

  return (
    <Card className="group max-w-[320px] transition-all duration-300 hover:border-brand/20">
      <div className="relative aspect-square w-full overflow-hidden bg-surface-hover">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={raffle.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">Sin imagen</div>
        )}
        <div className="absolute top-3 right-3">
          <Badge variant={statusVariant[raffle.status] ?? 'secondary'}>
            {statusLabel[raffle.status] ?? raffle.status}
          </Badge>
        </div>
      </div>

      <CardContent className="p-5">
        <h3 className="text-xl font-bold text-white line-clamp-2 min-h-[56px] mb-2 leading-tight">
          {raffle.title}
        </h3>

        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <span>Boleto: <span className="text-white font-semibold">${raffle.ticketPrice} MXN</span></span>
          <span>{sold} / {raffle.totalTickets}</span>
        </div>

        <div className="h-2 w-full bg-white/5 rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-brand transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex gap-2">
          <Link
            href={`/dashboard/rifas/${raffle.id}`}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/5"
          >
            <Eye className="h-4 w-4" />
            Órdenes
          </Link>
          <Link
            href={`/dashboard/rifas/edit/${raffle.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/5"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          {raffle.status === 'active' && (
            <a
              href={`/rifas/${raffle.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/5"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
