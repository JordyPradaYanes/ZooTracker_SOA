// src/app/core/interfaces/animal.interface.ts
// Interfaces de dominio compartidas para todo el sistema ZooTracker

export interface RegistroMedico {
  tipo: string;
  fecha: Date;
  descripcion: string;
  veterinario: string;
}

export interface Animal {
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

export interface Evento {
  tipo: string;
  fecha: Date | string;
  descripcion: string;
  responsable: string;
  nuevoEstado?: string;
}

export interface AnimalStats {
  total: number;
  sanos: number;
  enTratamiento: number;
  nacimientosAnio: number;
}
