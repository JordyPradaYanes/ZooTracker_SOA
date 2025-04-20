import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login-google',
  imports: [FormsModule, CommonModule],
  templateUrl: './login-google.component.html',
  styleUrl: './login-google.component.css'
})
export class LoginGoogleComponent {
  
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

  loginWithGoogle(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.authService.loginWithGoogle()
      .then(() => {
        console.log('Inicio de sesión con Google exitoso');
        this.router.navigate(['/registros']);
      })
      .catch(error => {
        console.error('Error al iniciar sesión con Google:', error);
        this.errorMessage = 'Error al iniciar sesión con Google. Por favor, inténtelo de nuevo.';
      })
      .finally(() => {
        this.isLoading = false;
      });
  }
}
