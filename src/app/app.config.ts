import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCglkt6WFXikM3mO26rJZr3yafMOg0BfdE",
  authDomain: "zootrackersoa.firebaseapp.com",
  projectId: "zootrackersoa",
  storageBucket: "zootrackersoa.appspot.com", // Corregido: storageBucket debe ser un dominio válido
  messagingSenderId: "1011266243590",
  appId: "1:1011266243590:web:3cdec54ee9f5003dd94787",
  measurementId: "G-TD57BST2QY"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth())
  ]
};