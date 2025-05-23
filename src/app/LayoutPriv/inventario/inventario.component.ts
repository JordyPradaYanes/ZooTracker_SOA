import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../ComponentesEstructurales/header/header.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, HeaderComponent],
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.css'],
  providers: [DatePipe]
})

export class InventarioComponent implements OnInit {
  // Lista completa de animales
  animales: Animal[] = [];
  
  // Lista filtrada de animales
  animalesFiltrados: Animal[] = [];
  
  // Animal seleccionado para ver detalles o editar
  animalSeleccionado: Animal | null = null;
  
  // Animal a eliminar
  animalAEliminar: Animal | null = null;
  
  // Control de modales
  mostrarModalDetalles: boolean = false;
  mostrarModalEliminacion: boolean = false;
  mostrarModalEvento: boolean = false;
  
  // Filtros
  filtroEspecie: string = '';
  filtroEstado: string = '';
  terminoBusqueda: string = '';
  
  // Ordenamiento
  columnaOrden: string = 'id';
  ordenAscendente: boolean = true;
  
  // Paginación
  paginaActual: number = 1;
  elementosPorPagina: number = 10;
  totalPaginas: number = 1;
  paginas: number[] = [];
  
  // Listas desplegables
  especies: string[] = ['Bovino', 'Porcino', 'Ovino', 'Caprino', 'Aviar', 'Equino', 'Cunícola'];
  estados: string[] = ['Sano', 'En tratamiento', 'Enfermo', 'Cuarentena', 'Gestación', 'Lactancia', 'Vendido'];
  
  // Para estadísticas
  totalAnimales: number = 0;
  animalesSanos: number = 0;
  animalesEnTratamiento: number = 0;
  nacimientosMes: number = 0;
  
  // Para nuevo evento
  nuevoEvento: Evento = {
    tipo: '',
    fecha: new Date(),
    descripcion: '',
    responsable: ''
  };
  
  constructor(private datePipe: DatePipe) { }
  
  ngOnInit(): void {
    // Cargar datos de ejemplo (en un proyecto real, estos vendrían de un servicio)
    this.cargarDatosEjemplo();
    
    // Aplicar filtros iniciales
    this.aplicarFiltros();
    
    // Calcular estadísticas
    this.calcularEstadisticas();
  }
  
  cargarDatosEjemplo(): void {
    // Aquí se cargarían los datos desde un servicio en un caso real
    // Por ahora usamos datos de ejemplo
    this.animales = [
      {
        id: 'BOV-001',
        nombre: 'Aurora',
        especie: 'Bovino',
        raza: 'Holstein',
        //año-mes-dia
        fechaNacimiento: new Date('2025-03-14'),
        peso: 450,
        estado: 'Sano',
        sexo: 'Hembra',
        color: 'Blanco y Negro',
        altura: 140,
        longitud: 180,
        dieta: 'Pasto y concentrado',
        frecuenciaAlimentacion: '3 veces al día',
        observaciones: 'Excelente productora de leche',
        historialMedico: [
          {
            tipo: 'Vacunación',
            fecha: new Date('2023-12-15'),
            descripcion: 'Vacuna contra fiebre aftosa',
            veterinario: 'Dr. García'
          },
          {
            tipo: 'Revisión rutinaria',
            fecha: new Date('2024-02-20'),
            descripcion: 'Estado general óptimo',
            veterinario: 'Dra. Martínez'
          }
        ]
      },
      {
        id: 'BOV-002',
        nombre: 'Tornado',
        especie: 'Bovino',
        raza: 'Brahman',
        fechaNacimiento: new Date('2021-08-15'),
        peso: 520,
        estado: 'En tratamiento',
        sexo: 'Macho',
        color: 'Gris',
        altura: 152,
        longitud: 195,
        dieta: 'Pasto y suplemento proteico',
        frecuenciaAlimentacion: '2 veces al día',
        cuidadosEspeciales: 'Aplicación de antibiótico por 5 días más',
        observaciones: 'Recuperándose de una infección en la pata trasera derecha',
        historialMedico: [
          {
            tipo: 'Tratamiento',
            fecha: new Date('2024-03-05'),
            descripcion: 'Administración de antibióticos para infección en pata',
            veterinario: 'Dr. López'
          }
        ]
      },
      {
        id: 'POR-001',
        nombre: 'Manchas',
        especie: 'Porcino',
        raza: 'Hampshire',
        fechaNacimiento: new Date('2023-11-20'),
        peso: 95,
        estado: 'Sano',
        sexo: 'Hembra',
        color: 'Negro con banda blanca',
        altura: 65,
        longitud: 120,
        dieta: 'Balanceado para cerdos',
        frecuenciaAlimentacion: '3 veces al día',
        observaciones: '',
        historialMedico: []
      },
      {
        id: 'EQU-001',
        nombre: 'Relámpago',
        especie: 'Equino',
        raza: 'Criollo Colombiano',
        fechaNacimiento: new Date('2025-01-02'),
        peso: 380,
        estado: 'Sano',
        sexo: 'Macho',
        color: 'Zaino',
        altura: 155,
        longitud: 168,
        dieta: 'Heno y concentrado',
        frecuenciaAlimentacion: '2 veces al día',
        observaciones: 'Caballo de exhibición',
        historialMedico: [
          {
            tipo: 'Desparasitación',
            fecha: new Date('2024-01-10'),
            descripcion: 'Desparasitación trimestral',
            veterinario: 'Dr. Ramírez'
          }
        ]
      },
      {
        id: 'BOV-003',
        nombre: 'Estrella',
        especie: 'Bovino',
        raza: 'Jersey',
        fechaNacimiento: new Date('2025-01-05'),
        peso: 380,
        estado: 'Gestación',
        sexo: 'Hembra',
        color: 'Marrón claro',
        altura: 130,
        longitud: 165,
        dieta: 'Pasto, heno y concentrado especial para gestación',
        frecuenciaAlimentacion: '4 veces al día',
        cuidadosEspeciales: 'Suplemento vitamínico para gestación',
        observaciones: 'En último tercio de gestación, parto estimado en 3 semanas',
        historialMedico: [
          {
            tipo: 'Revisión rutinaria',
            fecha: new Date('2024-02-28'),
            descripcion: 'Control de gestación, desarrollo normal del feto',
            veterinario: 'Dra. Martínez'
          }
        ]
      }
    ];
  }

  // Función para aplicar filtros
  aplicarFiltros(): void {
    // Filtrar por especie
    let resultado = this.animales;
    
    if (this.filtroEspecie) {
      resultado = resultado.filter(animal => animal.especie === this.filtroEspecie);
    }
    
    // Filtrar por estado
    if (this.filtroEstado) {
      resultado = resultado.filter(animal => animal.estado === this.filtroEstado);
    }
    
    // Filtrar por término de búsqueda
    if (this.terminoBusqueda) {
      const termino = this.terminoBusqueda.toLowerCase();
      resultado = resultado.filter(animal => 
        animal.id.toLowerCase().includes(termino) || 
        animal.nombre.toLowerCase().includes(termino)
      );
    }
    
    // Ordenar
    resultado = this.ordenarAnimales(resultado);
    
    // Actualizar animales filtrados
    this.animalesFiltrados = resultado;
    
    // Actualizar paginación
    this.actualizarPaginacion();
  }

  // Función para ordenar animales
  ordenarAnimales(animales: Animal[]): Animal[] {
    return animales.sort((a, b) => {
      let valorA: any = a[this.columnaOrden as keyof Animal];
      let valorB: any = b[this.columnaOrden as keyof Animal];
      
      // Manejar fechas especialmente
      if (this.columnaOrden === 'fechaNacimiento') {
        valorA = new Date(valorA).getTime();
        valorB = new Date(valorB).getTime();
      }
      
      // Manejar strings y otros tipos
      if (typeof valorA === 'string') {
        valorA = valorA.toLowerCase();
        valorB = valorB.toLowerCase();
      }
      
      // Realizar la comparación según el orden seleccionado
      if (valorA < valorB) {
        return this.ordenAscendente ? -1 : 1;
      }
      if (valorA > valorB) {
        return this.ordenAscendente ? 1 : -1;
      }
      return 0;
    });
  }

  // Función para ordenar por columna
  ordenarPor(columna: string): void {
    if (this.columnaOrden === columna) {
      // Si ya estamos ordenando por esta columna, invertimos el orden
      this.ordenAscendente = !this.ordenAscendente;
    } else {
      // Si es una nueva columna, establecemos el orden ascendente por defecto
      this.columnaOrden = columna;
      this.ordenAscendente = true;
    }
    
    // Aplicar el nuevo orden
    this.aplicarFiltros();
  }

  // Función para actualizar la paginación
  actualizarPaginacion(): void {
    this.totalAnimales = this.animalesFiltrados.length;
    this.totalPaginas = Math.ceil(this.totalAnimales / this.elementosPorPagina);
    
    // Generar array con números de página
    this.paginas = [];
    for (let i = 1; i <= this.totalPaginas; i++) {
      this.paginas.push(i);
    }
    
    // Ajustar página actual si es necesario
    if (this.paginaActual > this.totalPaginas) {
      this.paginaActual = this.totalPaginas > 0 ? this.totalPaginas : 1;
    }
  }

  // Función para cambiar de página
  cambiarPagina(pagina: number): void {
    this.paginaActual = pagina;
  }

  // Función para calcular estadísticas
  calcularEstadisticas(): void {
    this.totalAnimales = this.animales.length;
    
    // Contar animales sanos
    this.animalesSanos = this.animales.filter(animal => animal.estado === 'Sano').length;
    
    // Contar animales en tratamiento
    this.animalesEnTratamiento = this.animales.filter(animal => animal.estado === 'En tratamiento').length;
    
    // Calcular nacimientos del Año actual
    const hoy = new Date();
    const anioActual = hoy.getFullYear();
    
    this.nacimientosMes = this.animales.filter(animal => {
      const fechaNac = new Date(animal.fechaNacimiento);
      return fechaNac.getFullYear() === anioActual;
    }).length;
  }

  // Función para ver detalles de un animal
  verDetalles(animal: Animal): void {
    this.animalSeleccionado = {...animal};  // Crear una copia para no modificar el original
    this.mostrarModalDetalles = true;
  }

  // Función para cerrar el modal de detalles
  cerrarModalDetalles(): void {
    this.mostrarModalDetalles = false;
    this.animalSeleccionado = null;
  }

  // Función para editar un animal
  editarAnimal(animal: Animal): void {
    // Aquí se navegaría a la página de edición o se abriría un modal de edición
    console.log('Editar animal:', animal);
    // Ejemplo: this.router.navigate(['/editar-animal', animal.id]);
    
    // Si se está mostrando el modal de detalles, cerrarlo primero
    if (this.mostrarModalDetalles) {
      this.cerrarModalDetalles();
    }
  }

  // Función para confirmar la eliminación de un animal
  confirmarEliminacion(animal: Animal): void {
    this.animalAEliminar = animal;
    this.mostrarModalEliminacion = true;
  }

  // Función para cancelar la eliminación de un animal
  cancelarEliminacion(): void {
    this.animalAEliminar = null;
    this.mostrarModalEliminacion = false;
  }

  // Función para eliminar un animal
  eliminarAnimal(): void {
    if (this.animalAEliminar) {
      // En un caso real, se haría una llamada al servicio para eliminar el animal
      this.animales = this.animales.filter(a => a.id !== this.animalAEliminar!.id);
      
      // Actualizar los filtros y estadísticas
      this.aplicarFiltros();
      this.calcularEstadisticas();
      
      // Cerrar el modal de confirmación
      this.cancelarEliminacion();
    }
  }

  // Función para calcular la edad de un animal
  calcularEdad(fechaNacimiento: Date | undefined): string {
    if (!fechaNacimiento) return 'No disponible';
    
    const hoy = new Date();
    const fechaNac = new Date(fechaNacimiento);
    
    let años = hoy.getFullYear() - fechaNac.getFullYear();
    const meses = hoy.getMonth() - fechaNac.getMonth();
    
    // Ajustar los años si aún no ha pasado el mes de nacimiento
    if (meses < 0 || (meses === 0 && hoy.getDate() < fechaNac.getDate())) {
      años--;
    }
    
    // Calcular meses transcurridos si es menos de un año
    if (años === 0) {
      let mesesTranscurridos = hoy.getMonth() - fechaNac.getMonth();
      if (mesesTranscurridos < 0) {
        mesesTranscurridos += 12;
      }
      return `${mesesTranscurridos} meses`;
    }
    
    return `${años} años`;
  }

  // Función para obtener la clase CSS según el estado del animal
  getEstadoClass(estado: string | undefined): string {
    if (!estado) return '';
    
    switch (estado) {
      case 'Sano':
        return 'estado-sano';
      case 'En tratamiento':
        return 'estado-tratamiento';
      case 'Enfermo':
        return 'estado-enfermo';
      case 'Cuarentena':
        return 'estado-cuarentena';
      case 'Gestación':
        return 'estado-gestacion';
      case 'Lactancia':
        return 'estado-lactancia';
      case 'Vendido':
        return 'estado-vendido';
      default:
        return '';
    }
  }

  // Función para registrar un evento
  registrarEvento(animal: Animal): void {
    this.animalSeleccionado = animal;
    
    // Inicializar los datos del nuevo evento
    this.nuevoEvento = {
      tipo: '',
      fecha: this.datePipe.transform(new Date(), 'yyyy-MM-dd') || '',
      descripcion: '',
      responsable: ''
    };
    
    // Mostrar el modal de registro de evento
    this.mostrarModalEvento = true;
    
    // Si se está mostrando el modal de detalles, cerrarlo primero
    if (this.mostrarModalDetalles) {
      this.cerrarModalDetalles();
    }
  }

  // Función para cerrar el modal de evento
  cerrarModalEvento(): void {
    this.mostrarModalEvento = false;
  }

  // Función para guardar un evento
  guardarEvento(): void {
    if (!this.animalSeleccionado) return;
    
    // Crear un nuevo registro médico con los datos del evento
    const nuevoRegistro: RegistroMedico = {
      tipo: this.nuevoEvento.tipo,
      fecha: new Date(this.nuevoEvento.fecha),
      descripcion: this.nuevoEvento.descripcion,
      veterinario: this.nuevoEvento.responsable
    };
    
    // Buscar el animal original (no la copia)
    const animalOriginal = this.animales.find(a => a.id === this.animalSeleccionado!.id);
    
    if (animalOriginal) {
      // Añadir el nuevo registro al historial médico
      animalOriginal.historialMedico.unshift(nuevoRegistro);
      
      // Si el tipo de evento es "Cambio de estado", actualizar el estado del animal
      if (this.nuevoEvento.tipo === 'Cambio de estado' && this.nuevoEvento.nuevoEstado) {
        animalOriginal.estado = this.nuevoEvento.nuevoEstado;
      }
      
      // Recalcular estadísticas
      this.calcularEstadisticas();
      
      // Actualizar la visualización
      this.aplicarFiltros();
    }
    
    // Cerrar el modal
    this.cerrarModalEvento();
    
    // Si deseamos mostrar los detalles actualizados, debemos abrir el modal de detalles con los datos actualizados
    if (animalOriginal) {
      this.verDetalles(animalOriginal);
    }
  }
}

// Interfaz para el animal
interface Animal {
  id: string;
  nombre: string;
  especie: string;
  raza: string;
  fechaNacimiento: Date;
  peso: number;
  estado: string;
  sexo: string;
  color: string;
  altura?: number;
  longitud?: number;
  dieta?: string;
  frecuenciaAlimentacion?: string;
  cuidadosEspeciales?: string;
  observaciones?: string;
  historialMedico: RegistroMedico[];
}

// Interfaz para registros del historial médico
interface RegistroMedico {
  tipo: string;
  fecha: Date;
  descripcion: string;
  veterinario: string;
}

// Interfaz para los eventos
interface Evento {
  tipo: string;
  fecha: Date | string;
  descripcion: string;
  responsable: string;
  nuevoEstado?: string;
}