import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoginGoogleComponent } from '../login-google/login-google.component';
import { LoginFacebookComponent } from '../login-facebook/login-facebook.component';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [RouterLink, FormsModule, LoginGoogleComponent, CommonModule, LoginFacebookComponent],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css']
})
export class RegistroComponent implements OnInit {
  name: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  showPassword: boolean = false;
  errorMessage: string = '';
  isLoading: boolean = false;
  acceptTerms: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Verificar si el usuario ya está autenticado
    // this.authService.isLoggedIn.subscribe(isLoggedIn => {
    //   if (isLoggedIn) {
    //     this.router.navigate(['/registros']);
    //   }
    // });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    // Validaciones básicas del formulario
    if (!this.name || !this.email || !this.password || !this.confirmPassword) {
      this.errorMessage = 'Por favor, complete todos los campos';
      return;
    }

    if (!this.acceptTerms) {
      this.errorMessage = 'Debe aceptar los términos y condiciones';
      return;
    }
    
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    
    this.authService.register(this.email, this.password)
      .then((result) => {
        console.log('Registro exitoso:', result);
        
        // Actualizar el nombre del usuario en Firebase
        // return this.authService.updateUserProfile(this.name);
      })
      .then(() => {
        console.log('Perfil actualizado correctamente');
        this.router.navigate(['/registros']);
      })
      .catch(error => {
        console.error('Error en registro:', error);
        
        // Manejar diferentes códigos de error de Firebase
        switch (error.code) {
          case 'auth/email-already-in-use':
            this.errorMessage = 'Este correo electrónico ya está en uso';
            break;
          case 'auth/invalid-email':
            this.errorMessage = 'Correo electrónico inválido';
            break;
          case 'auth/operation-not-allowed':
            this.errorMessage = 'Operación no permitida';
            break;
          case 'auth/weak-password':
            this.errorMessage = 'La contraseña es demasiado débil';
            break;
          default:
            this.errorMessage = `Error al registrarse: ${error.message}`;
        }
      })
      .finally(() => {
        this.isLoading = false;
      });
  }
}