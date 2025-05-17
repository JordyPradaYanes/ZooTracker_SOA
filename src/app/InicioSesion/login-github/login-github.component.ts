import { Component, Output, EventEmitter } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { AuthError } from '@angular/fire/auth';

@Component({
  selector: 'app-login-github',
  templateUrl: './login-github.component.html',
  styleUrls: ['./login-github.component.css']
})
export class LoginGithubComponent {
  @Output() loginSuccess = new EventEmitter<void>();
  @Output() loginError = new EventEmitter<string>();
  @Output() accountLinkingNeeded = new EventEmitter<{email: string, methods: string[]}>();
  
  isLoading = false;

  constructor(private authService: AuthService) {}

  async loginWithGitHub(): Promise<void> {
    this.isLoading = true;
    
    try {
      const result = await this.authService.loginWithGitHub();
      this.loginSuccess.emit();
    } catch (error: any) {
      console.error('Error en login con GitHub:', error);
      
      // Manejo específico para el caso de cuentas vinculadas
      if (error.code === 'auth/account-exists-with-different-credential') {
        // El servicio ya maneja la lógica de vinculación internamente
        // Podemos proporcionar información adicional o UI feedback si es necesario
        const email = error.customData?.email as string;
        if (email) {
          try {
            const methods = await this.authService.getSignInMethodsForEmail(email);
            // Emitir evento para que el componente padre pueda mostrar UI apropiada
            this.accountLinkingNeeded.emit({ email, methods });
            return; // Evitamos emitir error general, ya que estamos manejando este caso específico
          } catch (methodError) {
            console.error('Error al obtener métodos de inicio de sesión:', methodError);
          }
        }
      }
      
      const errorMessage = this.getGitHubErrorMessage(error);
      this.loginError.emit(errorMessage);
    } finally {
      this.isLoading = false;
    }
  }

  private getGitHubErrorMessage(error: any): string {
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
        return 'La autenticación con GitHub no está habilitada.';
      case 'auth/requires-recent-login':
        return 'Por favor, vuelve a iniciar sesión para completar esta operación sensible.';
      default:
        return `Error al iniciar sesión con GitHub: ${error.message || 'Desconocido'}`;
    }
  }
}