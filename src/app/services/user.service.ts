// user.service.ts
import { Injectable } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  setDoc, // Cambiado de addDoc a setDoc
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  orderBy,
  DocumentReference,
  CollectionReference,
  serverTimestamp
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

      // 2. Crear documento en Firestore con el UID del usuario autenticado
      const userDoc: User = {
        uid: userCredential.user.uid,
        nombre: userData.nombre,
        correo: userData.correo,
        telefono: userData.telefono,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
      };

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
  async createUserProfile(uid: string, userData: Omit<User, 'uid' | 'fechaCreacion' | 'fechaActualizacion'>): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const userDoc: User = {
        uid,
        ...userData,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
      };

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

  // Obtener usuario por ID
  async getUserById(uid: string): Promise<User | null> {
    try {
      const userDocRef = doc(this.firestore, 'users', uid);
      const userSnapshot = await getDoc(userDocRef);
      
      if (userSnapshot.exists()) {
        const data = userSnapshot.data();
        return { 
          uid, 
          ...data,
          // Convertir timestamps de Firestore a Date si es necesario
          fechaCreacion: data['fechaCreacion']?.toDate() || data['fechaCreacion'],
          fechaActualizacion: data['fechaActualizacion']?.toDate() || data['fechaActualizacion']
        } as User;
      }
      return null;
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      return null;
    }
  }

  // Obtener usuario por correo
  async getUserByEmail(correo: string): Promise<User | null> {
    try {
      const q = query(this.usersCollection, where('correo', '==', correo));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        const data = docSnap.data();
        return { 
          uid: docSnap.id, 
          ...data,
          fechaCreacion: data['fechaCreacion']?.toDate() || data['fechaCreacion'],
          fechaActualizacion: data['fechaActualizacion']?.toDate() || data['fechaActualizacion']
        } as User;
      }
      return null;
    } catch (error) {
      console.error('Error al obtener usuario por correo:', error);
      return null;
    }
  }

  // Obtener todos los usuarios
  async getAllUsers(): Promise<User[]> {
    try {
      const q = query(this.usersCollection, orderBy('fechaCreacion', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          ...data,
          fechaCreacion: data['fechaCreacion']?.toDate() || data['fechaCreacion'],
          fechaActualizacion: data['fechaActualizacion']?.toDate() || data['fechaActualizacion']
        };
      }) as User[];
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      return [];
    }
  }

  // Actualizar usuario
  async updateUser(uid: string, userData: Partial<User>): Promise<{ success: boolean; message: string }> {
    try {
      const userDocRef = doc(this.firestore, 'users', uid);
      
      const updateData = {
        ...userData,
        fechaActualizacion: new Date()
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