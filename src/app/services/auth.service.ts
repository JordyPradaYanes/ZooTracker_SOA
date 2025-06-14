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
  updateProfile,
  fetchSignInMethodsForEmail,
} from '@angular/fire/auth';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  Firestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from '@angular/fire/firestore';
// Import UserService
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userLoggedIn = new BehaviorSubject<boolean>(false);
  private currentUser = new BehaviorSubject<FirebaseUser | null>(null);

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private userService: UserService // Inject UserService
  ) {
    // Verificar si el usuario ya está autenticado al iniciar el servicio
    onAuthStateChanged(this.auth, (user) => {
      console.log(
        'Estado de autenticación cambió:',
        user ? 'Usuario autenticado' : 'No autenticado'
      );
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

  // Verificar si un correo ya está registrado
  async checkIfEmailExists(email: string): Promise<boolean> {
    try {
      const signInMethods = await fetchSignInMethodsForEmail(this.auth, email);
      return signInMethods.length > 0;
    } catch (error) {
      console.error('Error al verificar correo:', error);
      throw error;
    }
  }

  // Guardar información del proveedor en Firestore
  private async saveProviderInfo(
    user: FirebaseUser,
    provider: string,
    additionalData?: any
  ): Promise<void> {
    try {
      const userDocRef = doc(this.firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      const providerData = {
        provider: provider,
        providerId: user.providerData[0]?.providerId || provider,
        lastLoginAt: new Date(),
        ...additionalData,
      };

      if (userDoc.exists()) {
        // Actualizar documento existente
        await updateDoc(userDocRef, {
          ...providerData,
          updatedAt: new Date(),
        });
      } else {
        // Crear nuevo documento
        await setDoc(
          userDocRef,
          {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            emailVerified: user.emailVerified,
            createdAt: new Date(),
            ...providerData,
          },
          { merge: true }
        );
      }

      console.log(
        `Información del proveedor ${provider} guardada exitosamente`
      );
    } catch (error) {
      console.error('Error al guardar información del proveedor:', error);
      // No lanzar error para no interrumpir el flujo de autenticación
    }
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

      // Guardar información del proveedor
      await this.saveProviderInfo(result.user, 'email', {
        loginMethod: 'email-password',
      });

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

      // Guardar información del proveedor Google
      await this.saveProviderInfo(result.user, 'google', {
        loginMethod: 'google-popup',
      });

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

      // Guardar información del proveedor Facebook
      await this.saveProviderInfo(result.user, 'facebook', {
        loginMethod: 'facebook-popup',
      });

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

      // Guardar información del proveedor GitHub
      await this.saveProviderInfo(result.user, 'github', {
        loginMethod: 'github-popup',
      });

      this.userLoggedIn.next(true);
      this.currentUser.next(result.user);
      return result;
    } catch (error) {
      console.error('Error en loginWithGitHub:', error);
      throw error;
    }
  }

  // Registrar un nuevo usuario
  async register(
    email: string,
    password: string,
    displayName?: string
  ): Promise<UserCredential> {
    try {
      const result = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      // Actualizar el perfil con el nombre si se proporciona
      if (displayName && result.user) {
        await updateProfile(result.user, { displayName });
      }

      // Guardar información del proveedor para registro con email
      await this.saveProviderInfo(result.user, 'email', {
        loginMethod: 'email-registration',
        registeredAt: new Date(),
      });

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
        emailVerified: user.emailVerified,
      };
    }
    return null;
  }

  // Obtener información del proveedor del usuario actual
  async getCurrentUserProvider(): Promise<{
    provider: string;
    providerId: string;
    loginMethod: string;
  } | null> {
    try {
      const user = this.getCurrentUser();
      if (!user) return null;

      const userDocRef = doc(this.firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          provider: userData['provider'] || 'unknown',
          providerId: userData['providerId'] || 'unknown',
          loginMethod: userData['loginMethod'] || 'unknown',
        };
      }
      return null;
    } catch (error) {
      console.error('Error al obtener información del proveedor:', error);
      return null;
    }
  }

  // Manejar errores de Firebase Auth
  getErrorMessage(errorCode: string): string {
    const errorMessages: { [key: string]: string } = {
      'auth/user-not-found':
        'No se encontró una cuenta con este correo electrónico',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/email-already-in-use':
        'Ya existe una cuenta con este correo electrónico',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
      'auth/invalid-email': 'El formato del correo electrónico es inválido',
      'auth/too-many-requests':
        'Demasiados intentos fallidos. Intenta más tarde',
      'auth/operation-not-allowed': 'Operación no permitida',
      'auth/account-exists-with-different-credential':
        'Ya existe una cuenta con el mismo correo pero diferente método de inicio de sesión',
      'auth/auth-domain-config-required':
        'Configuración de dominio de autenticación requerida',
      'auth/cancelled-popup-request': 'Solicitud de popup cancelada',
      'auth/popup-blocked': 'Popup bloqueado por el navegador',
      'auth/popup-closed-by-user': 'Popup cerrado por el usuario',
      'auth/unauthorized-domain': 'Dominio no autorizado',
    };

    return (
      errorMessages[errorCode] || 'Error inesperado durante la autenticación'
    );
  }

  // auth.service.ts - Método signInWithGithub corregido

  async signInWithGithub(): Promise<{
    success: boolean;
    message: string;
    user?: any;
  }> {
    try {
      const provider = new GithubAuthProvider();
      provider.addScope('user:email');
      provider.addScope('read:user');

      const result = await signInWithPopup(this.auth, provider);
      const firebaseUser = result.user;

      // Extraer información
      let userEmail = firebaseUser.email;
      let userName = firebaseUser.displayName || 'Usuario GitHub';

      if (!userEmail && firebaseUser.providerData.length > 0) {
        const githubData = firebaseUser.providerData.find(
          (p) => p.providerId === 'github.com'
        );
        if (githubData) {
          userEmail = githubData.email;
        }
      }

      if (!userEmail) {
        userEmail = `${firebaseUser.uid}@github.local`;
      }

      const userDocRef = doc(this.firestore, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        // Usuario existente - actualizar con estructura unificada
        const updateData = {
          // Campos principales
          nombre: userName,
          correo: userEmail,
          // Campos sociales
          displayName: userName,
          email: userEmail,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
          provider: 'github',
          providerId: 'github.com',
          loginMethod: 'github-popup',
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        };

        await updateDoc(userDocRef, updateData);

        this.userLoggedIn.next(true);
        this.currentUser.next(firebaseUser);

        const updatedDoc = await getDoc(userDocRef);
        return {
          success: true,
          message: 'Sesión iniciada con GitHub exitosamente',
          user: updatedDoc.data(),
        };
      } else {
        // Usuario nuevo - crear con estructura unificada
        const userData = {
          uid: firebaseUser.uid,
          // Campos principales (para compatibilidad con user-crud)
          nombre: userName,
          correo: userEmail,
          telefono: '',
          // Campos sociales
          displayName: userName,
          email: userEmail,
          photoURL: firebaseUser.photoURL || null,
          emailVerified: firebaseUser.emailVerified,
          provider: 'github',
          providerId: 'github.com',
          loginMethod: 'github-popup',
          // Fechas
          fechaCreacion: new Date(),
          createdAt: new Date(),
          registeredAt: new Date(),
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        };

        await setDoc(userDocRef, userData);

        this.userLoggedIn.next(true);
        this.currentUser.next(firebaseUser);

        return {
          success: true,
          message: 'Usuario registrado con GitHub exitosamente',
          user: userData,
        };
      }
    } catch (error: any) {
      console.error('Error en autenticación con GitHub:', error);
      return {
        success: false,
        message: this.getGithubErrorMessage(error.code),
      };
    }
  }

  // Manejar errores específicos de GitHub
  private getGithubErrorMessage(errorCode: string): string {
    const errorMessages: { [key: string]: string } = {
      'auth/popup-closed-by-user':
        'Ventana de autenticación cerrada por el usuario',
      'auth/popup-blocked': 'Ventana emergente bloqueada por el navegador',
      'auth/cancelled-popup-request':
        'Solicitud de ventana emergente cancelada',
      'auth/account-exists-with-different-credential':
        'Ya existe una cuenta con este correo usando otro proveedor',
      'auth/auth-domain-config-required':
        'Configuración de dominio de autenticación requerida',
      'auth/operation-not-allowed': 'Autenticación con GitHub no habilitada',
      'auth/unauthorized-domain': 'Dominio no autorizado para esta operación',
      'auth/network-request-failed': 'Error de conexión de red',
    };

    return (
      errorMessages[errorCode] ||
      'Error al autenticar con GitHub. Intenta nuevamente'
    );
  }
}
