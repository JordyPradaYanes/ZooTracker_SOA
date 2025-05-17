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
  linkWithCredential,
  AuthCredential,
  EmailAuthProvider,
  fetchSignInMethodsForEmail,
  AuthError,
  AuthErrorCodes,
  reauthenticateWithPopup,
  AuthProvider,
  linkWithPopup
} from '@angular/fire/auth';
import { withEventReplay } from '@angular/platform-browser';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userLoggedIn = new BehaviorSubject<boolean>(false);

  constructor(private auth: Auth) {
    // Verificar si el usuario ya está autenticado al iniciar el servicio
    onAuthStateChanged(this.auth, (user) => {
      console.log(
        'Estado de autenticación cambió:',
        user ? 'Usuario autenticado' : 'No autenticado'
      );
      this.userLoggedIn.next(!!user);
    });
  }

  // Añade este nuevo método para GitHub
  async loginWithGitHub(): Promise<UserCredential> {
    try {
      const provider = new GithubAuthProvider();
      // Opcional: puedes añadir scopes adicionales

      return await this.loginWithProvider(provider);
    } catch (error) {
      console.error('Error en loginWithGitHub:', error);
      throw error;
    }
  }

  // Obtener el estado de autenticación como Observable
  get isLoggedIn(): Observable<boolean> {
    return this.userLoggedIn.asObservable();
  }

  // Iniciar sesión con correo y contraseña
  async loginWithEmailAndPassword(
    email: string,
    password: string
  ): Promise<UserCredential> {
    try {
      console.log('Intentando iniciar sesión con:', email);
      const result = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );
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
      return await this.loginWithProvider(provider);
    } catch (error) {
      console.error('Error en loginWithGoogle:', error);
      throw error;
    }
  }

  // Iniciar sesión con Facebook
  async loginWithFacebook(): Promise<UserCredential> {
    try {
      const provider = new FacebookAuthProvider();
      return await this.loginWithProvider(provider);
    } catch (error) {
      console.error('Error en loginWithFacebook:', error);
      throw error;
    }
  }

  // Método centralizado para manejar autenticación con proveedores
  private async loginWithProvider(provider: AuthProvider): Promise<UserCredential> {
    try {
      const result = await signInWithPopup(this.auth, provider);
      this.userLoggedIn.next(true);
      return result;
    } catch (error: any) {
      // Manejar el caso de cuenta existente con diferentes credenciales
      if (error.code === 'auth/account-exists-with-different-credential') {
        return await this.handleAccountLinking(error);
      }
      throw error;
    }
  }

  // Manejar la vinculación de cuentas cuando el email ya existe con otro proveedor
  private async handleAccountLinking(error: AuthError): Promise<UserCredential> {
    // Obtenemos el email que está en conflicto
    const email = error.customData?.email as string;
    if (!email) {
      throw new Error('No se pudo obtener el email para vincular las cuentas');
    }

    // Obtenemos los métodos de inicio de sesión para este email
    const methods = await fetchSignInMethodsForEmail(this.auth, email);
    
    // Aquí debería haber un diálogo con el usuario para confirmar la vinculación
    // Por ahora, simulamos que el usuario siempre acepta vincular
    const shouldLink = true; // Esto debería venir de un diálogo de confirmación en la UI
    
    if (!shouldLink) {
      throw new Error('Vinculación de cuentas cancelada por el usuario');
    }

    // Determinar qué proveedor usar para iniciar sesión primero
    const pendingCredential = (error as any).credential as AuthCredential;
    
    // Prompt al usuario para iniciar sesión con uno de los proveedores existentes
    // Ejemplo usando el primer método disponible (esto debería ser mejorado en la UI)
    let result: UserCredential;
    
    if (methods.includes('password')) {
      // Necesitaríamos pedir al usuario su contraseña - simulando aquí
      const password = prompt('Ingrese su contraseña para vincular cuentas:');
      if (!password) {
        throw new Error('Se requiere contraseña para vincular cuentas');
      }
      result = await signInWithEmailAndPassword(this.auth, email, password);
    } else if (methods.includes('google.com')) {
      result = await signInWithPopup(this.auth, new GoogleAuthProvider());
    } else if (methods.includes('facebook.com')) {
      result = await signInWithPopup(this.auth, new FacebookAuthProvider());
    } else if (methods.includes('github.com')) {
      result = await signInWithPopup(this.auth, new GithubAuthProvider());
    } else {
      throw new Error(`Método de inicio de sesión no soportado: ${methods.join(', ')}`);
    }

    // Una vez que tenemos la autenticación con un proveedor, vinculamos la credencial pendiente
    if (this.auth.currentUser) {
      await linkWithCredential(this.auth.currentUser, pendingCredential);
      this.userLoggedIn.next(true);
      return result;
    } else {
      throw new Error('No hay usuario autenticado para vincular cuentas');
    }
  }

  // Método para vincular explícitamente un proveedor a la cuenta actual
  async linkWithProvider(providerType: 'google' | 'facebook' | 'github'): Promise<UserCredential | null> {
    if (!this.auth.currentUser) {
      console.error('No hay usuario autenticado para vincular proveedores');
      return null;
    }

    let provider: AuthProvider;
    switch (providerType) {
      case 'google':
        provider = new GoogleAuthProvider();
        break;
      case 'facebook':
        provider = new FacebookAuthProvider();
        break;
      case 'github':
        provider = new GithubAuthProvider();
        break;
    }

    try {
      // Es posible que necesitemos reautenticar antes de vincular
      return await linkWithPopup(this.auth.currentUser, provider);
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        // Necesitamos reautenticar primero
        await reauthenticateWithPopup(this.auth.currentUser, provider);
        // Intentamos vincular de nuevo
        return await linkWithPopup(this.auth.currentUser, provider);
      }
      console.error('Error al vincular proveedor:', error);
      throw error;
    }
  }

  // Método para verificar si un email ya está en uso y con qué proveedores
  async getSignInMethodsForEmail(email: string): Promise<string[]> {
    try {
      return await fetchSignInMethodsForEmail(this.auth, email);
    } catch (error) {
      console.error('Error al verificar métodos de inicio de sesión:', error);
      throw error;
    }
  }

  provideClientHydration() {
    return withEventReplay();
  }

  // Registrar un nuevo usuario
  async register(email: string, password: string): Promise<UserCredential> {
    try {
      const result = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );
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