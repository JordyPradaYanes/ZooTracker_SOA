// src/app/core/services/reporte.service.ts
// Servicio de reportes - ZooTracker SOA

import { Injectable } from '@angular/core';
import { DatoInventario, DatoMovimiento, DatoSalud, TipoReporteConfig } from '../interfaces/reporte.interface';
import { AnimalService } from './animal.service';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {

  readonly tiposReportes: TipoReporteConfig[] = [
    {
      id: 'inventario',
      nombre: 'Inventario General',
      descripcion: 'Detalle del inventario actual de animales',
      icono: 'fas fa-clipboard-list'
    },
    {
      id: 'movimientos',
      nombre: 'Movimientos',
      descripcion: 'Entradas y salidas de animales',
      icono: 'fas fa-exchange-alt'
    },
    {
      id: 'salud',
      nombre: 'Estado de Salud',
      descripcion: 'Seguimiento de tratamientos y vacunaciones',
      icono: 'fas fa-heartbeat'
    }
  ];

  constructor(private animalService: AnimalService) {}

  /**
   * Genera datos de inventario agrupados por especie a partir del AnimalService.
   * Al conectarse a Firebase en el futuro, sólo este método necesita cambios.
   */
  getInventarioData(): DatoInventario[] {
    const animales = this.animalService.animales;
    const grupos: { [especie: string]: { total: number; sumaEdad: number; sumaPeso: number } } = {};

    animales.forEach(a => {
      if (!grupos[a.especie]) {
        grupos[a.especie] = { total: 0, sumaEdad: 0, sumaPeso: 0 };
      }
      const edadStr = this.animalService.calcularEdad(a.fechaNacimiento);
      const edadMeses = this.parsearEdadEnMeses(edadStr);
      grupos[a.especie].total++;
      grupos[a.especie].sumaEdad += edadMeses;
      grupos[a.especie].sumaPeso += a.peso ?? 0;
    });

    return Object.entries(grupos).map(([tipo, g]) => ({
      tipo,
      cantidad: g.total,
      edadPromedio: g.total > 0 ? Math.round(g.sumaEdad / g.total) : 0,
      pesoPromedio: g.total > 0 ? Math.round(g.sumaPeso / g.total) : 0
    }));
  }

  /** Datos de movimientos (mock listo para sustituir por Firestore) */
  getMovimientosData(): DatoMovimiento[] {
    return [
      { fecha: '15/03/2025', tipo: 'Entrada', animal: 'Bovinos', cantidad: 5, responsable: 'Juan Pérez' },
      { fecha: '12/03/2025', tipo: 'Salida', animal: 'Porcinos', cantidad: 3, responsable: 'María Gómez' },
      { fecha: '10/03/2025', tipo: 'Entrada', animal: 'Aves', cantidad: 25, responsable: 'Carlos Rodríguez' },
      { fecha: '08/03/2025', tipo: 'Salida', animal: 'Bovinos', cantidad: 2, responsable: 'Laura Martínez' },
      { fecha: '05/03/2025', tipo: 'Entrada', animal: 'Ovinos', cantidad: 8, responsable: 'Pedro Sánchez' }
    ];
  }

  /** Datos de salud agrupados por especie (derivados del AnimalService) */
  getSaludData(): DatoSalud[] {
    const animales = this.animalService.animales;
    const grupos: { [especie: string]: DatoSalud } = {};

    animales.forEach(a => {
      if (!grupos[a.especie]) {
        grupos[a.especie] = { tipo: a.especie, saludables: 0, enTratamiento: 0, vacunados: 0 };
      }
      if (a.estado === 'Sano') grupos[a.especie].saludables++;
      if (a.estado === 'En tratamiento' || a.estado === 'Enfermo') grupos[a.especie].enTratamiento++;

      const tieneVacuna = a.historialMedico?.some(r =>
        r.tipo.toLowerCase().includes('vacun') || r.tipo.toLowerCase().includes('vaccinaci')
      );
      if (tieneVacuna) grupos[a.especie].vacunados++;
    });

    return Object.values(grupos);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private parsearEdadEnMeses(edadStr: string): number {
    const matchMeses = edadStr.match(/(\d+)\s*mes/);
    if (matchMeses) return parseInt(matchMeses[1], 10);
    const matchAnios = edadStr.match(/(\d+)\s*año/);
    if (matchAnios) return parseInt(matchAnios[1], 10) * 12;
    return 0;
  }
}
