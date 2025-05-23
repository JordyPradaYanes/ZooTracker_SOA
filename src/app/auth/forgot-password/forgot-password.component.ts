import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  imports: [FormsModule, ReactiveFormsModule, CommonModule, RouterLink],
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm: FormGroup;
  isLoading = false;
  emailSent = false;
  errorMessage = '';
  submittedEmail = '';
  resendLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // Inicializar el formulario reactivo
    this.forgotPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    // Cualquier lógica de inicialización adicional
  }

  // Getter para acceder fácilmente al control del email
  get email() {
    return this.forgotPasswordForm.get('email');
  }

  // Método para enviar el correo de recuperación
  async forgotPassword(): Promise<void> {
    // Validar el formulario
    if (this.forgotPasswordForm.invalid) {
      this.markFormGroupTouched();
      this.setEmailError();
      return;
    }

    const emailValue = this.email?.value;
    this.isLoading = true;
    this.errorMessage = '';
    this.hideErrorMessage();

    try {
      await this.authService.resetPassword(emailValue);
      
      // Éxito: mostrar mensaje de éxito
      this.emailSent = true;
      this.submittedEmail = emailValue;
      this.showSuccessMessage();
      
    } catch (error: any) {
      console.error('Error al enviar correo de restablecimiento:', error);
      
      // Manejar diferentes tipos de errores de Firebase
      this.handleFirebaseError(error);
      this.showErrorMessage();
      
    } finally {
      this.isLoading = false;
    }
  }

  // Método para reenviar el correo
  async resendEmail(): Promise<void> {
    if (!this.submittedEmail) return;

    this.resendLoading = true;
    
    try {
      await this.authService.resetPassword(this.submittedEmail);
      // Opcional: mostrar notificación de reenvío exitoso
      console.log('Correo reenviado exitosamente');
      
    } catch (error: any) {
      console.error('Error al reenviar correo:', error);
      this.handleFirebaseError(error);
      this.showErrorMessage();
      
    } finally {
      this.resendLoading = false;
    }
  }

  // Marcar todos los campos del formulario como tocados para mostrar errores
  private markFormGroupTouched(): void {
    Object.keys(this.forgotPasswordForm.controls).forEach(key => {
      const control = this.forgotPasswordForm.get(key);
      control?.markAsTouched();
    });
  }

  // Configurar errores específicos del campo email
  private setEmailError(): void {
    const emailControl = this.email;
    if (emailControl?.errors) {
      if (emailControl.errors['required']) {
        this.showFieldError('emailError', 'El correo electrónico es requerido');
      } else if (emailControl.errors['email']) {
        this.showFieldError('emailError', 'Por favor, ingrese un correo electrónico válido');
      }
    }
  }

  // Manejar errores específicos de Firebase
  private handleFirebaseError(error: any): void {
    const errorCode = error.code;
    
    switch (errorCode) {
      case 'auth/user-not-found':
        this.errorMessage = 'No existe una cuenta asociada a este correo electrónico';
        break;
      case 'auth/invalid-email':
        this.errorMessage = 'El formato del correo electrónico no es válido';
        break;
      case 'auth/too-many-requests':
        this.errorMessage = 'Demasiados intentos. Por favor, espere un momento antes de intentar nuevamente';
        break;
      case 'auth/network-request-failed':
        this.errorMessage = 'Error de conexión. Verifique su conexión a internet';
        break;
      default:
        this.errorMessage = 'Error al enviar correo de restablecimiento. Por favor, inténtelo nuevamente';
        break;
    }
  }

  // Métodos para manipular la interfaz de usuario
  private showErrorMessage(): void {
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    if (errorDiv && errorText) {
      errorText.textContent = this.errorMessage;
      errorDiv.classList.remove('hidden');
    }
  }

  private hideErrorMessage(): void {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
      errorDiv.classList.add('hidden');
    }
    // También limpiar errores de campos específicos
    this.hideFieldError('emailError');
  }

  private showFieldError(fieldId: string, message: string): void {
    const errorDiv = document.getElementById(fieldId);
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.classList.remove('hidden');
    }
  }

  private hideFieldError(fieldId: string): void {
    const errorDiv = document.getElementById(fieldId);
    if (errorDiv) {
      errorDiv.classList.add('hidden');
    }
  }

  private showSuccessMessage(): void {
    const formDiv = document.getElementById('forgotPasswordForm');
    const successDiv = document.getElementById('successMessage');
    const submittedEmailSpan = document.getElementById('submittedEmail');
    
    if (formDiv && successDiv && submittedEmailSpan) {
      formDiv.classList.add('hidden');
      successDiv.classList.remove('hidden');
      submittedEmailSpan.textContent = this.submittedEmail;
    }
  }

  // Método para navegar al login
  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  // Método para limpiar el formulario y volver al estado inicial
  resetForm(): void {
    this.forgotPasswordForm.reset();
    this.emailSent = false;
    this.errorMessage = '';
    this.submittedEmail = '';
    this.hideErrorMessage();
    
    // Mostrar formulario y ocultar mensaje de éxito
    const formDiv = document.getElementById('forgotPasswordForm');
    const successDiv = document.getElementById('successMessage');
    
    if (formDiv && successDiv) {
      formDiv.classList.remove('hidden');
      successDiv.classList.add('hidden');
    }
  }

  // Getters para el template (para mostrar estados de carga)
  get isSubmitLoading(): boolean {
    return this.isLoading;
  }

  get isResendLoading(): boolean {
    return this.resendLoading;
  }

  get hasEmailError(): boolean {
    return this.email?.invalid && this.email?.touched || false;
  }

  get emailErrorMessage(): string {
    if (this.email?.errors) {
      if (this.email.errors['required']) {
        return 'El correo electrónico es requerido';
      } else if (this.email.errors['email']) {
        return 'Por favor, ingrese un correo electrónico válido';
      }
    }
    return '';
  }
}