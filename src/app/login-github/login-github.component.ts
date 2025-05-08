import { Component, Output, EventEmitter } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login-github',
  templateUrl: './login-github.component.html',
  styleUrls: ['./login-github.component.css']
})
export class LoginGithubComponent {
  @Output() loginSuccess = new EventEmitter<void>();
  @Output() loginError = new EventEmitter<string>();
  
  isLoading = false;

  constructor(private authService: AuthService) {}

  async loginWithGitHub(): Promise<void> {
    this.isLoading = true;
    
    try {
      await this.authService.loginWithGitHub();
      this.loginSuccess.emit();
    } catch (error: any) {
      console.error('Error en login con GitHub:', error);
      const errorMessage = this.getGitHubErrorMessage(error);
      this.loginError.emit(errorMessage);
    } finally {
      this.isLoading = false;
    }
  }

  private getGitHubErrorMessage(error: any): string {
    switch (error.code) {
      case 'auth/account-exists-with-different-credential':
        return 'Ya existe una cuenta con el mismo email pero con otro proveedor.';
      case 'auth/popup-closed-by-user':
        return 'La ventana de autenticación fue cerrada antes de completar el proceso.';
      case 'auth/cancelled-popup-request':
        return 'Solo se puede abrir una ventana de autenticación a la vez.';
      case 'auth/popup-blocked':
        return 'Por favor, permite ventanas emergentes para este sitio.';
      case 'auth/operation-not-allowed':
        return 'La autenticación con GitHub no está habilitada.';
      default:
        return `Error al iniciar sesión con GitHub: ${error.message}`;
    }
  }
}