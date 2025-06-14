# Integración de Autenticación con Facebook en Angular + Firebase

Este README documenta cómo implementé la autenticación de Facebook en mi aplicación Angular usando Firebase Authentication.

## Prerrequisitos

- Angular 19+ instalado
- Proyecto Firebase configurado
- Cuenta de Facebook Developers

## 1. Configuración en Facebook Developers

### 1.1 Crear App en Facebook Developers

1. Ve a [Facebook Developers](https://developers.facebook.com/)
2. Crea una nueva aplicación
3. Selecciona el tipo de aplicación apropiado
4. Añade el producto **Facebook Login**

### 1.2 Configurar Facebook Login

1. En tu app de Facebook, ve a **Facebook Login** > **Settings**
2. Añade las siguientes URLs en **Valid OAuth Redirect URIs**:
   - Para desarrollo: `http://localhost:4200/__/auth/handler`
   - Para producción: `https://tu-dominio.com/__/auth/handler`
   - URL de Firebase: `https://tu-proyecto.firebaseapp.com/__/auth/handler`

### 1.3 Obtener App ID y App Secret

1. Ve a **Settings** > **Basic**
2. Copia el **App ID** y **App Secret**

## 2. Configuración en Firebase Console

### 2.1 Habilitar Autenticación con Facebook

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Authentication** > **Sign-in method**
4. Busca **Facebook** y haz clic para habilitarlo
5. Pega tu **App ID** y **App Secret** de Facebook
6. Copia la **OAuth redirect URI** que Firebase te proporciona
7. Regresa a Facebook Developers y añade esta URI a las URLs válidas
8. Guarda los cambios en ambas plataformas

## 3. Instalación de Dependencias

```bash
npm install @angular/fire firebase
```

## 4. Servicio de Autenticación

En mi `auth.service.ts`, implementé el método para Facebook:

```typescript
import { Injectable } from '@angular/core';
import { 
  Auth, 
  FacebookAuthProvider,
  signInWithPopup,
  UserCredential,
  onAuthStateChanged,
  User as FirebaseUser,
} from '@angular/fire/auth';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userLoggedIn = new BehaviorSubject<boolean>(false);
  private currentUser = new BehaviorSubject<FirebaseUser | null>(null);
  
  constructor(private auth: Auth) {
    onAuthStateChanged(this.auth, user => {
      this.userLoggedIn.next(!!user);
      this.currentUser.next(user);
    });
  }

  // Iniciar sesión con Facebook
  async loginWithFacebook(): Promise<UserCredential> {
    try {
      const provider = new FacebookAuthProvider();
      // Opcional: añadir scopes adicionales
      provider.addScope('email');
      
      const result = await signInWithPopup(this.auth, provider);
      this.userLoggedIn.next(true);
      this.currentUser.next(result.user);
      return result;
    } catch (error) {
      console.error('Error en loginWithFacebook:', error);
      throw error;
    }
  }

  get isLoggedIn(): Observable<boolean> {
    return this.userLoggedIn.asObservable();
  }
}
```

## 5. Componente de Login con Facebook

### 5.1 Crear el componente

```bash
ng generate component components/login-facebook
```

### 5.2 login-facebook.component.ts

```typescript
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
  isLoading: boolean = false;
  errorMessage: string = '';

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
```

### 5.3 login-facebook.component.html

```html
<button
  type="button"
  (click)="loginWithFacebook()"
  [disabled]="isLoading"
  class="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform transition duration-300 hover:-translate-y-1 text-base flex items-center justify-center"
>
  <span *ngIf="!isLoading" class="flex items-center justify-center">
    <!-- Logo de Facebook -->
    <svg class="h-5 w-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
    Continuar con Facebook
  </span>
  <span *ngIf="isLoading" class="flex items-center justify-center">
    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    Conectando...
  </span>
</button>

<!-- Mensaje de error -->
<div *ngIf="errorMessage" class="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
  {{ errorMessage }}
</div>
```

## 6. Integración en el Componente Principal de Login

En mi `login.component.ts`, importé el componente:

```typescript
import { LoginFacebookComponent } from '../login-facebook/login-facebook.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    RouterLink, 
    FormsModule, 
    LoginGoogleComponent,
    CommonModule, 
    LoginFacebookComponent, // Importar aquí
    LoginGithubComponent
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  // ... resto del código
}
```

Y en `login.component.html`, lo agregué donde quería que aparezca:

```html
<div class="space-y-4">
  <app-login-google></app-login-google>
  <app-login-facebook></app-login-facebook>
  <app-login-github></app-login-github>
</div>
```

## 7. Configuración de Dominios Autorizados

### 7.1 En Firebase Console

1. Ve a **Authentication** > **Settings** > **Authorized domains**
2. Añade tu dominio de desarrollo y producción:
   - `localhost`
   - `tu-dominio.com`

### 7.2 En Facebook Developers

1. Ve a **Settings** > **Basic**
2. En **App Domains**, añade tu dominio sin protocolo: `tu-dominio.com`
3. En **Website**, añade la URL completa: `https://tu-dominio.com`

## 8. Errores Comunes y Soluciones

### Error: "Given URL is not allowed by the Application configuration"

**Solución**: Verifica que las URLs de redirection estén correctamente configuradas en Facebook Developers.

### Error: "Popup blocked"

**Solución**: El código ya maneja este error mostrando un mensaje al usuario para permitir popups.

### Error: "auth/account-exists-with-different-credential"

**Solución**: El usuario ya tiene una cuenta con el mismo email pero usando otro proveedor (Google, email/password, etc.).

## 9. Notas Importantes

- Los popups pueden ser bloqueados por navegadores, siempre maneja este caso
- Facebook requiere que tu aplicación esté en HTTPS en producción
- Considera implementar manejo de enlaces de cuenta para usuarios que usen múltiples proveedores
- Los scopes de Facebook son limitados; `email` es lo más común que necesitarás

## 10. Testing

Para probar la integración:

1. Ejecuta `ng serve`
2. Ve a `http://localhost:4200/login`
3. Haz clic en "Continuar con Facebook"
4. Completa el flujo de OAuth
5. Verifica que seas redirigido correctamente

La autenticación debería funcionar tanto en desarrollo como en producción siguiendo estos pasos.