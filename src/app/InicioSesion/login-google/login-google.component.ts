import { Component, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { AuthError } from '@angular/fire/auth';

@Component({
  selector: 'app-login-google',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login-google.component.html',
  styleUrl: './login-google.component.css'
})
export class LoginGoogleComponent {
  @Output() loginSuccess = new EventEmitter<void>();
  @Output() loginError = new EventEmitter<string>();
  @Output() accountLinkingNeeded = new EventEmitter<{email: string, methods: string[]}>();
  
  email: string = '';
  password: string = '';
  rememberMe: boolean = false;
  showPassword: boolean = false;
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async loginWithGoogle(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';
    
    try {
      await this.authService.loginWithGoogle();
      console.log('Inicio de sesión con Google exitoso');
      this.loginSuccess.emit();
      this.router.navigate(['/registros']);
    } catch (error: any) {
      console.error('Error al iniciar sesión con Google:', error);
      
      // Manejo específico para el caso de cuentas vinculadas
      if (error.code === 'auth/account-exists-with-different-credential') {
        const email = error.customData?.email as string;
        if (email) {
          try {
            const methods = await this.authService.getSignInMethodsForEmail(email);
            // Emitir evento para que el componente padre pueda mostrar UI apropiada
            this.accountLinkingNeeded.emit({ email, methods });
          } catch (methodError) {
            console.error('Error al obtener métodos de inicio de sesión:', methodError);
            this.errorMessage = 'Error al verificar métodos de inicio de sesión disponibles.';
            this.loginError.emit(this.errorMessage);
          }
        } else {
          this.errorMessage = 'Ya existe una cuenta con el mismo email pero con otro proveedor.';
          this.loginError.emit(this.errorMessage);
        }
      } else {
        this.errorMessage = this.getGoogleErrorMessage(error);
        this.loginError.emit(this.errorMessage);
      }
    } finally {
      this.isLoading = false;
    }
  }

  private getGoogleErrorMessage(error: any): string {
    switch (error.code) {
      case 'auth/account-exists-with-different-credential':
        return 'Ya existe una cuenta con el mismo email pero con otro proveedor. Se intentará vincular automáticamente.';
      case 'auth/popup-closed-by-user':
        return 'La ventana de autenticación fue cerrada antes de completar el proceso.';
      case 'auth/cancelled-popup-request':
        return 'Solo se puede abrir una ventana de autenticación a la vez.';
      case 'auth/popup-blocked':
        return 'Por favor, permite ventanas emergentes para este sitio.';
      case 'auth/operation-not-allowed':
        return 'La autenticación con Google no está habilitada.';
      case 'auth/requires-recent-login':
        return 'Por favor, vuelve a iniciar sesión para completar esta operación sensible.';
      case 'auth/user-disabled':
        return 'Esta cuenta de usuario ha sido deshabilitada.';
      case 'auth/network-request-failed':
        return 'Error de red. Por favor, verifica tu conexión a internet.';
      default:
        return `Error al iniciar sesión con Google: ${error.message || 'Desconocido'}`;
    }
  }
}