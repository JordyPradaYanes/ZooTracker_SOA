import { Injectable } from '@angular/core';
import { 
  Auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  UserCredential,
  onAuthStateChanged,
  User as FirebaseUser,
  sendEmailVerification,
  updateProfile
} from '@angular/fire/auth';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userLoggedIn = new BehaviorSubject<boolean>(false);
  private currentUser = new BehaviorSubject<FirebaseUser | null>(null);
  
  constructor(private auth: Auth) {
    // Verificar si el usuario ya está autenticado al iniciar el servicio
    onAuthStateChanged(this.auth, user => {
      console.log('Estado de autenticación cambió:', user ? 'Usuario autenticado' : 'No autenticado');
      this.userLoggedIn.next(!!user);
      this.currentUser.next(user);
    });
  }

  // Obtener el estado de autenticación como Observable
  get isLoggedIn(): Observable<boolean> {
    return this.userLoggedIn.asObservable();
  }

  // Obtener el usuario actual como Observable
  get user$(): Observable<FirebaseUser | null> {
    return this.currentUser.asObservable();
  }
  
  // Iniciar sesión con correo y contraseña
  async loginWithEmailAndPassword(email: string, password: string): Promise<UserCredential> {
    try {
      console.log('Intentando iniciar sesión con:', email);
      const result = await signInWithEmailAndPassword(this.auth, email, password);
      console.log('Resultado de autenticación:', result);
      this.userLoggedIn.next(true);
      this.currentUser.next(result.user);
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
      // Opcional: añadir scopes adicionales
      provider.addScope('profile');
      provider.addScope('email');
      
      const result = await signInWithPopup(this.auth, provider);
      this.userLoggedIn.next(true);
      this.currentUser.next(result.user);
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
      // Opcional: añadir scopes adicionales
      provider.addScope('email');
      
      const result = await signInWithPopup(this.auth, provider);
      this.userLoggedIn.next(true);
      this.currentUser.next(result.user);
      return result;
    } catch (error) {
      console.error('Error en loginWithFacebook:', error);
      throw error;
    }
  }

  // Iniciar sesión con GitHub
  async loginWithGitHub(): Promise<UserCredential> {
    try {
      const provider = new GithubAuthProvider();
      // Opcional: añadir scopes adicionales
      provider.addScope('user:email');
      
      const result = await signInWithPopup(this.auth, provider);
      this.userLoggedIn.next(true);
      this.currentUser.next(result.user);
      return result;
    } catch (error) {
      console.error('Error en loginWithGitHub:', error);
      throw error;
    }
  }
  
  // Registrar un nuevo usuario
  async register(email: string, password: string, displayName?: string): Promise<UserCredential> {
    try {
      const result = await createUserWithEmailAndPassword(this.auth, email, password);
      
      // Actualizar el perfil con el nombre si se proporciona
      if (displayName && result.user) {
        await updateProfile(result.user, { displayName });
      }
      
      this.userLoggedIn.next(true);
      this.currentUser.next(result.user);
      return result;
    } catch (error) {
      console.error('Error en register:', error);
      throw error;
    }
  }

  // Enviar verificación por correo
  async sendEmailVerification(): Promise<void> {
    try {
      const user = this.auth.currentUser;
      if (user) {
        await sendEmailVerification(user);
      } else {
        throw new Error('No hay usuario autenticado');
      }
    } catch (error) {
      console.error('Error al enviar verificación por correo:', error);
      throw error;
    }
  }
  
  // Cerrar sesión
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.userLoggedIn.next(false);
      this.currentUser.next(null);
    } catch (error) {
      console.error('Error en logout:', error);
      throw error;
    }
  }
  
  // Recuperar contraseña
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error) {
      console.error('Error al enviar correo de recuperación:', error);
      throw error;
    }
  }
  
  // Obtener el usuario actual
  getCurrentUser(): FirebaseUser | null {
    return this.auth.currentUser;
  }

  // Verificar si el usuario está verificado
  isEmailVerified(): boolean {
    const user = this.getCurrentUser();
    return user ? user.emailVerified : false;
  }

  // Obtener información del usuario actual
  getCurrentUserInfo(): {
    uid: string | null;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    emailVerified: boolean;
  } | null {
    const user = this.getCurrentUser();
    if (user) {
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified
      };
    }
    return null;
  }

  // Manejar errores de Firebase Auth
  getErrorMessage(errorCode: string): string {
    const errorMessages: { [key: string]: string } = {
      'auth/user-not-found': 'No se encontró una cuenta con este correo electrónico',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/email-already-in-use': 'Ya existe una cuenta con este correo electrónico',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
      'auth/invalid-email': 'El formato del correo electrónico es inválido',
      'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde',
      'auth/operation-not-allowed': 'Operación no permitida',
      'auth/account-exists-with-different-credential': 'Ya existe una cuenta con el mismo correo pero diferente método de inicio de sesión',
      'auth/auth-domain-config-required': 'Configuración de dominio de autenticación requerida',
      'auth/cancelled-popup-request': 'Solicitud de popup cancelada',
      'auth/popup-blocked': 'Popup bloqueado por el navegador',
      'auth/popup-closed-by-user': 'Popup cerrado por el usuario',
      'auth/unauthorized-domain': 'Dominio no autorizado'
    };

    return errorMessages[errorCode] || 'Error inesperado durante la autenticación';
  }
}