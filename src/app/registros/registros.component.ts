import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

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

interface RegistroMedico {
  tipo: string;
  fecha: Date;
  descripcion: string;
  veterinario: string;
}

@Component({
  selector: 'app-registros',
  templateUrl: './registros.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink,HeaderComponent,RouterOutlet],
  styleUrls: ['./registros.component.css']
})
export class RegistrosComponent implements OnInit {
  registroForm: FormGroup;
  animales: Animal[] = [];
  modoEdicion = false;
  animalEditandoId: string | null = null;
  filtroTexto = '';
  filtroEspecie = '';
  animalSeleccionado: Animal | null = null;

  // Variables para paginación
  paginaActual = 1;
  elementosPorPagina = 10;
  totalPaginas = 1;
  paginas: number[] = [];

  especies = ['Bovino', 'Porcino', 'Aviar', 'Equino', 'Caprino', 'Ovino'];
  generos = ['Macho', 'Hembra'];
  estados = ['Activo', 'Vendido', 'Fallecido', 'En tratamiento'];

  constructor(private fb: FormBuilder) {
    this.registroForm = this.fb.group({
      codigo: ['', [Validators.required, Validators.pattern('[A-Z0-9]{6,10}')]],
      especie: ['', Validators.required],
      raza: ['', Validators.required],
      fechaNacimiento: ['', Validators.required],
      peso: ['', [Validators.required, Validators.min(0)]],
      genero: ['', Validators.required],
      estado: ['Activo', Validators.required],
      ubicacion: ['', Validators.required],
      observaciones: [''],
      altura: [''],
      longitud: [''],
      dieta: [''],
      frecuenciaAlimentacion: [''],
      cuidadosEspeciales: [''],
      color: ['']
    });
  }

  ngOnInit(): void {
    this.cargarDatos();
    this.actualizarPaginacion();
  }
  
  cancelarEdicion(): void {
    this.resetForm();
    this.modoEdicion = false;
    this.animalEditandoId = null;
  }
  
  cargarDatos(): void {
    const datosGuardados = localStorage.getItem('zootracker_animales');
    if (datosGuardados) {
      this.animales = JSON.parse(datosGuardados).map((animal: any) => ({
        ...animal,
        fechaNacimiento: new Date(animal.fechaNacimiento)
      }));
    } else {
      this.animales = [
        {
          id: 'BOV-001',
          nombre: 'Aurora',
          especie: 'Bovino',
          raza: 'Holstein',
          fechaNacimiento: new Date('2022-05-10'),
          peso: 450,
          estado: 'Activo',
          sexo: 'Hembra',
          color: 'Blanco y Negro',
          altura: 140,
          longitud: 180,
          dieta: 'Pasto y concentrado',
          frecuenciaAlimentacion: '3 veces al día',
          observaciones: 'Excelente productora de leche',
          historialMedico: []
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
          historialMedico: []
        }
      ];
      this.guardarDatos();
    }
  }

  guardarDatos(): void {
    localStorage.setItem('zootracker_animales', JSON.stringify(this.animales));
  }

  onSubmit(): void {
    if (this.registroForm.valid) {
      const formValues = this.registroForm.value;
      formValues.fechaNacimiento = new Date(formValues.fechaNacimiento);

      if (this.modoEdicion && this.animalEditandoId !== null) {
        const index = this.animales.findIndex(a => a.id === this.animalEditandoId);
        if (index !== -1) {
          this.animales[index] = { ...this.animales[index], ...formValues };
          this.resetForm();
          this.guardarDatos();
        }
      } else {
        const nuevoAnimal: Animal = {
          id: this.generarId(),
          ...formValues
        };
        this.animales.unshift(nuevoAnimal);
        this.resetForm();
        this.guardarDatos();
      }
    }
  }

  generarId(): string {
    const maxId = this.animales.reduce((max, animal) => {
      const idNum = parseInt(animal.id.replace(/\D/g, ''), 10);
      return idNum > max ? idNum : max;
    }, 0);
    return `ANIMAL-${maxId + 1}`;
  }

  editarAnimal(animal: Animal): void {
    this.modoEdicion = true;
    this.animalEditandoId = animal.id;

    const fechaFormateada = new Date(animal.fechaNacimiento).toISOString().split('T')[0];

    this.registroForm.patchValue({
      codigo: animal.id,
      especie: animal.especie,
      raza: animal.raza,
      fechaNacimiento: fechaFormateada,
      peso: animal.peso,
      genero: animal.sexo,
      estado: animal.estado,
      ubicacion: animal.color,
      observaciones: animal.observaciones,
      altura: animal.altura,
      longitud: animal.longitud,
      dieta: animal.dieta,
      frecuenciaAlimentacion: animal.frecuenciaAlimentacion,
      cuidadosEspeciales: animal.cuidadosEspeciales,
      color: animal.color
    });
  }

  eliminarAnimal(id: string): void {
    if (confirm('¿Estás seguro de eliminar este registro?')) {
      this.animales = this.animales.filter(a => a.id !== id);
      this.guardarDatos();
    }
  }

  resetForm(): void {
    this.registroForm.reset({
      estado: 'Activo'
    });
    this.modoEdicion = false;
    this.animalEditandoId = null;
  }

  mostrarDetalles(animal: Animal): void {
    this.animalSeleccionado = animal;
  }

  calcularEdad(fechaNacimiento: Date): string {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    const diferencia = hoy.getTime() - nacimiento.getTime();
    const edad = diferencia / (1000 * 60 * 60 * 24 * 365);
    return edad.toFixed(1);
  }

  get animalesFiltrados(): Animal[] {
    return this.animales.filter(animal => {
      const cumpleFiltroTexto = this.filtroTexto.trim() === '' ||
        animal.id.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
        animal.raza.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
        animal.estado.toLowerCase().includes(this.filtroTexto.toLowerCase());

      const cumpleFiltroEspecie = this.filtroEspecie === '' ||
        animal.especie === this.filtroEspecie;

      return cumpleFiltroTexto && cumpleFiltroEspecie;
    });
  }

  actualizarPaginacion(): void {
    this.totalPaginas = Math.ceil(this.animales.length / this.elementosPorPagina);
    this.paginas = Array.from({ length: this.totalPaginas }, (_, i) => i + 1);

    if (this.paginaActual > this.totalPaginas) {
      this.paginaActual = this.totalPaginas || 1;
    }
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  exportarCSV(): void {
    if (this.animales.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    let csv = 'ID,Código,Especie,Raza,Fecha Nacimiento,Peso,Género,Estado,Ubicación,Observaciones\n';

    this.animales.forEach(animal => {
      const fechaFormateada = new Date(animal.fechaNacimiento).toLocaleDateString();
      const observacionesEscapadas = animal.observaciones ? animal.observaciones.replace(/"/g, '""') : '';

      csv += `${animal.id},${animal.id},"${animal.especie}","${animal.raza}","${fechaFormateada}",${animal.peso},"${animal.sexo}","${animal.estado}","${animal.color}","${observacionesEscapadas}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `zootracker_registros_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}