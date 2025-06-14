// user.service.ts
import { Injectable } from '@angular/core';
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
  orderBy,
  DocumentReference,
  CollectionReference,
  serverTimestamp,
  writeBatch
} from '@angular/fire/firestore';
import { 
  Auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  User as FirebaseUser,
  deleteUser as deleteAuthUser
} from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { User, CreateUserData } from './../interface/user.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private usersCollection: CollectionReference;

  constructor(
    private firestore: Firestore,
    private auth: Auth
  ) {
    this.usersCollection = collection(this.firestore, 'users');
  }

  // Crear usuario con Auth y Firestore
  async createUser(userData: CreateUserData): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      // 1. Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        this.auth, 
        userData.correo, 
        userData.contraseña
      );

      // 2. Crear documento en Firestore usando estructura unificada
      const userDoc: User = this.createUnifiedUserObject({
        uid: userCredential.user.uid,
        nombre: userData.nombre,
        correo: userData.correo,
        telefono: userData.telefono || '',
        provider: userData.provider || 'email'
      });

      // 3. Guardar en Firestore usando el UID como ID del documento
      await this.setUserDocument(userCredential.user.uid, userDoc);

      return {
        success: true,
        message: 'Usuario creado exitosamente',
        user: userDoc
      };

    } catch (error: any) {
      return {
        success: false,
        message: this.getErrorMessage(error.code)
      };
    }
  }

  // Crear usuario solo en Firestore (para auth social)
  async createUserProfile(
    uid: string, 
    userData: Omit<User, 'uid' | 'fechaCreacion' | 'fechaActualizacion'>
  ): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const userDoc: User = this.createUnifiedUserObject({
        uid,
        ...userData
      });

      await this.setUserDocument(uid, userDoc);

      return {
        success: true,
        message: 'Perfil de usuario creado exitosamente',
        user: userDoc
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Error al crear perfil: ' + error.message
      };
    }
  }

  // Método mejorado para crear perfil social con normalización
  async createSocialUserProfile(
    uid: string,
    displayName: string,
    email: string,
    provider: string,
    telefono?: string,
    photoURL?: string
  ): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const userDocRef = doc(this.firestore, 'users', uid);
      
      // Estructura unificada para todos los usuarios
      const userData = {
        uid: uid,
        // Mapear a campos estándar
        nombre: displayName || 'Usuario sin nombre',
        correo: email || `${uid}@unknown.local`,
        telefono: telefono || '',
        provider: provider,
        // Campos adicionales para usuarios sociales (compatibilidad)
        displayName: displayName,
        email: email,
        photoURL: photoURL || null,
        emailVerified: false,
        // Fechas unificadas
        fechaCreacion: new Date(),
        createdAt: new Date(),
        registeredAt: new Date(),
        fechaActualizacion: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null
      };
      
      await setDoc(userDocRef, userData);
      
      // Crear objeto User normalizado para respuesta
      const normalizedUser = this.normalizeUserData(userData);
      
      return {
        success: true,
        message: 'Perfil de usuario social creado exitosamente',
        user: normalizedUser
      };
      
    } catch (error: any) {
      console.error('Error al crear perfil social:', error);
      return {
        success: false,
        message: 'Error al crear perfil social: ' + error.message
      };
    }
  }

  // Obtener usuario actual (Auth + Firestore)
  getCurrentUser(): Observable<User | null> {
    return new Observable(observer => {
      const unsubscribe = this.auth.onAuthStateChanged(async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          try {
            const userData = await this.getUserById(firebaseUser.uid);
            observer.next(userData);
          } catch (error) {
            console.error('Error al obtener datos del usuario:', error);
            observer.next(null);
          }
        } else {
          observer.next(null);
        }
      });

      // Retornar función de cleanup
      return () => unsubscribe();
    });
  }

  // Obtener usuario por ID con normalización
  async getUserById(uid: string): Promise<User | null> {
    try {
      const userDocRef = doc(this.firestore, 'users', uid);
      const userSnapshot = await getDoc(userDocRef);
      
      if (userSnapshot.exists()) {
        const data = userSnapshot.data();
        return this.normalizeUserData({ uid, ...data });
      }
      return null;
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      return null;
    }
  }

  // Obtener usuario por correo con normalización
  async getUserByEmail(correo: string): Promise<User | null> {
    try {
      // Buscar tanto en campo 'correo' como 'email' para compatibilidad
      const queries = [
        query(this.usersCollection, where('correo', '==', correo)),
        query(this.usersCollection, where('email', '==', correo))
      ];
      
      for (const q of queries) {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const data = docSnap.data();
          return this.normalizeUserData({ uid: docSnap.id, ...data });
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error al obtener usuario por correo:', error);
      return null;
    }
  }

  // Obtener usuarios por proveedor
  async getUsersByProvider(provider: string): Promise<User[]> {
    try {
      const q = query(this.usersCollection, where('provider', '==', provider));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return this.normalizeUserData({ uid: doc.id, ...data });
      });
    } catch (error) {
      console.error('Error al obtener usuarios por proveedor:', error);
      return [];
    }
  }

  // Obtener todos los usuarios con normalización mejorada
  async getAllUsers(): Promise<User[]> {
    try {
      const usersCollection = collection(this.firestore, 'users');
      const querySnapshot = await getDocs(usersCollection);
      
      const users: User[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const normalizedUser = this.normalizeUserData({ uid: doc.id, ...data });
        users.push(normalizedUser);
      });
      
      console.log('Usuarios cargados:', users.length);
      console.log('Detalle usuarios:', users);
      
      return users;
      
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw new Error('No se pudieron cargar los usuarios');
    }
  }

  // Actualizar usuario
  async updateUser(uid: string, userData: Partial<User>): Promise<{ success: boolean; message: string }> {
    try {
      const userDocRef = doc(this.firestore, 'users', uid);
      
      const updateData = {
        ...userData,
        fechaActualizacion: new Date(),
        updatedAt: new Date()
      };

      // Remover campos que no se deben actualizar
      delete updateData.uid;
      delete updateData.fechaCreacion;

      await updateDoc(userDocRef, updateData);

      return {
        success: true,
        message: 'Usuario actualizado exitosamente'
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Error al actualizar usuario: ' + error.message
      };
    }
  }

  // Actualizar proveedor específicamente
  async updateUserProvider(uid: string, provider: string): Promise<{ success: boolean; message: string }> {
    try {
      const userDocRef = doc(this.firestore, 'users', uid);
      
      await updateDoc(userDocRef, {
        provider: provider,
        fechaActualizacion: new Date(),
        updatedAt: new Date()
      });

      return {
        success: true,
        message: 'Proveedor actualizado exitosamente'
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Error al actualizar proveedor: ' + error.message
      };
    }
  }

  // Actualizar contraseña
  async updatePassword(newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        return {
          success: false,
          message: 'No hay usuario autenticado'
        };
      }

      await updatePassword(currentUser, newPassword);
      
      return {
        success: true,
        message: 'Contraseña actualizada exitosamente'
      };
    } catch (error: any) {
      return {
        success: false,
        message: this.getErrorMessage(error.code)
      };
    }
  }

  // Eliminar usuario (Auth + Firestore)
  async deleteUser(uid: string): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Eliminar documento de Firestore
      const userDocRef = doc(this.firestore, 'users', uid);
      await deleteDoc(userDocRef);

      // 2. Si es el usuario actual, eliminar de Auth
      const currentUser = this.auth.currentUser;
      if (currentUser && currentUser.uid === uid) {
        await deleteAuthUser(currentUser);
      }

      return {
        success: true,
        message: 'Usuario eliminado exitosamente'
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Error al eliminar usuario: ' + error.message
      };
    }
  }

  // Iniciar sesión
  async signIn(correo: string, contraseña: string): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, correo, contraseña);
      const userData = await this.getUserById(userCredential.user.uid);

      return {
        success: true,
        message: 'Sesión iniciada exitosamente',
        user: userData || undefined
      };
    } catch (error: any) {
      return {
        success: false,
        message: this.getErrorMessage(error.code)
      };
    }
  }

  // Cerrar sesión
  async signOut(): Promise<{ success: boolean; message: string }> {
    try {
      await signOut(this.auth);
      return {
        success: true,
        message: 'Sesión cerrada exitosamente'
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Error al cerrar sesión: ' + error.message
      };
    }
  }

  // Verificar si existe usuario en Firestore
  async userExists(uid: string): Promise<boolean> {
    try {
      const userDocRef = doc(this.firestore, 'users', uid);
      const userSnapshot = await getDoc(userDocRef);
      return userSnapshot.exists();
    } catch (error) {
      console.error('Error al verificar existencia de usuario:', error);
      return false;
    }
  }

  // Método para migrar usuarios existentes (ejecutar una sola vez)
  async migrateExistingUsers(): Promise<void> {
    try {
      const usersCollection = collection(this.firestore, 'users');
      const querySnapshot = await getDocs(usersCollection);
      
      const batch = writeBatch(this.firestore);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const userRef = doc.ref;
        
        // Solo actualizar si no tiene los campos estándar
        if (!data["nombre"] || !data["correo"]) {
          const updateData: any = {};
          
          // Mapear nombre
          if (!data["nombre"] && data["displayName"]) {
            updateData.nombre = data["displayName"];
          }
          
          // Mapear email
          if (!data["correo"] && data["email"]) {
            updateData.correo = data["email"];
          }
          
          // Agregar campos faltantes
          if (!data["fechaCreacion"]) {
            updateData.fechaCreacion = data["createdAt"] || data["registeredAt"] || new Date();
          }
          
          if (Object.keys(updateData).length > 0) {
            batch.update(userRef, updateData);
          }
        }
      });
      
      await batch.commit();
      console.log('Migración de usuarios completada');
      
    } catch (error) {
      console.error('Error en migración:', error);
    }
  }

  // MÉTODOS PRIVADOS PARA NORMALIZACIÓN

  // Crear objeto usuario unificado
  private createUnifiedUserObject(baseData: any): User {
    const now = new Date();
    
    return {
      uid: baseData.uid,
      nombre: baseData.nombre || baseData.displayName || baseData.name || 'Usuario sin nombre',
      correo: baseData.correo || baseData.email || `${baseData.uid}@unknown.local`,
      telefono: baseData.telefono || baseData.phone || '',
      provider: baseData.provider || 'email',
      fechaCreacion: baseData.fechaCreacion || now,
      fechaActualizacion: now,
      // Campos adicionales para compatibilidad
      photoURL: baseData.photoURL || null,
      emailVerified: baseData.emailVerified || false,
      lastLoginAt: baseData.lastLoginAt || null
    };
  }

  // Normalizar datos de usuario independientemente del proveedor
  private normalizeUserData(data: any): User {
    const user: User = {
      uid: data.uid || data.id,
      // Mapear nombre desde diferentes campos posibles
      nombre: data.nombre || data.displayName || data.name || 'Usuario sin nombre',
      // Mapear email desde diferentes campos posibles
      correo: data.correo || data.email || `${data.uid || data.id}@unknown.local`,
      // Otros campos opcionales
      telefono: data.telefono || data.phone || '',
      provider: data.provider || 'email',
      fechaCreacion: this.convertToDate(data.fechaCreacion || data.createdAt || data.registeredAt) || new Date(),
      fechaActualizacion: this.convertToDate(data.fechaActualizacion || data.updatedAt) || new Date(),
      // Campos adicionales para usuarios sociales
      photoURL: data.photoURL || null,
      emailVerified: data.emailVerified || false,
      lastLoginAt: this.convertToDate(data.lastLoginAt) || null
    };
    
    return user;
  }

  // Convertir timestamps de Firestore a Date
  private convertToDate(timestamp: any): Date | null {
    if (!timestamp) return null;
    
    // Si ya es un objeto Date
    if (timestamp instanceof Date) return timestamp;
    
    // Si es un timestamp de Firestore
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    
    // Si es un timestamp numérico
    if (typeof timestamp === 'number') {
      return new Date(timestamp);
    }
    
    // Si es una cadena de fecha
    if (typeof timestamp === 'string') {
      return new Date(timestamp);
    }
    
    return null;
  }

  // Método privado para establecer documento de usuario
  private async setUserDocument(uid: string, userData: User): Promise<void> {
    const userDocRef = doc(this.firestore, 'users', uid);
    await setDoc(userDocRef, userData);
  }

  // Método privado para manejar errores de Firebase
  private getErrorMessage(errorCode: string): string {
    const errorMessages: { [key: string]: string } = {
      'auth/email-already-in-use': 'El correo ya está registrado',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
      'auth/invalid-email': 'El formato del correo es inválido',
      'auth/user-not-found': 'Usuario no encontrado',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde',
      'auth/requires-recent-login': 'Operación sensible. Vuelve a iniciar sesión',
      'auth/operation-not-allowed': 'Operación no permitida',
      'auth/user-disabled': 'La cuenta de usuario ha sido deshabilitada'
    };

    return errorMessages[errorCode] || 'Error inesperado. Intenta nuevamente';
  }
}