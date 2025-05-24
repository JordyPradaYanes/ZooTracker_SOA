import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../ComponentesEstructurales/header/header.component';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  imports: [FormsModule, ReactiveFormsModule,CommonModule,RouterLink,HeaderComponent],
  styleUrls: ['./reportes.component.css']
})
export class ReportesComponent implements OnInit {
  title = 'ZooTracker - Reportes';
  
  // Filtros
  filtros = {
    tipoAnimal: '',
    periodo: '30',
    fechaInicio: '',
    fechaFin: ''
  };
  
  // Listas de opciones
  tiposAnimales = ['Bovinos', 'Porcinos', 'Ovinos', 'Caprinos', 'Aves'];
  
  tiposReportes = [
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
  
  // Control de visualización
  reporteSeleccionado: string = '';
  reporteGenerado: boolean = false;
  
  // Datos de ejemplo para los reportes
  datosInventario = [
    { tipo: 'Bovinos', cantidad: 45, edadPromedio: 24, pesoPromedio: 320 },
    { tipo: 'Porcinos', cantidad: 78, edadPromedio: 12, pesoPromedio: 85 },
    { tipo: 'Ovinos', cantidad: 32, edadPromedio: 18, pesoPromedio: 42 },
    { tipo: 'Caprinos', cantidad: 25, edadPromedio: 20, pesoPromedio: 38 },
    { tipo: 'Aves', cantidad: 120, edadPromedio: 6, pesoPromedio: 2.5 }
  ];
  
  datosMovimientos = [
    { fecha: '15/03/2025', tipo: 'Entrada', animal: 'Bovinos', cantidad: 5, responsable: 'Juan Pérez' },
    { fecha: '12/03/2025', tipo: 'Salida', animal: 'Porcinos', cantidad: 3, responsable: 'María Gómez' },
    { fecha: '10/03/2025', tipo: 'Entrada', animal: 'Aves', cantidad: 25, responsable: 'Carlos Rodríguez' },
    { fecha: '08/03/2025', tipo: 'Salida', animal: 'Bovinos', cantidad: 2, responsable: 'Laura Martínez' },
    { fecha: '05/03/2025', tipo: 'Entrada', animal: 'Ovinos', cantidad: 8, responsable: 'Pedro Sánchez' }
  ];
  
  datosSalud = [
    { tipo: 'Bovinos', saludables: 40, enTratamiento: 5, vacunados: 45 },
    { tipo: 'Porcinos', saludables: 70, enTratamiento: 8, vacunados: 75 },
    { tipo: 'Ovinos', saludables: 30, enTratamiento: 2, vacunados: 28 },
    { tipo: 'Caprinos', saludables: 24, enTratamiento: 1, vacunados: 22 },
    { tipo: 'Aves', saludables: 110, enTratamiento: 10, vacunados: 100 }
  ];
  
  private charts: { [key: string]: Chart } = {};
  
  constructor() {
    // Establecer fechas por defecto para el filtro personalizado
    const hoy = new Date();
    const mesAnterior = new Date();
    mesAnterior.setMonth(mesAnterior.getMonth() - 1);
    
    this.filtros.fechaFin = this.formatDate(hoy);
    this.filtros.fechaInicio = this.formatDate(mesAnterior);
  }
  
  ngOnInit(): void {
    // Inicializar con un reporte por defecto
    this.seleccionarReporte('inventario');
  }
  
  seleccionarReporte(id: string): void {
    this.reporteSeleccionado = id;
    this.generarReporte();
  }
  
  generarReporte(): void {
    this.reporteGenerado = true;
    
    // Simular carga de datos desde un servicio
    setTimeout(() => {
      // Actualizar gráficos según el reporte seleccionado
      switch(this.reporteSeleccionado) {
        case 'inventario':
          this.generarGraficoInventario();
          break;
        case 'movimientos':
          this.generarGraficoMovimientos();
          break;
        case 'salud':
          this.generarGraficoSalud();
          break;
      }
    }, 500);
  }
  
  exportarPDF(): void {
    // Implementación para generar PDF
    alert('Exportando reporte en formato PDF...');
    // Aquí se integraría una librería como jsPDF o similar
  }
  
  exportarExcel(): void {
    // Implementación para generar Excel
    alert('Exportando reporte en formato Excel...');
    // Aquí se integraría una librería como xlsx o similar
  }
  
  private generarGraficoInventario(): void {
    // Destruir gráfico anterior si existe
    if (this.charts['chartInventario']) {
      this.charts['chartInventario'].destroy();
    }
    
    const ctx = document.getElementById('chartInventario') as HTMLCanvasElement;
    if (!ctx) return;
    
    // Preparar datos
    const labels = this.datosInventario.map(item => item.tipo);
    const datos = this.datosInventario.map(item => item.cantidad);
    
    // Crear gráfico
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          label: 'Cantidad',
          data: datos,
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
          legend: {
            position: 'right',
          },
          title: {
            display: true,
            text: 'Distribución de animales por tipo'
          }
        }
      }
    });
  }
  
  private generarGraficoMovimientos(): void {
    // Destruir gráfico anterior si existe
    if (this.charts['chartMovimientos']) {
      this.charts['chartMovimientos'].destroy();
    }
    
    const ctx = document.getElementById('chartMovimientos') as HTMLCanvasElement;
    if (!ctx) return;
    
    // Simular datos de tendencia para los últimos 6 meses
    const meses = ['Octubre', 'Noviembre', 'Diciembre', 'Enero', 'Febrero', 'Marzo'];
    const entradas = [12, 19, 15, 18, 22, 20];
    const salidas = [8, 12, 10, 14, 16, 13];
    
    // Crear gráfico
    this.charts['chartMovimientos'] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: meses,
        datasets: [
          {
            label: 'Entradas',
            data: entradas,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.3,
            fill: true
          },
          {
            label: 'Salidas',
            data: salidas,
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            tension: 0.3,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Tendencia de movimientos en los últimos 6 meses'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Cantidad'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Mes'
            }
          }
        }
      }
    });
  }
  
  private generarGraficoSalud(): void {
    // Destruir gráfico anterior si existe
    if (this.charts['chartSalud']) {
      this.charts['chartSalud'].destroy();
    }
    
    const ctx = document.getElementById('chartSalud') as HTMLCanvasElement;
    if (!ctx) return;
    
    // Preparar datos
    const labels = this.datosSalud.map(item => item.tipo);
    const saludables = this.datosSalud.map(item => item.saludables);
    const enTratamiento = this.datosSalud.map(item => item.enTratamiento);
    const vacunados = this.datosSalud.map(item => item.vacunados);
    
    // Crear gráfico
    this.charts['chartSalud'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Saludables',
            data: saludables,
            backgroundColor: 'rgba(0, 128, 0, 0.7)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          },
          {
            label: 'En Tratamiento',
            data: enTratamiento,
            backgroundColor: 'rgba(255, 99, 132, 0.7)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
          },
          {
            label: 'Vacunados',
            data: vacunados,
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Estado de salud por tipo de animal'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Cantidad'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Tipo de Animal'
            }
          }
        }
      }
    });
  }
  
  // Función para formatear fechas (corregida)
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }
}