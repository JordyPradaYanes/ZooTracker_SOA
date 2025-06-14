// user.service.ts - Versión modificada con auditoría
import { Injectable } from "@angular/core"
import {
  Firestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  type CollectionReference,
  writeBatch,
} from "@angular/fire/firestore"
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  User as FirebaseUser,
  deleteUser as deleteAuthUser,
} from "@angular/fire/auth"
import { Observable } from "rxjs"
import type { User, CreateUserData } from "./../interface/user.interface"
import { AuditService } from "./audit.service" // NUEVO: Importar AuditService

@Injectable({
  providedIn: "root",
})
export class UserService {
  private usersCollection: CollectionReference

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private auditService: AuditService, // NUEVO: Inyectar AuditService
  ) {
    this.usersCollection = collection(this.firestore, "users")
  }

  // NUEVO: Método para obtener el usuario actual para auditoría
  private async getCurrentUserForAudit(): Promise<{ uid: string; nombre: string } | null> {
    try {
      const currentUser = this.auth.currentUser
      if (!currentUser) return null

      const userData = await this.getUserById(currentUser.uid)
      return {
        uid: currentUser.uid,
        nombre: userData?.nombre || currentUser.displayName || currentUser.email || "Usuario desconocido",
      }
    } catch (error) {
      return null
    }
  }

  async createUser(userData: CreateUserData): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, userData.correo, userData.contraseña)

      const userDoc: User = this.createUnifiedUserObject({
        uid: userCredential.user.uid,
        nombre: userData.nombre,
        correo: userData.correo,
        telefono: userData.telefono || "",
        provider: userData.provider || "email",
      })

      await this.setUserDocument(userCredential.user.uid, userDoc)

      // NUEVO: Registrar creación de usuario en auditoría
      await this.auditService.logUserCreation(userCredential.user.uid, userData.nombre)

      return {
        success: true,
        message: "Usuario creado exitosamente",
        user: userDoc,
      }
    } catch (error: any) {
      return {
        success: false,
        message: this.getErrorMessage(error.code),
      }
    }
  }

  async createUserProfile(
    uid: string,
    userData: Omit<User, "uid" | "fechaCreacion" | "fechaActualizacion">,
  ): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const userDoc: User = this.createUnifiedUserObject({
        uid,
        ...userData,
      })

      await this.setUserDocument(uid, userDoc)

      // NUEVO: Registrar creación de perfil en auditoría
      await this.auditService.logUserCreation(uid, userData.nombre || "Usuario nuevo")

      return {
        success: true,
        message: "Perfil de usuario creado exitosamente",
        user: userDoc,
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Error al crear perfil: " + error.message,
      }
    }
  }

  async createSocialUserProfile(
    uid: string,
    displayName: string,
    email: string,
    provider: string,
    telefono?: string,
    photoURL?: string,
  ): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const userDocRef = doc(this.firestore, "users", uid)

      const userData = {
        uid: uid,
        nombre: displayName || "Usuario sin nombre",
        correo: email || `${uid}@unknown.local`,
        telefono: telefono || "",
        provider: provider,
        displayName: displayName,
        email: email,
        photoURL: photoURL || null,
        emailVerified: false,
        fechaCreacion: new Date(),
        createdAt: new Date(),
        registeredAt: new Date(),
        fechaActualizacion: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      }

      await setDoc(userDocRef, userData)

      const normalizedUser = this.normalizeUserData(userData)

      // NUEVO: Registrar creación de perfil social en auditoría
      await this.auditService.logUserCreation(uid, displayName || "Usuario social")

      return {
        success: true,
        message: "Perfil de usuario social creado exitosamente",
        user: normalizedUser,
      }
    } catch (error: any) {
      console.error("Error al crear perfil social:", error)
      return {
        success: false,
        message: "Error al crear perfil social: " + error.message,
      }
    }
  }

  getCurrentUser(): Observable<User | null> {
    return new Observable((observer) => {
      const unsubscribe = this.auth.onAuthStateChanged(async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          try {
            const userData = await this.getUserById(firebaseUser.uid)
            observer.next(userData)
          } catch (error) {
            console.error("Error al obtener datos del usuario:", error)
            observer.next(null)
          }
        } else {
          observer.next(null)
        }
      })

      return () => unsubscribe()
    })
  }

  async getUserById(uid: string): Promise<User | null> {
    try {
      const userDocRef = doc(this.firestore, "users", uid)
      const userSnapshot = await getDoc(userDocRef)

      if (userSnapshot.exists()) {
        const data = userSnapshot.data()
        return this.normalizeUserData({ uid, ...data })
      }
      return null
    } catch (error) {
      console.error("Error al obtener usuario:", error)
      return null
    }
  }

  async getUserByEmail(correo: string): Promise<User | null> {
    try {
      const queries = [
        query(this.usersCollection, where("correo", "==", correo)),
        query(this.usersCollection, where("email", "==", correo)),
      ]

      for (const q of queries) {
        const querySnapshot = await getDocs(q)
        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0]
          const data = docSnap.data()
          return this.normalizeUserData({ uid: docSnap.id, ...data })
        }
      }

      return null
    } catch (error) {
      console.error("Error al obtener usuario por correo:", error)
      return null
    }
  }

  async getUsersByProvider(provider: string): Promise<User[]> {
    try {
      const q = query(this.usersCollection, where("provider", "==", provider))
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return this.normalizeUserData({ uid: doc.id, ...data })
      })
    } catch (error) {
      console.error("Error al obtener usuarios por proveedor:", error)
      return []
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const usersCollection = collection(this.firestore, "users")
      const querySnapshot = await getDocs(usersCollection)

      const users: User[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        const normalizedUser = this.normalizeUserData({ uid: doc.id, ...data })
        users.push(normalizedUser)
      })

      // NUEVO: Registrar consulta de todos los usuarios
      const currentUser = await this.getCurrentUserForAudit()
      if (currentUser) {
        await this.auditService.logAuditEvent({
          uid: currentUser.uid,
          nombre: currentUser.nombre,
          accion: "profile_view" as any,
          detalles: `Consulta de todos los usuarios (${users.length} registros)`,
        })
      }

      console.log("Usuarios cargados:", users.length)
      return users
    } catch (error) {
      console.error("Error al obtener usuarios:", error)
      throw new Error("No se pudieron cargar los usuarios")
    }
  }

  async updateUser(uid: string, userData: Partial<User>): Promise<{ success: boolean; message: string }> {
    try {
      const userDocRef = doc(this.firestore, "users", uid)

      const updateData = {
        ...userData,
        fechaActualizacion: new Date(),
        updatedAt: new Date(),
      }

      delete updateData.uid
      delete updateData.fechaCreacion

      await updateDoc(userDocRef, updateData)

      // NUEVO: Registrar actualización de usuario en auditoría
      const currentUser = await this.getCurrentUserForAudit()
      if (currentUser) {
        const targetUser = await this.getUserById(uid)
        const targetName = targetUser?.nombre || "Usuario desconocido"

        await this.auditService.logAuditEvent({
          uid: currentUser.uid,
          nombre: currentUser.nombre,
          accion: "update" as any,
          detalles: `Actualización de usuario: ${targetName} (${uid})`,
        })
      }

      return {
        success: true,
        message: "Usuario actualizado exitosamente",
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Error al actualizar usuario: " + error.message,
      }
    }
  }

  async updateUserProvider(uid: string, provider: string): Promise<{ success: boolean; message: string }> {
    try {
      const userDocRef = doc(this.firestore, "users", uid)

      await updateDoc(userDocRef, {
        provider: provider,
        fechaActualizacion: new Date(),
        updatedAt: new Date(),
      })

      // NUEVO: Registrar actualización de proveedor en auditoría
      const currentUser = await this.getCurrentUserForAudit()
      if (currentUser) {
        const targetUser = await this.getUserById(uid)
        const targetName = targetUser?.nombre || "Usuario desconocido"

        await this.auditService.logAuditEvent({
          uid: currentUser.uid,
          nombre: currentUser.nombre,
          accion: "update" as any,
          detalles: `Actualización de proveedor a ${provider} para usuario: ${targetName}`,
        })
      }

      return {
        success: true,
        message: "Proveedor actualizado exitosamente",
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Error al actualizar proveedor: " + error.message,
      }
    }
  }

  async updatePassword(newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const currentUser = this.auth.currentUser
      if (!currentUser) {
        return {
          success: false,
          message: "No hay usuario autenticado",
        }
      }

      await updatePassword(currentUser, newPassword)

      // NUEVO: Registrar cambio de contraseña en auditoría
      const userData = await this.getUserById(currentUser.uid)
      const userName = userData?.nombre || currentUser.displayName || currentUser.email || "Usuario desconocido"

      await this.auditService.logPasswordChange(currentUser.uid, userName)

      return {
        success: true,
        message: "Contraseña actualizada exitosamente",
      }
    } catch (error: any) {
      return {
        success: false,
        message: this.getErrorMessage(error.code),
      }
    }
  }

  async deleteUser(uid: string): Promise<{ success: boolean; message: string }> {
    try {
      // Obtener información del usuario antes de eliminarlo
      const targetUser = await this.getUserById(uid)
      const targetName = targetUser?.nombre || "Usuario desconocido"

      // Eliminar documento de Firestore
      const userDocRef = doc(this.firestore, "users", uid)
      await deleteDoc(userDocRef)

      // Si es el usuario actual, eliminar de Auth
      const currentUser = this.auth.currentUser
      if (currentUser && currentUser.uid === uid) {
        await deleteAuthUser(currentUser)
      }

      // NUEVO: Registrar eliminación de usuario en auditoría
      const auditUser = await this.getCurrentUserForAudit()
      if (auditUser) {
        await this.auditService.logAuditEvent({
          uid: auditUser.uid,
          nombre: auditUser.nombre,
          accion: "delete" as any,
          detalles: `Eliminación de usuario: ${targetName} (${uid})`,
        })
      }

      return {
        success: true,
        message: "Usuario eliminado exitosamente",
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Error al eliminar usuario: " + error.message,
      }
    }
  }

  async signIn(correo: string, contraseña: string): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, correo, contraseña)
      const userData = await this.getUserById(userCredential.user.uid)

      // El login ya se registra automáticamente en AuthService

      return {
        success: true,
        message: "Sesión iniciada exitosamente",
        user: userData || undefined,
      }
    } catch (error: any) {
      return {
        success: false,
        message: this.getErrorMessage(error.code),
      }
    }
  }

  async signOut(): Promise<{ success: boolean; message: string }> {
    try {
      // El logout ya se registra automáticamente en AuthService
      await signOut(this.auth)
      return {
        success: true,
        message: "Sesión cerrada exitosamente",
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Error al cerrar sesión: " + error.message,
      }
    }
  }

  async userExists(uid: string): Promise<boolean> {
    try {
      const userDocRef = doc(this.firestore, "users", uid)
      const userSnapshot = await getDoc(userDocRef)
      return userSnapshot.exists()
    } catch (error) {
      console.error("Error al verificar existencia de usuario:", error)
      return false
    }
  }

  async migrateExistingUsers(): Promise<void> {
    try {
      const usersCollection = collection(this.firestore, "users")
      const querySnapshot = await getDocs(usersCollection)

      const batch = writeBatch(this.firestore)

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        const userRef = doc.ref

        if (!data["nombre"] || !data["correo"]) {
          const updateData: any = {}

          if (!data["nombre"] && data["displayName"]) {
            updateData.nombre = data["displayName"]
          }

          if (!data["correo"] && data["email"]) {
            updateData.correo = data["email"]
          }

          if (!data["fechaCreacion"]) {
            updateData.fechaCreacion = data["createdAt"] || data["registeredAt"] || new Date()
          }

          if (Object.keys(updateData).length > 0) {
            batch.update(userRef, updateData)
          }
        }
      })

      await batch.commit()
      console.log("Migración de usuarios completada")
    } catch (error) {
      console.error("Error en migración:", error)
    }
  }

  // MÉTODOS PRIVADOS PARA NORMALIZACIÓN (sin cambios)
  private createUnifiedUserObject(baseData: any): User {
    const now = new Date()

    return {
      uid: baseData.uid,
      nombre: baseData.nombre || baseData.displayName || baseData.name || "Usuario sin nombre",
      correo: baseData.correo || baseData.email || `${baseData.uid}@unknown.local`,
      telefono: baseData.telefono || baseData.phone || "",
      provider: baseData.provider || "email",
      fechaCreacion: baseData.fechaCreacion || now,
      fechaActualizacion: now,
      photoURL: baseData.photoURL || null,
      emailVerified: baseData.emailVerified || false,
      lastLoginAt: baseData.lastLoginAt || null,
    }
  }

  private normalizeUserData(data: any): User {
    const user: User = {
      uid: data.uid || data.id,
      nombre: data.nombre || data.displayName || data.name || "Usuario sin nombre",
      correo: data.correo || data.email || `${data.uid || data.id}@unknown.local`,
      telefono: data.telefono || data.phone || "",
      provider: data.provider || "email",
      fechaCreacion: this.convertToDate(data.fechaCreacion || data.createdAt || data.registeredAt) || new Date(),
      fechaActualizacion: this.convertToDate(data.fechaActualizacion || data.updatedAt) || new Date(),
      photoURL: data.photoURL || null,
      emailVerified: data.emailVerified || false,
      lastLoginAt: this.convertToDate(data.lastLoginAt) || null,
    }

    return user
  }

  private convertToDate(timestamp: any): Date | null {
    if (!timestamp) return null

    if (timestamp instanceof Date) return timestamp

    if (timestamp && typeof timestamp.toDate === "function") {
      return timestamp.toDate()
    }

    if (typeof timestamp === "number") {
      return new Date(timestamp)
    }

    if (typeof timestamp === "string") {
      return new Date(timestamp)
    }

    return null
  }

  private async setUserDocument(uid: string, userData: User): Promise<void> {
    const userDocRef = doc(this.firestore, "users", uid)
    await setDoc(userDocRef, userData)
  }

  private getErrorMessage(errorCode: string): string {
    const errorMessages: { [key: string]: string } = {
      "auth/email-already-in-use": "El correo ya está registrado",
      "auth/weak-password": "La contraseña debe tener al menos 6 caracteres",
      "auth/invalid-email": "El formato del correo es inválido",
      "auth/user-not-found": "Usuario no encontrado",
      "auth/wrong-password": "Contraseña incorrecta",
      "auth/too-many-requests": "Demasiados intentos fallidos. Intenta más tarde",
      "auth/requires-recent-login": "Operación sensible. Vuelve a iniciar sesión",
      "auth/operation-not-allowed": "Operación no permitida",
      "auth/user-disabled": "La cuenta de usuario ha sido deshabilitada",
    }

    return errorMessages[errorCode] || "Error inesperado. Intenta nuevamente"
  }
}
