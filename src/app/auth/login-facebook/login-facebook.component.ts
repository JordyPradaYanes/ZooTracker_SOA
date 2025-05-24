import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-facebook',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './login-facebook.component.html',
  styleUrls: ['./login-facebook.component.css']
})
export class LoginFacebookComponent implements OnInit {
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

  loginWithFacebook(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.authService.loginWithFacebook()
      .then((result) => {
        console.log('Usuario autenticado con Facebook:', result.user);
        
        // Redireccionar al usuario después del login exitoso
        setTimeout(() => {
          this.router.navigate(['/registros']);
        }, 1000);
      })
      .catch((error) => {
        console.error('Error al iniciar sesión con Facebook:', error.code, error.message);
        
        switch (error.code) {
          case 'auth/account-exists-with-different-credential':
            this.errorMessage = 'Ya existe una cuenta con este email pero con otro método de inicio de sesión.';
            break;
          case 'auth/popup-closed-by-user':
            this.errorMessage = 'La ventana de inicio de sesión fue cerrada antes de completar la autenticación.';
            break;
          case 'auth/cancelled-popup-request':
            this.errorMessage = 'La solicitud fue cancelada.';
            break;
          case 'auth/popup-blocked':
            this.errorMessage = 'La ventana emergente fue bloqueada por el navegador. Por favor, permite ventanas emergentes para este sitio.';
            break;
          default:
            this.errorMessage = `${error.message || 'Error al conectar con Facebook. Inténtalo de nuevo más tarde.'}`;
        }
        
      })
      .finally(() => {
        this.isLoading = false;
      });
  }
}