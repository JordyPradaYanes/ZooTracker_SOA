import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoginGoogleComponent } from '../login-google/login-google.component';
import { LoginFacebookComponent } from '../login-facebook/login-facebook.component';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service'; // Importar UserService
import { CreateUserData } from '../../interface/user.interface'; // Importar interface

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css']
})
export class RegistroComponent implements OnInit {
  name: string = '';
  email: string = '';
  telefono: string = ''; // Cambiado para ser consistente con la interface
  password: string = '';
  confirmPassword: string = '';
  showPassword: boolean = false;
  errorMessage: string = '';
  isLoading: boolean = false;
  acceptTerms: boolean = false;

  constructor(
    private authService: AuthService,
    private userService: UserService, // Inyectar UserService
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
      this.errorMessage = 'Por favor, complete todos los campos obligatorios';
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

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.errorMessage = 'El formato del correo electrónico es inválido';
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    
    this.registerUser();
  }

  // Método para registrar usuario usando UserService
  private async registerUser(): Promise<void> {
    try {
      // Preparar datos del usuario
      const userData: CreateUserData = {
        nombre: this.name.trim(),
        correo: this.email.trim().toLowerCase(),
        telefono: this.telefono.trim() || '', // Campo opcional
        contraseña: this.password
      };

      console.log('Registrando usuario con datos:', { ...userData, contraseña: '[OCULTA]' });

      // Crear usuario usando UserService (esto crea tanto en Auth como en Firestore)
      const result = await this.userService.createUser(userData);

      if (result.success) {
        console.log('Usuario registrado exitosamente:', result.user);
        
        // Opcional: Enviar verificación por correo
        try {
          await this.authService.sendEmailVerification();
          console.log('Correo de verificación enviado');
        } catch (verificationError) {
          console.warn('No se pudo enviar correo de verificación:', verificationError);
          // No interrumpir el flujo por este error
        }

        // Navegar a la página de registros
        this.router.navigate(['/registros']);
      } else {
        this.errorMessage = result.message;
        console.error('Error en registro:', result.message);
      }

    } catch (error: any) {
      console.error('Error inesperado en registro:', error);
      this.errorMessage = 'Error inesperado al registrar usuario. Por favor, intente nuevamente.';
    } finally {
      this.isLoading = false;
    }
  }

  // Método alternativo usando solo AuthService (mantener como respaldo)
  private async registerWithAuthServiceOnly(): Promise<void> {
    try {
      const result = await this.authService.register(this.email, this.password, this.name);
      console.log('Registro exitoso con AuthService:', result);
      
      // Opcional: Crear perfil en Firestore después del registro
      if (result.user) {
        try {
          const profileResult = await this.userService.createUserProfile(result.user.uid, {
            nombre: this.name.trim(),
            correo: this.email.trim().toLowerCase(),
            telefono: this.telefono.trim() || ''
          });
          
          if (profileResult.success) {
            console.log('Perfil creado en Firestore:', profileResult.user);
          } else {
            console.warn('Error al crear perfil en Firestore:', profileResult.message);
          }
        } catch (profileError) {
          console.error('Error al crear perfil en Firestore:', profileError);
        }
      }

      this.router.navigate(['/registros']);
      
    } catch (error: any) {
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
    }
  }

  clearForm(): void {
    this.name = '';
    this.email = '';
    this.telefono = '';
    this.password = '';
    this.confirmPassword = '';
    this.showPassword = false;
    this.errorMessage = '';
    this.isLoading = false;
    this.acceptTerms = false;
  }

  // Método de utilidad para validar teléfono (opcional)
  private isValidPhone(phone: string): boolean {
    if (!phone.trim()) return true; // Teléfono es opcional
    
    // Validar formato de teléfono (ejemplo para Colombia)
    const phoneRegex = /^[3][0-9]{9}$/; // 10 dígitos comenzando con 3
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  }

  // Método para formatear teléfono mientras se escribe (opcional)
  onPhoneInput(event: any): void {
    let value = event.target.value.replace(/\D/g, ''); // Solo números
    
    // Limitar a 10 dígitos
    if (value.length > 10) {
      value = value.substring(0, 10);
    }
    
    this.telefono = value;
    event.target.value = value;
  }
}