// src/app/core/services/animal.service.ts
// Servicio central para la gestión de animales - ZooTracker SOA

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Animal, AnimalStats, RegistroMedico } from '../interfaces/animal.interface';

@Injectable({
  providedIn: 'root'
})
export class AnimalService {

  private readonly STORAGE_KEY = 'zootracker_animales';

  private _animales$ = new BehaviorSubject<Animal[]>(this.cargarDesdeStorage());

  /** Observable de todos los animales — suscribirse para actualizaciones reactivas */
  get animales$(): Observable<Animal[]> {
    return this._animales$.asObservable();
  }

  /** Snapshot sincrónico de la lista actual */
  get animales(): Animal[] {
    return this._animales$.getValue();
  }

  // ─── CRUD ───────────────────────────────────────────────────────────────────

  addAnimal(animal: Animal): void {
    const actual = this.animales;
    const nueva = [animal, ...actual];
    this.publicar(nueva);
  }

  updateAnimal(id: string, cambios: Partial<Animal>): void {
    const actualizada = this.animales.map(a =>
      a.id === id ? { ...a, ...cambios } : a
    );
    this.publicar(actualizada);
  }

  deleteAnimal(id: string): void {
    const filtrada = this.animales.filter(a => a.id !== id);
    this.publicar(filtrada);
  }

  agregarEventoMedico(animalId: string, registro: RegistroMedico, nuevoEstado?: string): void {
    const actualizada = this.animales.map(a => {
      if (a.id !== animalId) return a;
      const historial = [registro, ...a.historialMedico];
      return {
        ...a,
        historialMedico: historial,
        ...(nuevoEstado ? { estado: nuevoEstado } : {})
      };
    });
    this.publicar(actualizada);
  }

  getById(id: string): Animal | undefined {
    return this.animales.find(a => a.id === id);
  }

  // ─── Utilidades ─────────────────────────────────────────────────────────────

  generarId(especie: string = 'ANIMAL'): string {
    const prefijo = especie.substring(0, 3).toUpperCase();
    const ids = this.animales
      .filter(a => a.id.startsWith(prefijo))
      .map(a => parseInt(a.id.replace(/\D/g, ''), 10))
      .filter(n => !isNaN(n));
    const siguiente = ids.length > 0 ? Math.max(...ids) + 1 : 1;
    return `${prefijo}-${String(siguiente).padStart(3, '0')}`;
  }

  calcularEdad(fechaNacimiento: Date | undefined): string {
    if (!fechaNacimiento) return 'No disponible';

    const hoy = new Date();
    const fechaNac = new Date(fechaNacimiento);

    let anios = hoy.getFullYear() - fechaNac.getFullYear();
    const meses = hoy.getMonth() - fechaNac.getMonth();

    if (meses < 0 || (meses === 0 && hoy.getDate() < fechaNac.getDate())) {
      anios--;
    }

    if (anios === 0) {
      let mesesTranscurridos = hoy.getMonth() - fechaNac.getMonth();
      if (mesesTranscurridos < 0) mesesTranscurridos += 12;
      return `${mesesTranscurridos} mes${mesesTranscurridos !== 1 ? 'es' : ''}`;
    }

    return `${anios} año${anios !== 1 ? 's' : ''}`;
  }

  calcularEstadisticas(): AnimalStats {
    const todos = this.animales;
    const anioActual = new Date().getFullYear();

    return {
      total: todos.length,
      sanos: todos.filter(a => a.estado === 'Sano').length,
      enTratamiento: todos.filter(a => a.estado === 'En tratamiento').length,
      nacimientosAnio: todos.filter(a => new Date(a.fechaNacimiento).getFullYear() === anioActual).length
    };
  }

  filtrar(
    animales: Animal[],
    especie: string,
    estado: string,
    termino: string
  ): Animal[] {
    return animales.filter(animal => {
      const cumpleEspecie = !especie || animal.especie === especie;
      const cumpleEstado = !estado || animal.estado === estado;
      const t = termino.toLowerCase();
      const cumpleTermino = !termino ||
        animal.id.toLowerCase().includes(t) ||
        animal.nombre.toLowerCase().includes(t) ||
        animal.raza.toLowerCase().includes(t);
      return cumpleEspecie && cumpleEstado && cumpleTermino;
    });
  }

  getEstadoClass(estado: string | undefined): string {
    const clases: { [k: string]: string } = {
      'Sano': 'estado-sano',
      'En tratamiento': 'estado-tratamiento',
      'Enfermo': 'estado-enfermo',
      'Cuarentena': 'estado-cuarentena',
      'Gestación': 'estado-gestacion',
      'Lactancia': 'estado-lactancia',
      'Vendido': 'estado-vendido',
    };
    return estado ? (clases[estado] ?? '') : '';
  }

  // ─── Persistencia ────────────────────────────────────────────────────────────

  private publicar(animales: Animal[]): void {
    this._animales$.next(animales);
    this.guardarEnStorage(animales);
  }

  private guardarEnStorage(animales: Animal[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(animales));
    } catch {
      console.warn('No se pudo guardar en localStorage');
    }
  }

  private cargarDesdeStorage(): Animal[] {
    try {
      const datos = localStorage.getItem(this.STORAGE_KEY);
      if (datos) {
        return JSON.parse(datos).map((a: any) => ({
          ...a,
          fechaNacimiento: new Date(a.fechaNacimiento),
          historialMedico: (a.historialMedico ?? []).map((r: any) => ({
            ...r,
            fecha: new Date(r.fecha)
          }))
        }));
      }
    } catch {
      console.warn('Error al cargar datos de localStorage');
    }
    return this.datosEjemplo();
  }

  private datosEjemplo(): Animal[] {
    return [
      {
        id: 'BOV-001',
        nombre: 'Aurora',
        especie: 'Bovino',
        raza: 'Holstein',
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
          { tipo: 'Vacunación', fecha: new Date('2023-12-15'), descripcion: 'Vacuna contra fiebre aftosa', veterinario: 'Dr. García' },
          { tipo: 'Revisión rutinaria', fecha: new Date('2024-02-20'), descripcion: 'Estado general óptimo', veterinario: 'Dra. Martínez' }
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
          { tipo: 'Tratamiento', fecha: new Date('2024-03-05'), descripcion: 'Administración de antibióticos para infección en pata', veterinario: 'Dr. López' }
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
          { tipo: 'Desparasitación', fecha: new Date('2024-01-10'), descripcion: 'Desparasitación trimestral', veterinario: 'Dr. Ramírez' }
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
          { tipo: 'Revisión rutinaria', fecha: new Date('2024-02-28'), descripcion: 'Control de gestación, desarrollo normal del feto', veterinario: 'Dra. Martínez' }
        ]
      }
    ];
  }
}
