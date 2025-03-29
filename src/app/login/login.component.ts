import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterOutlet, RouterLink, FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
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

  ngOnInit(): void {
    // Verificar si el usuario ya está autenticado
    this.authService.isLoggedIn.subscribe(isLoggedIn => {
      // if (isLoggedIn) {
      //   this.router.navigate(['/registros']);
      // }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor, complete todos los campos';
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    
    this.authService.loginWithEmailAndPassword(this.email, this.password)
      .then(() => {
        console.log('Inicio de sesión exitoso');
        
        // Guardar en localStorage si rememberMe está activado
        if (this.rememberMe) {
          localStorage.setItem('rememberedEmail', this.email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        
        this.router.navigate(['/registros']);
      })
      .catch(error => {
        console.error('Error al iniciar sesión:', error);
        
        // Manejar diferentes códigos de error de Firebase
        switch (error.code) {
          case 'auth/invalid-email':
            this.errorMessage = 'Correo electrónico inválido';
            break;
          case 'auth/user-disabled':
            this.errorMessage = 'Esta cuenta ha sido deshabilitada';
            break;
          case 'auth/user-not-found':
            this.errorMessage = 'No existe una cuenta con este correo electrónico';
            break;
          case 'auth/wrong-password':
            this.errorMessage = 'Contraseña incorrecta';
            break;
          default:
            this.errorMessage = 'Error al iniciar sesión. Por favor, inténtelo de nuevo.';
        }
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

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

  forgotPassword(): void {
    if (!this.email) {
      this.errorMessage = 'Por favor, ingrese su correo electrónico para restablecer la contraseña';
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    
    this.authService.resetPassword(this.email)
      .then(() => {
        alert('Se ha enviado un correo para restablecer su contraseña');
      })
      .catch(error => {
        console.error('Error al enviar correo de restablecimiento:', error);
        this.errorMessage = 'Error al enviar correo de restablecimiento. Verifique su correo.';
      })
      .finally(() => {
        this.isLoading = false;
      });
  }
}