import { Injectable } from '@angular/core';
import { 
  Auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  UserCredential,
  onAuthStateChanged
} from '@angular/fire/auth';
import { withEventReplay } from '@angular/platform-browser';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userLoggedIn = new BehaviorSubject<boolean>(false);
  
  constructor(private auth: Auth) {
    // Verificar si el usuario ya está autenticado al iniciar el servicio
    onAuthStateChanged(this.auth, user => {
      console.log('Estado de autenticación cambió:', user ? 'Usuario autenticado' : 'No autenticado');
      this.userLoggedIn.next(!!user);
    });
  }
  
  // Obtener el estado de autenticación como Observable
  get isLoggedIn(): Observable<boolean> {
    return this.userLoggedIn.asObservable();
  }
  
  // Iniciar sesión con correo y contraseña
  async loginWithEmailAndPassword(email: string, password: string): Promise<UserCredential> {
    try {
      console.log('Intentando iniciar sesión con:', email);
      const result = await signInWithEmailAndPassword(this.auth, email, password);
      console.log('Resultado de autenticación:', result);
      this.userLoggedIn.next(true);
      return result;
    } catch (error) {
      console.error('Error en loginWithEmailAndPassword:', error);
      throw error;
    }
  }
  
  // Iniciar sesión con Google
  async loginWithGoogle(): Promise<UserCredential> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      this.userLoggedIn.next(true);
      return result;
    } catch (error) {
      console.error('Error en loginWithGoogle:', error);
      throw error;
    }
  }
  
  // Iniciar sesión con Facebook
  async loginWithFacebook(): Promise<UserCredential> {
    try {
      const provider = new FacebookAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      this.userLoggedIn.next(true);
      return result;
    } catch (error) {
      console.error('Error en loginWithFacebook:', error);
      throw error;
    }
  }

  provideClientHydration() {
    return withEventReplay();
  }
  
  // Registrar un nuevo usuario
  async register(email: string, password: string): Promise<UserCredential> {
    try {
      const result = await createUserWithEmailAndPassword(this.auth, email, password);
      this.userLoggedIn.next(true);
      return result;
    } catch (error) {
      console.error('Error en register:', error);
      throw error;
    }
  }
  
  // Cerrar sesión
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.userLoggedIn.next(false);
    } catch (error) {
      console.error('Error en logout:', error);
      throw error;
    }
  }
  
  // Recuperar contraseña
  resetPassword(email: string): Promise<void> {
    return sendPasswordResetEmail(this.auth, email);
  }
  
  // Obtener el usuario actual
  getCurrentUser() {
    return this.auth.currentUser;
  }
}