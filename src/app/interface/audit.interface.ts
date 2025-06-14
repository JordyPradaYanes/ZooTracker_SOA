// src/app/interfaces/audit.interface.ts - Versión expandida

export interface AuditLog {
  id?: string
  uid: string // ID del usuario auditado
  nombre: string // Nombre del usuario
  accion: AuditAction // Tipo de acción realizada
  detalles?: string // Detalles adicionales de la acción
  fechaHora: Date // Fecha y hora del evento
  ipAddress?: string // Dirección IP (opcional)
  userAgent?: string // Información del navegador (opcional)
  sessionId?: string // ID de sesión (opcional)
  location?: string // Ubicación geográfica (opcional)
}

export enum AuditAction {
  LOGIN = "login",
  LOGOUT = "logout",
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  PASSWORD_CHANGE = "password_change",
  PROFILE_VIEW = "profile_view",
  // NUEVAS ACCIONES ESPECÍFICAS
  EXPORT_DATA = "export_data",
  FILTER_APPLIED = "filter_applied",
  PAGE_ACCESS = "page_access",
  SEARCH_PERFORMED = "search_performed",
  BULK_ACTION = "bulk_action",
}

export interface AuditFilters {
  fechaInicio?: Date
  fechaFin?: Date
  nombre?: string
  accion?: AuditAction
  uid?: string // NUEVO: Filtrar por usuario específico
  sessionId?: string // NUEVO: Filtrar por sesión
}

export interface CreateAuditData {
  uid: string
  nombre: string
  accion: AuditAction
  detalles?: string
  ipAddress?: string
  userAgent?: string
  sessionId?: string // NUEVO
  location?: string // NUEVO
}

// NUEVA: Interfaz para estadísticas avanzadas
export interface AuditStats {
  totalEvents: number
  eventsByAction: { [key: string]: number }
  eventsByUser: { [key: string]: number }
  eventsByDay: { [key: string]: number }
  uniqueUsers: number
  averageSessionDuration: number
}

// NUEVA: Interfaz para sesiones de usuario
export interface UserSession {
  sessionId: string
  uid: string
  nombre: string
  startTime: Date
  endTime?: Date
  duration?: number // en minutos
  actionsCount: number
  ipAddress?: string
  userAgent?: string
}
