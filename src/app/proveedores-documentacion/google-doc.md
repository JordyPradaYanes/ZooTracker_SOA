# Integración de Autenticación de Google usando Firebase

Este documento explica cómo se integró el servicio de autenticación de Google usando Firebase.

## Requisitos Previos

1. Tener una cuenta en Firebase (https://firebase.google.com/).
2. Tener Node.js y Angular CLI instalados en tu computador.

## Paso 1: Crear un Proyecto en Firebase

1. Dirígete a https://console.firebase.google.com/.
2. Crea un nuevo proyecto.
3. En el panel izquierdo, damos clic en **Authentication** > **Sign-in method**.
4. Habilita el método de inicio de sesión de **Google**.

## Paso 2: Configuración de Firebase en el Proyecto Angular

1. Instalamos el SDK de Firebase y AngularFire:

   ```bash
   npm install firebase @angular/fire
2. En el archivo `app.config.ts` en la carpeta `src/app` agregamos la configuración de Firebase:

   ```typescript
   // src/app/app.config.ts
   export const firebaseConfig = {
     apiKey: "TU_API_KEY",
     authDomain: "TU_AUTH_DOMAIN",
     projectId: "TU_PROJECT_ID",
     storageBucket: "TU_STORAGE_BUCKET",
     messagingSenderId: "TU_MESSAGING_SENDER_ID",
     appId: "TU_APP_ID",
     measurementId: "TU_MEASUREMENT_ID"
   };
   ```

   Estos valores se encuentran en la consola de Firebase en la sección **Configuración del Proyecto**.

## Paso 2: Crear el Servicio de Autenticación

1. Crea un servicio de autenticación en Angular:

   ```bash
   ng generate service auth
   ```

2. En el archivo `auth.service.ts`, agrega el siguiente código para manejar la autenticación de Google:

   ```typescript
   import { Injectable } from '@angular/core';
   import { AngularFireAuth } from '@angular/fire/auth';
   import firebase from 'firebase/app';
   import 'firebase/auth';
   import { Observable } from 'rxjs';

   @Injectable({
     providedIn: 'root'
   })
   export class AuthService {

     constructor(private afAuth: AngularFireAuth) {}

     // Iniciar sesión con Google
     signInWithGoogle(): Promise<firebase.auth.UserCredential> {
       const provider = new firebase.auth.GoogleAuthProvider();
       return this.afAuth.signInWithPopup(provider);
     }

     // Cerrar sesión
     signOut(): Promise<void> {
       return this.afAuth.signOut();
     }

     // Obtener el usuario actual
     getCurrentUser(): Observable<firebase.User | null> {
       return this.afAuth.authState;
     }
   }
   ```

## Paso 3: Crear Componentes de Autenticación

1. Crea un componente para mostrar la opción de inicio de sesión y cerrar sesión:

   ```bash
   ng generate component login
   ```

2. En el archivo `login.component.ts`, agrega el siguiente código:

   ```typescript
   import { Component, OnInit } from '@angular/core';
   import { AuthService } from '../auth.service';
   import { Router } from '@angular/router';
   import firebase from 'firebase/app';

   @Component({
     selector: 'app-auth',
     templateUrl: './auth.component.html',
     styleUrls: ['./auth.component.css']
   })
   export class AuthComponent implements OnInit {

     user: firebase.User | null = null;

     constructor(private authService: AuthService, private router: Router) {}

     ngOnInit(): void {
       this.authService.getCurrentUser().subscribe(user => {
         this.user = user;
       });
     }

     signInWithGoogle(): void {
       this.authService.signInWithGoogle().then(() => {
         this.router.navigate(['/dashboard']);
       });
     }

     signOut(): void {
       this.authService.signOut().then(() => {
         this.router.navigate(['/']);
       });
     }
   }
   ```

3. En el archivo `auth.component.html`, agrega los botones para iniciar sesión y cerrar sesión:

   ```html
   <div *ngIf="!user">
     <button (click)="signInWithGoogle()">Iniciar sesión con Google</button>
   </div>

   <div *ngIf="user">
     <p>Bienvenido, {{ user.displayName }}</p>
     <button (click)="signOut()">Cerrar sesión</button>
   </div>
   ```

## Paso 4: Agregar Rutas

1. En el archivo `app.routes.ts`, agrega las rutas para el componente de autenticación:

   ```typescript
   import { Routes } from '@angular/router';
   import {LoginComponent} from './auth/login/login.component';

   export const routes: Routes = [
     { path: 'login', component: LoginComponent},
   ];
   ```