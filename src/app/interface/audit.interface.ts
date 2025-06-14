// src/app/interfaces/audit.interface.ts

export interface AuditLog {
  id?: string;
  uid: string; // ID del usuario auditado
  nombre: string; // Nombre del usuario
  accion: AuditAction; // Tipo de acción realizada
  detalles?: string; // Detalles adicionales de la acción
  fechaHora: Date; // Fecha y hora del evento
  ipAddress?: string; // Dirección IP (opcional)
  userAgent?: string; // Información del navegador (opcional)
}

export enum AuditAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  PASSWORD_CHANGE = 'password_change',
  PROFILE_VIEW = 'profile_view'
}

export interface AuditFilters {
  fechaInicio?: Date;
  fechaFin?: Date;
  nombre?: string;
  accion?: AuditAction;
}

export interface CreateAuditData {
  uid: string;
  nombre: string;
  accion: AuditAction;
  detalles?: string;
  ipAddress?: string;
  userAgent?: string;
}