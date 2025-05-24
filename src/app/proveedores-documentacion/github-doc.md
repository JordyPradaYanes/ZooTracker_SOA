#  Sistema de Autenticación con GitHub

##  Descripción General

Este proyecto implementa un sistema de autenticación usando GitHub como proveedor OAuth, integrado en una aplicación Angular mediante Firebase Authentication. Permite a los usuarios iniciar sesión con su cuenta de GitHub y gestiona casos especiales como cuentas ya registradas con otros proveedores. Además, se incluye la configuración para realizar pruebas unitarias a los componentes de login.


---

## 🏗 Arquitectura del Sistema


Angular Frontend (Componentes + Servicios)
          │
          │ Firebase Auth (SDK cliente)
          │
     GitHub OAuth Provider

# Implementación del Frontend

src/
├── app/
│   ├── services/
│   │   └── auth-service.service.ts        # Servicio de autenticación con Firebase + GitHub
│   └── components/
│       └── login-github/
│           ├── login-github.component.ts
│           ├── login-github.component.html
│           └── login-github.component.spec.ts   # Pruebas unitarias

## Servicio de Autenticación 


import { Injectable } from '@angular/core';
import { getAuth, GithubAuthProvider, signInWithPopup, fetchSignInMethodsForEmail, linkWithCredential } from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private auth = getAuth();

  async loginWithGitHub() {
    const provider = new GithubAuthProvider();
    provider.addScope('user:email');

    try {
      const result = await signInWithPopup(this.auth, provider);
      return result.user;
    } catch (error: any) {
      if (error.code === 'auth/account-exists-with-different-credential') {
        const pendingCred = GithubAuthProvider.credentialFromError(error);
        const email = error.customData?.email;
        if (email) {
          const methods = await fetchSignInMethodsForEmail(this.auth, email);
          if (methods.includes('google.com')) {
            // Aquí se debería implementar el login con Google para vincular credenciales
            throw new Error('El email ya está registrado con Google. Por favor, inicia sesión con Google primero.');
          } else {
            throw new Error(`El email ${email} ya está registrado con otro proveedor: ${methods.join(', ')}`);
          }
        }
      }
      throw error;
    }
  }
}


