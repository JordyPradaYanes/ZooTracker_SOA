import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

import { HeaderComponent } from '../../ComponentesEstructurales/header/header.component';
import { AnimalService } from '../../core/services/animal.service';
import { Animal } from '../../core/interfaces/animal.interface';

@Component({
  selector: 'app-registros',
  templateUrl: './registros.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, HeaderComponent, RouterOutlet],
  styleUrls: ['./registros.component.css']
})
export class RegistrosComponent implements OnInit, OnDestroy {

  registroForm: FormGroup;
  animales: Animal[] = [];
  modoEdicion = false;
  animalEditandoId: string | null = null;
  filtroTexto = '';
  filtroEspecie = '';
  animalSeleccionado: Animal | null = null;

  // Paginación
  paginaActual = 1;
  elementosPorPagina = 10;
  totalPaginas = 1;
  paginas: number[] = [];

  readonly especies = ['Bovino', 'Porcino', 'Aviar', 'Equino', 'Caprino', 'Ovino'];
  readonly generos = ['Macho', 'Hembra'];
  readonly estados = ['Activo', 'Vendido', 'Fallecido', 'En tratamiento'];

  private suscripcion!: Subscription;

  constructor(
    private fb: FormBuilder,
    private animalService: AnimalService
  ) {
    this.registroForm = this.fb.group({
      codigo:               ['', [Validators.required, Validators.pattern('[A-Z0-9-]{3,10}')]],
      especie:              ['', Validators.required],
      raza:                 ['', Validators.required],
      fechaNacimiento:      ['', Validators.required],
      peso:                 ['', [Validators.required, Validators.min(0)]],
      genero:               ['', Validators.required],
      estado:               ['Activo', Validators.required],
      ubicacion:            ['', Validators.required],
      observaciones:        [''],
      altura:               [''],
      longitud:             [''],
      dieta:                [''],
      frecuenciaAlimentacion: [''],
      cuidadosEspeciales:   [''],
      color:                ['']
    });
  }

  ngOnInit(): void {
    this.suscripcion = this.animalService.animales$.subscribe(animales => {
      this.animales = animales;
      this.actualizarPaginacion();
    });
  }

  ngOnDestroy(): void {
    this.suscripcion?.unsubscribe();
  }

  // ─── CRUD ───────────────────────────────────────────────────────────────────

  onSubmit(): void {
    if (!this.registroForm.valid) return;

    const v = this.registroForm.value;

    if (this.modoEdicion && this.animalEditandoId) {
      this.animalService.updateAnimal(this.animalEditandoId, {
        especie:               v.especie,
        raza:                  v.raza,
        fechaNacimiento:       new Date(v.fechaNacimiento),
        peso:                  v.peso,
        sexo:                  v.genero,
        estado:                v.estado,
        color:                 v.color || v.ubicacion,
        observaciones:         v.observaciones,
        altura:                v.altura,
        longitud:              v.longitud,
        dieta:                 v.dieta,
        frecuenciaAlimentacion: v.frecuenciaAlimentacion,
        cuidadosEspeciales:    v.cuidadosEspeciales
      });
    } else {
      const nuevoAnimal: Animal = {
        id:                    v.codigo || this.animalService.generarId(v.especie),
        nombre:                v.codigo,
        especie:               v.especie,
        raza:                  v.raza,
        fechaNacimiento:       new Date(v.fechaNacimiento),
        peso:                  v.peso,
        sexo:                  v.genero,
        estado:                v.estado,
        color:                 v.color || v.ubicacion || '',
        observaciones:         v.observaciones,
        altura:                v.altura,
        longitud:              v.longitud,
        dieta:                 v.dieta,
        frecuenciaAlimentacion: v.frecuenciaAlimentacion,
        cuidadosEspeciales:    v.cuidadosEspeciales,
        historialMedico:       []
      };
      this.animalService.addAnimal(nuevoAnimal);
    }

    this.resetForm();
  }

  editarAnimal(animal: Animal): void {
    this.modoEdicion = true;
    this.animalEditandoId = animal.id;

    this.registroForm.patchValue({
      codigo:               animal.id,
      especie:              animal.especie,
      raza:                 animal.raza,
      fechaNacimiento:      new Date(animal.fechaNacimiento).toISOString().split('T')[0],
      peso:                 animal.peso,
      genero:               animal.sexo,
      estado:               animal.estado,
      ubicacion:            animal.color,
      observaciones:        animal.observaciones,
      altura:               animal.altura,
      longitud:             animal.longitud,
      dieta:                animal.dieta,
      frecuenciaAlimentacion: animal.frecuenciaAlimentacion,
      cuidadosEspeciales:   animal.cuidadosEspeciales,
      color:                animal.color
    });
  }

  eliminarAnimal(id: string): void {
    if (confirm('¿Estás seguro de eliminar este registro?')) {
      this.animalService.deleteAnimal(id);
    }
  }

  cancelarEdicion(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.registroForm.reset({ estado: 'Activo' });
    this.modoEdicion = false;
    this.animalEditandoId = null;
  }

  mostrarDetalles(animal: Animal): void {
    this.animalSeleccionado = animal;
  }

  // ─── Filtros y paginación ───────────────────────────────────────────────────

  get animalesFiltrados(): Animal[] {
    return this.animalService.filtrar(this.animales, this.filtroEspecie, '', this.filtroTexto);
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

  // ─── Utilidades ─────────────────────────────────────────────────────────────

  calcularEdad(fechaNacimiento: Date): string {
    return this.animalService.calcularEdad(fechaNacimiento);
  }

  exportarCSV(): void {
    if (this.animales.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    let csv = 'ID,Especie,Raza,Fecha Nacimiento,Peso,Género,Estado,Color,Observaciones\n';
    this.animales.forEach(a => {
      const fecha = new Date(a.fechaNacimiento).toLocaleDateString();
      const obs = a.observaciones ? a.observaciones.replace(/"/g, '""') : '';
      csv += `${a.id},"${a.especie}","${a.raza}","${fecha}",${a.peso},"${a.sexo}","${a.estado}","${a.color}","${obs}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `zootracker_registros_${new Date().toISOString().split('T')[0]}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}