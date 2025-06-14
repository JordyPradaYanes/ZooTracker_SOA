// user.interface.ts - Interfaz mejorada

export interface User {
  uid?: string;
  nombre: string;           // Campo principal para nombre
  correo: string;          // Campo principal para email
  telefono?: string;
  provider?: string;       // 'email', 'github', 'google', etc.
  fechaCreacion?: Date | any;
  fechaActualizacion: Date;
  // Campos adicionales para usuarios sociales
  displayName?: string;    // Nombre del proveedor social
  email?: string;          // Email del proveedor social
  photoURL?: string | null;
  emailVerified?: boolean;
  lastLoginAt?: Date | any;
  
  // Metadatos
  createdAt?: Date | any;
  registeredAt?: Date | any;
  updatedAt?: Date | any;
}

export interface CreateUserData {
  nombre: string;
  correo: string;
  telefono?: string;
  contraseña: string;
  provider?: string;
}

export interface SocialUserData {
  uid: string;
  displayName: string;
  email: string;
  provider: string;
  telefono?: string;
  photoURL?: string;
}