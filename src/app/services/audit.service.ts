import { Injectable } from "@angular/core"
import {
  Firestore,
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  type CollectionReference,
  type QueryConstraint,
} from "@angular/fire/firestore"
import {
  type AuditLog,
  AuditAction,
  type AuditFilters,
  type CreateAuditData,
  type AuditStats,
  type UserSession,
} from "../interface/audit.interface"

@Injectable({
  providedIn: "root",
})
export class AuditService {
  private auditCollection: CollectionReference
  private sessionsCollection: CollectionReference
  private currentSessionId: string | null = null

  constructor(private firestore: Firestore) {
    this.auditCollection = collection(this.firestore, "audit_logs")
    this.sessionsCollection = collection(this.firestore, "user_sessions")
    this.generateSessionId()
  }

  // Generar ID de sesión único
  private generateSessionId(): void {
    this.currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Obtener ubicación aproximada del usuario
  private async getUserLocation(): Promise<string> {
    try {
      // En un entorno real, podrías usar una API de geolocalización
      // Por ahora, retornamos una ubicación genérica
      return "Ubicación no disponible"
    } catch (error) {
      return "Ubicación no disponible"
    }
  }

  /**
   * Registra una nueva entrada de auditoría 
   */
  async logAuditEvent(auditData: CreateAuditData): Promise<{ success: boolean; message: string }> {
    try {
      const location = await this.getUserLocation()

      const auditLog: Omit<AuditLog, "id"> = {
        uid: auditData.uid,
        nombre: auditData.nombre,
        accion: auditData.accion,
        detalles: auditData.detalles || "",
        fechaHora: new Date(),
        ipAddress: auditData.ipAddress || this.getClientIP(),
        userAgent: auditData.userAgent || navigator.userAgent,
        sessionId: auditData.sessionId || this.currentSessionId || "unknown",
        location: auditData.location || location,
      }

      await addDoc(this.auditCollection, {
        ...auditLog,
        fechaHora: Timestamp.fromDate(auditLog.fechaHora),
      })

      // Actualizar estadísticas de sesión
      await this.updateSessionStats(auditLog.uid, auditLog.nombre)

      console.log("Evento de auditoría registrado:", auditLog.accion, auditLog.detalles)

      return {
        success: true,
        message: "Evento de auditoría registrado exitosamente",
      }
    } catch (error: any) {
      console.error("Error al registrar evento de auditoría:", error)
      return {
        success: false,
        message: "Error al registrar evento: " + error.message,
      }
    }
  }

  // Actualizar estadísticas de sesión
  private async updateSessionStats(uid: string, nombre: string): Promise<void> {
    try {
      if (!this.currentSessionId) return

      const sessionDoc = doc(this.sessionsCollection, this.currentSessionId)
      const sessionData: UserSession = {
        sessionId: this.currentSessionId ?? undefined,
        uid: uid,
        nombre: nombre,
        startTime: new Date(),
        actionsCount: 1,
        ipAddress: this.getClientIP(),
        userAgent: navigator.userAgent,
      }

      // En una implementación real, aquí actualizarías el documento existente
      // incrementando el contador de acciones
    } catch (error) {
      console.error("Error al actualizar estadísticas de sesión:", error)
    }
  }

  /**
   * Obtiene los logs de auditoría con filtros opcionales
   */
  async getAuditLogs(filters?: AuditFilters, pageSize = 50): Promise<AuditLog[]> {
    try {
      const constraints: QueryConstraint[] = [orderBy("fechaHora", "desc")]

      // Aplicar filtros
      if (filters) {
        if (filters.nombre) {
          constraints.push(where("nombre", ">=", filters.nombre))
          constraints.push(where("nombre", "<=", filters.nombre + "\uf8ff"))
        }

        if (filters.accion) {
          constraints.push(where("accion", "==", filters.accion))
        }

        if (filters.uid) {
          constraints.push(where("uid", "==", filters.uid))
        }

        if (filters.sessionId) {
          constraints.push(where("sessionId", "==", filters.sessionId))
        }

        if (filters.fechaInicio) {
          constraints.push(where("fechaHora", ">=", Timestamp.fromDate(filters.fechaInicio)))
        }

        if (filters.fechaFin) {
          constraints.push(where("fechaHora", "<=", Timestamp.fromDate(filters.fechaFin)))
        }
      }

      constraints.push(limit(pageSize))

      const q = query(this.auditCollection, ...constraints)
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          uid: data["uid"],
          nombre: data["nombre"],
          accion: data["accion"],
          detalles: data["detalles"],
          fechaHora: data["fechaHora"]?.toDate() || new Date(),
          ipAddress: data["ipAddress"],
          userAgent: data["userAgent"],
          sessionId: data["sessionId"],
          location: data["location"],
        } as AuditLog
      })
    } catch (error) {
      console.error("Error al obtener logs de auditoría:", error)
      return []
    }
  }

  /**
   * Obtiene los logs de auditoría para un usuario específico
   */
  async getUserAuditLogs(uid: string): Promise<AuditLog[]> {
    try {
      const q = query(this.auditCollection, where("uid", "==", uid), orderBy("fechaHora", "desc"), limit(100))

      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          uid: data["uid"],
          nombre: data["nombre"],
          accion: data["accion"],
          detalles: data["detalles"],
          fechaHora: data["fechaHora"]?.toDate() || new Date(),
          ipAddress: data["ipAddress"],
          userAgent: data["userAgent"],
          sessionId: data["sessionId"],
          location: data["location"],
        } as AuditLog
      })
    } catch (error) {
      console.error("Error al obtener logs del usuario:", error)
      return []
    }
  }

  // Obtener logs por sesión
  async getSessionAuditLogs(sessionId: string): Promise<AuditLog[]> {
    try {
      const q = query(this.auditCollection, where("sessionId", "==", sessionId), orderBy("fechaHora", "desc"))

      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          uid: data["uid"],
          nombre: data["nombre"],
          accion: data["accion"],
          detalles: data["detalles"],
          fechaHora: data["fechaHora"]?.toDate() || new Date(),
          ipAddress: data["ipAddress"],
          userAgent: data["userAgent"],
          sessionId: data["sessionId"],
          location: data["location"],
        } as AuditLog
      })
    } catch (error) {
      console.error("Error al obtener logs de sesión:", error)
      return []
    }
  }

  /**
   * Registra un evento de login 
   */
  async logLogin(uid: string, nombre: string): Promise<void> {
    // Generar nuevo ID de sesión para cada login
    this.generateSessionId()

    await this.logAuditEvent({
      uid,
      nombre,
      accion: AuditAction.LOGIN,
      detalles: `Usuario inició sesión exitosamente - Sesión: ${this.currentSessionId}`,
      sessionId: this.currentSessionId ?? undefined,
    })
  }

  /**
   * Registra un evento de logout
   */
  async logLogout(uid: string, nombre: string): Promise<void> {
    await this.logAuditEvent({
      uid,
      nombre,
      accion: AuditAction.LOGOUT,
      detalles: `Usuario cerró sesión - Sesión: ${this.currentSessionId}`,
      sessionId: this.currentSessionId ?? undefined,
    })

    // Limpiar ID de sesión después del logout
    this.currentSessionId = null
  }

  /**
   * Registra un evento de creación de usuario
   */
  async logUserCreation(uid: string, nombre: string): Promise<void> {
    await this.logAuditEvent({
      uid,
      nombre,
      accion: AuditAction.CREATE,
      detalles: "Nueva cuenta de usuario creada",
      sessionId: this.currentSessionId ?? undefined,
    })
  }

  /**
   * Registra un evento de actualización de perfil
   */
  async logProfileUpdate(uid: string, nombre: string, detalles?: string): Promise<void> {
    await this.logAuditEvent({
      uid,
      nombre,
      accion: AuditAction.UPDATE,
      detalles: detalles || "Perfil de usuario actualizado",
      sessionId: this.currentSessionId ?? undefined,
    })
  }

  /**
   * Registra un evento de cambio de contraseña
   */
  async logPasswordChange(uid: string, nombre: string): Promise<void> {
    await this.logAuditEvent({
      uid,
      nombre,
      accion: AuditAction.PASSWORD_CHANGE,
      detalles: "Contraseña actualizada",
      sessionId: this.currentSessionId ?? undefined,
    })
  }

  // Registrar exportación de datos
  async logDataExport(uid: string, nombre: string, exportType: string, recordCount: number): Promise<void> {
    await this.logAuditEvent({
      uid,
      nombre,
      accion: AuditAction.EXPORT_DATA,
      detalles: `Exportación de datos: ${exportType} (${recordCount} registros)`,
      sessionId: this.currentSessionId ?? undefined,
    })
  }

  // Registrar búsqueda realizada
  async logSearch(uid: string, nombre: string, searchTerm: string, resultsCount: number): Promise<void> {
    await this.logAuditEvent({
      uid,
      nombre,
      accion: AuditAction.SEARCH_PERFORMED,
      detalles: `Búsqueda realizada: "${searchTerm}" (${resultsCount} resultados)`,
      sessionId: this.currentSessionId ?? undefined,
    })
  }

  // Registrar acceso a página
  async logPageAccess(uid: string, nombre: string, pageName: string): Promise<void> {
    await this.logAuditEvent({
      uid,
      nombre,
      accion: AuditAction.PAGE_ACCESS,
      detalles: `Acceso a página: ${pageName}`,
      sessionId: this.currentSessionId ?? undefined,
    })
  }

  /**
   * Obtiene la dirección IP del cliente (simulada para el ejemplo)
   */
  private getClientIP(): string {
    // En un entorno real, obtendrías esto del servidor
    return "IP_LOCAL"
  }

  /**
   * Formatea la fecha para mostrar
   */
  formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")
    const seconds = date.getSeconds().toString().padStart(2, "0")

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
  }

  /**
   * Obtiene las estadísticas de auditoría
   */
  async getAuditStats(): Promise<{ [key: string]: number }> {
    try {
      const logs = await this.getAuditLogs({}, 1000)
      const stats: { [key: string]: number } = {}

      logs.forEach((log) => {
        stats[log.accion] = (stats[log.accion] || 0) + 1
      })

      return stats
    } catch (error) {
      console.error("Error al obtener estadísticas:", error)
      return {}
    }
  }

  // Obtener estadísticas avanzadas
  async getAdvancedStats(): Promise<AuditStats> {
    try {
      const logs = await this.getAuditLogs({}, 5000)

      const eventsByAction: { [key: string]: number } = {}
      const eventsByUser: { [key: string]: number } = {}
      const eventsByDay: { [key: string]: number } = {}
      const uniqueUsers = new Set<string>()

      logs.forEach((log) => {
        // Contar por acción
        eventsByAction[log.accion] = (eventsByAction[log.accion] || 0) + 1

        // Contar por usuario
        eventsByUser[log.nombre] = (eventsByUser[log.nombre] || 0) + 1
        uniqueUsers.add(log.uid)

        // Contar por día
        const day = log.fechaHora.toISOString().split("T")[0]
        eventsByDay[day] = (eventsByDay[day] || 0) + 1
      })

      return {
        totalEvents: logs.length,
        eventsByAction,
        eventsByUser,
        eventsByDay,
        uniqueUsers: uniqueUsers.size,
        averageSessionDuration: 0, // Calcular en implementación real
      }
    } catch (error) {
      console.error("Error al obtener estadísticas avanzadas:", error)
      return {
        totalEvents: 0,
        eventsByAction: {},
        eventsByUser: {},
        eventsByDay: {},
        uniqueUsers: 0,
        averageSessionDuration: 0,
      }
    }
  }

  // Obtener ID de sesión actual
  getCurrentSessionId(): string | null {
    return this.currentSessionId
  }

  // Limpiar logs antiguos (mantenimiento)
  async cleanupOldLogs(daysToKeep = 90): Promise<{ success: boolean; message: string }> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

      const q = query(this.auditCollection, where("fechaHora", "<", Timestamp.fromDate(cutoffDate)))

      const querySnapshot = await getDocs(q)
      console.log(`Encontrados ${querySnapshot.docs.length} logs antiguos para eliminar`)

      // En una implementación real, aquí eliminarías los documentos
      // usando batch operations para mejor rendimiento

      return {
        success: true,
        message: `Limpieza completada. ${querySnapshot.docs.length} logs antiguos identificados.`,
      }
    } catch (error: any) {
      console.error("Error en limpieza de logs:", error)
      return {
        success: false,
        message: "Error en limpieza: " + error.message,
      }
    }
  }
}