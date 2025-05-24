// user.interface.ts
export interface User {
  uid?: string;
  nombre: string;
  correo: string;
  telefono: string;
  fechaCreacion?: Date;
  fechaActualizacion?: Date;
}

export interface CreateUserData {
  nombre: string;
  telefono: string;
  correo: string;
  contraseña: string;
}

// Interfaces adicionales útiles para el manejo de usuarios
export interface UserUpdateData {
  nombre?: string;
  telefono?: string;
  correo?: string;
}

export interface UserResponse {
  success: boolean;
  message: string;
  user?: User;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
}

// Interface para datos de usuario de redes sociales
export interface SocialUserData {
  nombre: string;
  correo: string;
  telefono?: string;
  photoURL?: string;
}

// Interface para el perfil completo del usuario
export interface UserProfile extends User {
  photoURL?: string;
  emailVerified?: boolean;
  providerId?: string;
  lastLoginAt?: Date;
}