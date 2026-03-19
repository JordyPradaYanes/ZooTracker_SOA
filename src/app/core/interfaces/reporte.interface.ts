// src/app/core/interfaces/reporte.interface.ts
// Interfaces de dominio para los reportes del sistema ZooTracker

export interface DatoInventario {
  tipo: string;
  cantidad: number;
  edadPromedio: number;
  pesoPromedio: number;
}

export interface DatoMovimiento {
  fecha: string;
  tipo: 'Entrada' | 'Salida';
  animal: string;
  cantidad: number;
  responsable: string;
}

export interface DatoSalud {
  tipo: string;
  saludables: number;
  enTratamiento: number;
  vacunados: number;
}

export type TipoReporte = 'inventario' | 'movimientos' | 'salud';

export interface TipoReporteConfig {
  id: TipoReporte;
  nombre: string;
  descripcion: string;
  icono: string;
}
