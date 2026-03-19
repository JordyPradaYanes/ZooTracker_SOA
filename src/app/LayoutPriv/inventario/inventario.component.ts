import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { HeaderComponent } from '../../ComponentesEstructurales/header/header.component';
import { AnimalService } from '../../core/services/animal.service';
import { Animal, AnimalStats, Evento, RegistroMedico } from '../../core/interfaces/animal.interface';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, HeaderComponent],
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.css'],
  providers: [DatePipe]
})
export class InventarioComponent implements OnInit, OnDestroy {

  // Lista filtrada de animales (derivada de AnimalService)
  animalesFiltrados: Animal[] = [];

  // Animal seleccionado para ver detalles o editar
  animalSeleccionado: Animal | null = null;

  // Animal a eliminar
  animalAEliminar: Animal | null = null;

  // Control de modales
  mostrarModalDetalles = false;
  mostrarModalEliminacion = false;
  mostrarModalEvento = false;

  // Filtros
  filtroEspecie = '';
  filtroEstado = '';
  terminoBusqueda = '';

  // Ordenamiento
  columnaOrden = 'id';
  ordenAscendente = true;

  // Paginación
  paginaActual = 1;
  elementosPorPagina = 10;
  totalPaginas = 1;
  paginas: number[] = [];

  // Listas desplegables
  readonly especies = ['Bovino', 'Porcino', 'Ovino', 'Caprino', 'Aviar', 'Equino', 'Cunícola'];
  readonly estados = ['Sano', 'En tratamiento', 'Enfermo', 'Cuarentena', 'Gestación', 'Lactancia', 'Vendido'];

  // Estadísticas
  stats: AnimalStats = { total: 0, sanos: 0, enTratamiento: 0, nacimientosAnio: 0 };

  // Para nuevo evento
  nuevoEvento: Evento = { tipo: '', fecha: new Date(), descripcion: '', responsable: '' };

  private suscripcion!: Subscription;

  constructor(
    private animalService: AnimalService,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    // Suscribirse al stream reactivo — se actualiza automáticamente ante cualquier cambio
    this.suscripcion = this.animalService.animales$.subscribe(() => {
      this.aplicarFiltros();
      this.stats = this.animalService.calcularEstadisticas();
    });
  }

  ngOnDestroy(): void {
    this.suscripcion?.unsubscribe();
  }

  // ─── Filtros y orden ────────────────────────────────────────────────────────

  aplicarFiltros(): void {
    let resultado = this.animalService.filtrar(
      this.animalService.animales,
      this.filtroEspecie,
      this.filtroEstado,
      this.terminoBusqueda
    );
    resultado = this.ordenarAnimales(resultado);
    this.animalesFiltrados = resultado;
    this.actualizarPaginacion();
  }

  ordenarAnimales(animales: Animal[]): Animal[] {
    return [...animales].sort((a, b) => {
      let valorA: any = a[this.columnaOrden as keyof Animal];
      let valorB: any = b[this.columnaOrden as keyof Animal];

      if (this.columnaOrden === 'fechaNacimiento') {
        valorA = new Date(valorA).getTime();
        valorB = new Date(valorB).getTime();
      } else if (typeof valorA === 'string') {
        valorA = valorA.toLowerCase();
        valorB = (valorB as string).toLowerCase();
      }

      if (valorA < valorB) return this.ordenAscendente ? -1 : 1;
      if (valorA > valorB) return this.ordenAscendente ? 1 : -1;
      return 0;
    });
  }

  ordenarPor(columna: string): void {
    if (this.columnaOrden === columna) {
      this.ordenAscendente = !this.ordenAscendente;
    } else {
      this.columnaOrden = columna;
      this.ordenAscendente = true;
    }
    this.aplicarFiltros();
  }

  // ─── Paginación ─────────────────────────────────────────────────────────────

  actualizarPaginacion(): void {
    this.totalPaginas = Math.ceil(this.animalesFiltrados.length / this.elementosPorPagina);
    this.paginas = Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
    if (this.paginaActual > this.totalPaginas) {
      this.paginaActual = this.totalPaginas > 0 ? this.totalPaginas : 1;
    }
  }

  cambiarPagina(pagina: number): void {
    this.paginaActual = pagina;
  }

  // ─── Modales de detalle ──────────────────────────────────────────────────────

  verDetalles(animal: Animal): void {
    this.animalSeleccionado = { ...animal };
    this.mostrarModalDetalles = true;
  }

  cerrarModalDetalles(): void {
    this.mostrarModalDetalles = false;
    this.animalSeleccionado = null;
  }

  editarAnimal(animal: Animal): void {
    console.log('Editar animal:', animal);
    if (this.mostrarModalDetalles) this.cerrarModalDetalles();
  }

  // ─── Eliminación ─────────────────────────────────────────────────────────────

  confirmarEliminacion(animal: Animal): void {
    this.animalAEliminar = animal;
    this.mostrarModalEliminacion = true;
  }

  cancelarEliminacion(): void {
    this.animalAEliminar = null;
    this.mostrarModalEliminacion = false;
  }

  eliminarAnimal(): void {
    if (this.animalAEliminar) {
      this.animalService.deleteAnimal(this.animalAEliminar.id);
      this.cancelarEliminacion();
    }
  }

  // ─── Eventos médicos ─────────────────────────────────────────────────────────

  registrarEvento(animal: Animal): void {
    this.animalSeleccionado = animal;
    this.nuevoEvento = {
      tipo: '',
      fecha: this.datePipe.transform(new Date(), 'yyyy-MM-dd') || '',
      descripcion: '',
      responsable: ''
    };
    this.mostrarModalEvento = true;
    if (this.mostrarModalDetalles) this.cerrarModalDetalles();
  }

  cerrarModalEvento(): void {
    this.mostrarModalEvento = false;
  }

  guardarEvento(): void {
    if (!this.animalSeleccionado) return;

    const nuevoRegistro: RegistroMedico = {
      tipo: this.nuevoEvento.tipo,
      fecha: new Date(this.nuevoEvento.fecha),
      descripcion: this.nuevoEvento.descripcion,
      veterinario: this.nuevoEvento.responsable
    };

    const nuevoEstado = this.nuevoEvento.tipo === 'Cambio de estado'
      ? this.nuevoEvento.nuevoEstado
      : undefined;

    this.animalService.agregarEventoMedico(
      this.animalSeleccionado.id,
      nuevoRegistro,
      nuevoEstado
    );

    this.cerrarModalEvento();

    const actualizado = this.animalService.getById(this.animalSeleccionado.id);
    if (actualizado) this.verDetalles(actualizado);
  }

  // ─── Utilidades ─────────────────────────────────────────────────────────────

  calcularEdad(fechaNacimiento: Date | undefined): string {
    return this.animalService.calcularEdad(fechaNacimiento);
  }

  getEstadoClass(estado: string | undefined): string {
    return this.animalService.getEstadoClass(estado);
  }
}