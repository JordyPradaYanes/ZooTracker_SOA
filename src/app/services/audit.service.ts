import { Injectable } from '@angular/core';
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
  startAfter,
  Timestamp,
  CollectionReference,
  QueryConstraint
} from '@angular/fire/firestore';
import { AuditLog, AuditAction, AuditFilters, CreateAuditData } from '../interface/audit.interface';

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private auditCollection: CollectionReference;

  constructor(private firestore: Firestore) {
    this.auditCollection = collection(this.firestore, 'audit_logs');
  }

  /**
   * Registra una nueva entrada de auditoría
   */
  async logAuditEvent(auditData: CreateAuditData): Promise<{ success: boolean; message: string }> {
    try {
      const auditLog: Omit<AuditLog, 'id'> = {
        uid: auditData.uid,
        nombre: auditData.nombre,
        accion: auditData.accion,
        detalles: auditData.detalles || '',
        fechaHora: new Date(),
        ipAddress: auditData.ipAddress || this.getClientIP(),
        userAgent: auditData.userAgent || navigator.userAgent
      };

      await addDoc(this.auditCollection, {
        ...auditLog,
        fechaHora: Timestamp.fromDate(auditLog.fechaHora)
      });

      return {
        success: true,
        message: 'Evento de auditoría registrado exitosamente'
      };
    } catch (error: any) {
      console.error('Error al registrar evento de auditoría:', error);
      return {
        success: false,
        message: 'Error al registrar evento: ' + error.message
      };
    }
  }

  /**
   * Obtiene los logs de auditoría con filtros opcionales
   */
  async getAuditLogs(filters?: AuditFilters, pageSize: number = 50): Promise<AuditLog[]> {
    try {
      const constraints: QueryConstraint[] = [orderBy('fechaHora', 'desc')];

      // Aplicar filtros
      if (filters) {
        if (filters.nombre) {
          constraints.push(where('nombre', '>=', filters.nombre));
          constraints.push(where('nombre', '<=', filters.nombre + '\uf8ff'));
        }

        if (filters.accion) {
          constraints.push(where('accion', '==', filters.accion));
        }

        if (filters.fechaInicio) {
          constraints.push(where('fechaHora', '>=', Timestamp.fromDate(filters.fechaInicio)));
        }

        if (filters.fechaFin) {
          constraints.push(where('fechaHora', '<=', Timestamp.fromDate(filters.fechaFin)));
        }
      }

      constraints.push(limit(pageSize));

      const q = query(this.auditCollection, ...constraints);
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          uid: data['uid'],
          nombre: data['nombre'],
          accion: data['accion'],
          detalles: data['detalles'],
          fechaHora: data['fechaHora']?.toDate() || new Date(),
          ipAddress: data['ipAddress'],
          userAgent: data['userAgent']
        } as AuditLog;
      });
    } catch (error) {
      console.error('Error al obtener logs de auditoría:', error);
      return [];
    }
  }

  /**
   * Obtiene los logs de auditoría para un usuario específico
   */
  async getUserAuditLogs(uid: string): Promise<AuditLog[]> {
    try {
      const q = query(
        this.auditCollection,
        where('uid', '==', uid),
        orderBy('fechaHora', 'desc'),
        limit(100)
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          uid: data['uid'],
          nombre: data['nombre'],
          accion: data['accion'],
          detalles: data['detalles'],
          fechaHora: data['fechaHora']?.toDate() || new Date(),
          ipAddress: data['ipAddress'],
          userAgent: data['userAgent']
        } as AuditLog;
      });
    } catch (error) {
      console.error('Error al obtener logs del usuario:', error);
      return [];
    }
  }

  /**
   * Registra un evento de login
   */
  async logLogin(uid: string, nombre: string): Promise<void> {
    await this.logAuditEvent({
      uid,
      nombre,
      accion: AuditAction.LOGIN,
      detalles: 'Usuario inició sesión exitosamente'
    });
  }

  /**
   * Registra un evento de logout
   */
  async logLogout(uid: string, nombre: string): Promise<void> {
    await this.logAuditEvent({
      uid,
      nombre,
      accion: AuditAction.LOGOUT,
      detalles: 'Usuario cerró sesión'
    });
  }

  /**
   * Registra un evento de creación de usuario
   */
  async logUserCreation(uid: string, nombre: string): Promise<void> {
    await this.logAuditEvent({
      uid,
      nombre,
      accion: AuditAction.CREATE,
      detalles: 'Nueva cuenta de usuario creada'
    });
  }

  /**
   * Registra un evento de actualización de perfil
   */
  async logProfileUpdate(uid: string, nombre: string, detalles?: string): Promise<void> {
    await this.logAuditEvent({
      uid,
      nombre,
      accion: AuditAction.UPDATE,
      detalles: detalles || 'Perfil de usuario actualizado'
    });
  }

  /**
   * Registra un evento de cambio de contraseña
   */
  async logPasswordChange(uid: string, nombre: string): Promise<void> {
    await this.logAuditEvent({
      uid,
      nombre,
      accion: AuditAction.PASSWORD_CHANGE,
      detalles: 'Contraseña actualizada'
    });
  }

  /**
   * Obtiene la dirección IP del cliente (simulada para el ejemplo)
   */
  private getClientIP(): string {
    // En un entorno real, obtendrías esto del servidor
    return 'IP_LOCAL';
  }

  /**
   * Formatea la fecha para mostrar
   */
  formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * Obtiene las estadísticas de auditoría
   */
  async getAuditStats(): Promise<{ [key: string]: number }> {
    try {
      const logs = await this.getAuditLogs({}, 1000);
      const stats: { [key: string]: number } = {};

      logs.forEach(log => {
        stats[log.accion] = (stats[log.accion] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return {};
    }
  }
}