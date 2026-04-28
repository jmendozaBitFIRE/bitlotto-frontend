'use client';

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';

export default function ComprobantesPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Comprobantes de Pago</h1>
        <p className="text-muted-foreground text-sm">Revisa y aprueba los pagos de tus compradores.</p>
      </div>

      <Card className="border-white/5 bg-surface/50 backdrop-blur-sm shadow-xl">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="hover:bg-transparent border-white/5">
              <TableHead className="text-white font-bold py-6">Comprador</TableHead>
              <TableHead className="text-white font-bold py-6">Boletos</TableHead>
              <TableHead className="text-white font-bold py-6">Fecha</TableHead>
              <TableHead className="text-white font-bold py-6">Estado</TableHead>
              <TableHead className="text-white font-bold py-6 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={5} className="h-[400px] text-center">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <p className="text-muted-foreground text-lg">No hay comprobantes pendientes.</p>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
