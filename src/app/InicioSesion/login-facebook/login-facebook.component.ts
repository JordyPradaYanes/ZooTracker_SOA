import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthError } from '@angular/fire/auth';

@Component({
  selector: 'app-login-facebook',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './login-facebook.component.html',
  styleUrls: ['./login-facebook.component.css']
})
export class LoginFacebookComponent implements OnInit {
  @Output() loginSuccess = new EventEmitter<void>();
  @Output() loginError = new EventEmitter<string>();
  @Output() accountLinkingNeeded = new EventEmitter<{email: string, methods: string[]}>();
  
  email: string = '';
  password: string = '';
  rememberMe: boolean = false;
  showPassword: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';
  
  // Alert modal properties
  showAlert: boolean = false;
  alertTitle: string = '';
  alertMessage: string = '';
  alertType: 'success' | 'error' | 'warning' | 'info' = 'info';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Verificar si el usuario ya está autenticado
    this.authService.isLoggedIn.subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.router.navigate(['/registros']);
      }
    });
  }

  async loginWithFacebook(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';
    this.showAlert = false;
    
    try {
      const result = await this.authService.loginWithFacebook();
      console.log('Usuario autenticado con Facebook:', result.user);
      
      this.alertType = 'success';
      this.alertTitle = '¡Inicio de sesión exitoso!';
      this.alertMessage = 'Has iniciado sesión correctamente con Facebook.';
      this.showAlert = true;
      
      this.loginSuccess.emit();
      
      // Redireccionar al usuario después del login exitoso
      setTimeout(() => {
        this.router.navigate(['/registros']);
      }, 1000);
    } catch (error: any) {
      console.error('Error al iniciar sesión con Facebook:', error.code, error.message);
      
      // Manejo específico para el caso de cuentas vinculadas
      if (error.code === 'auth/account-exists-with-different-credential') {
        const email = error.customData?.email as string;
        if (email) {
          try {
            const methods = await this.authService.getSignInMethodsForEmail(email);
            // Emitir evento para que el componente padre pueda mostrar UI apropiada
            this.accountLinkingNeeded.emit({ email, methods });
            
            this.alertType = 'warning';
            this.alertTitle = 'Cuenta existente detectada';
            this.alertMessage = `Ya existe una cuenta con el email ${email}. Métodos disponibles: ${methods.join(', ')}. Se intentará vincular automáticamente.`;
            this.showAlert = true;
            
          } catch (methodError) {
            console.error('Error al obtener métodos de inicio de sesión:', methodError);
            this.errorMessage = 'Error al verificar métodos de inicio de sesión disponibles.';
            
            this.alertType = 'error';
            this.alertTitle = 'Error';
            this.alertMessage = this.errorMessage;
            this.showAlert = true;
            
            this.loginError.emit(this.errorMessage);
          }
        } else {
          this.errorMessage = 'Ya existe una cuenta con este email pero con otro método de inicio de sesión.';
          
          this.alertType = 'warning';
          this.alertTitle = 'Cuenta existente';
          this.alertMessage = this.errorMessage;
          this.showAlert = true;
          
          this.loginError.emit(this.errorMessage);
        }
      } else {
        this.errorMessage = this.getFacebookErrorMessage(error);
        
        this.alertType = 'error';
        this.alertTitle = 'Error de autenticación';
        this.alertMessage = this.errorMessage;
        this.showAlert = true;
        
        this.loginError.emit(this.errorMessage);
      }
    } finally {
      this.isLoading = false;
    }
  }

  private getFacebookErrorMessage(error: any): string {
    switch (error.code) {
      case 'auth/account-exists-with-different-credential':
        return 'Ya existe una cuenta con este email pero con otro método de inicio de sesión. Se intentará vincular automáticamente.';
      case 'auth/popup-closed-by-user':
        return 'La ventana de inicio de sesión fue cerrada antes de completar la autenticación.';
      case 'auth/cancelled-popup-request':
        return 'La solicitud fue cancelada.';
      case 'auth/popup-blocked':
        return 'La ventana emergente fue bloqueada por el navegador. Por favor, permite ventanas emergentes para este sitio.';
      case 'auth/operation-not-allowed':
        return 'La autenticación con Facebook no está habilitada.';
      case 'auth/requires-recent-login':
        return 'Por favor, vuelve a iniciar sesión para completar esta operación sensible.';
      case 'auth/user-disabled':
        return 'Esta cuenta de usuario ha sido deshabilitada.';
      case 'auth/network-request-failed':
        return 'Error de red. Por favor, verifica tu conexión a internet.';
      default:
        return `${error.message || 'Error al conectar con Facebook. Inténtalo de nuevo más tarde.'}`;
    }
  }
}