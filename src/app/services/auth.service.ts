import { Injectable } from '@angular/core';
import { 
  Auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  UserCredential
} from '@angular/fire/auth';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userLoggedIn = new BehaviorSubject<boolean>(false);
  
  constructor(private auth: Auth) {
    // Verificar si el usuario ya está autenticado
    this.auth.onAuthStateChanged(user => {
      this.userLoggedIn.next(!!user);
    });
  }
  
  // Obtener el estado de autenticación como Observable
  get isLoggedIn(): Observable<boolean> {
    return this.userLoggedIn.asObservable();
  }
  
  // Iniciar sesión con correo y contraseña
  loginWithEmailAndPassword(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(this.auth, email, password);
  }
  
  // Iniciar sesión con Google
  loginWithGoogle(): Promise<UserCredential> {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(this.auth, provider);
  }
  
  // Registrar un nuevo usuario
  register(email: string, password: string): Promise<UserCredential> {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }
  
  // Cerrar sesión
  logout(): Promise<void> {
    return signOut(this.auth);
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