import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { Subscription } from 'rxjs';

import { HeaderComponent } from '../../ComponentesEstructurales/header/header.component';
import { ReporteService } from '../../core/services/reporte.service';
import { DatoInventario, DatoMovimiento, DatoSalud, TipoReporte, TipoReporteConfig } from '../../core/interfaces/reporte.interface';

Chart.register(...registerables);

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule, RouterLink, HeaderComponent],
  styleUrls: ['./reportes.component.css']
})
export class ReportesComponent implements OnInit, OnDestroy {

  title = 'ZooTracker - Reportes';

  // Filtros
  filtros = {
    tipoAnimal: '',
    periodo: '30',
    fechaInicio: '',
    fechaFin: ''
  };

  readonly tiposAnimales = ['Bovinos', 'Porcinos', 'Ovinos', 'Caprinos', 'Aves'];


  // Control de visualización
  reporteSeleccionado: TipoReporte = 'inventario';
  reporteGenerado = false;

  // Datos (provenientes del ReporteService)
  datosInventario: DatoInventario[] = [];
  datosMovimientos: DatoMovimiento[] = [];
  datosSalud: DatoSalud[] = [];
  tiposReportes: TipoReporteConfig[] = [];

  private charts: { [key: string]: Chart<any> } = {};
  private suscripcion!: Subscription;

  constructor(private reporteService: ReporteService) {
    const hoy = new Date();
    const mesAnterior = new Date();
    mesAnterior.setMonth(mesAnterior.getMonth() - 1);
    this.filtros.fechaFin = this.formatDate(hoy);
    this.filtros.fechaInicio = this.formatDate(mesAnterior);
  }

  ngOnInit(): void {
    this.tiposReportes = this.reporteService.tiposReportes;
    this.seleccionarReporte('inventario');
  }

  ngOnDestroy(): void {
    // Destruir todos los charts para evitar memory leaks
    Object.values(this.charts).forEach(c => c.destroy());
    this.suscripcion?.unsubscribe();
  }

  // ─── Reportes ────────────────────────────────────────────────────────────────

  seleccionarReporte(id: TipoReporte): void {
    this.reporteSeleccionado = id;
    this.generarReporte();
  }

  generarReporte(): void {
    // Cargar datos frescos desde el servicio
    this.datosInventario = this.reporteService.getInventarioData();
    this.datosMovimientos = this.reporteService.getMovimientosData();
    this.datosSalud = this.reporteService.getSaludData();

    this.reporteGenerado = true;

    setTimeout(() => {
      switch (this.reporteSeleccionado) {
        case 'inventario':   this.generarGraficoInventario(); break;
        case 'movimientos':  this.generarGraficoMovimientos(); break;
        case 'salud':        this.generarGraficoSalud(); break;
      }
    }, 500);
  }

  exportarPDF(): void {
    alert('Exportando reporte en formato PDF...');
  }

  exportarExcel(): void {
    alert('Exportando reporte en formato Excel...');
  }

  // ─── Gráficos ────────────────────────────────────────────────────────────────

  private generarGraficoInventario(): void {
    this.destroyChart('chartInventario');
    const ctx = document.getElementById('chartInventario') as HTMLCanvasElement;
    if (!ctx) return;

    this.charts['chartInventario'] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.datosInventario.map(i => i.tipo),
        datasets: [{
          label: 'Cantidad',
          data: this.datosInventario.map(i => i.cantidad),
          backgroundColor: [
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
            'rgba(255, 159, 64, 0.7)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'right' },
          title: { display: true, text: 'Distribución de animales por tipo' }
        }
      }
    });
  }

  private generarGraficoMovimientos(): void {
    this.destroyChart('chartMovimientos');
    const ctx = document.getElementById('chartMovimientos') as HTMLCanvasElement;
    if (!ctx) return;

    this.charts['chartMovimientos'] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Octubre', 'Noviembre', 'Diciembre', 'Enero', 'Febrero', 'Marzo'],
        datasets: [
          {
            label: 'Entradas',
            data: [12, 19, 15, 18, 22, 20],
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.3,
            fill: true
          },
          {
            label: 'Salidas',
            data: [8, 12, 10, 14, 16, 13],
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            tension: 0.3,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { title: { display: true, text: 'Tendencia de movimientos en los últimos 6 meses' } },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Cantidad' } },
          x: { title: { display: true, text: 'Mes' } }
        }
      }
    });
  }

  private generarGraficoSalud(): void {
    this.destroyChart('chartSalud');
    const ctx = document.getElementById('chartSalud') as HTMLCanvasElement;
    if (!ctx) return;

    this.charts['chartSalud'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.datosSalud.map(d => d.tipo),
        datasets: [
          { label: 'Saludables', data: this.datosSalud.map(d => d.saludables), backgroundColor: 'rgba(0, 128, 0, 0.7)', borderColor: 'rgba(75, 192, 192, 1)', borderWidth: 1 },
          { label: 'En Tratamiento', data: this.datosSalud.map(d => d.enTratamiento), backgroundColor: 'rgba(255, 99, 132, 0.7)', borderColor: 'rgba(255, 99, 132, 1)', borderWidth: 1 },
          { label: 'Vacunados', data: this.datosSalud.map(d => d.vacunados), backgroundColor: 'rgba(54, 162, 235, 0.7)', borderColor: 'rgba(54, 162, 235, 1)', borderWidth: 1 }
        ]
      },
      options: {
        responsive: true,
        plugins: { title: { display: true, text: 'Estado de salud por tipo de animal' } },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Cantidad' } },
          x: { title: { display: true, text: 'Tipo de Animal' } }
        }
      }
    });
  }

  private destroyChart(key: string): void {
    if (this.charts[key]) {
      this.charts[key].destroy();
      delete this.charts[key];
    }
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = ('0' + (date.getMonth() + 1)).slice(-2);
    const d = ('0' + date.getDate()).slice(-2);
    return `${y}-${m}-${d}`;
  }
}