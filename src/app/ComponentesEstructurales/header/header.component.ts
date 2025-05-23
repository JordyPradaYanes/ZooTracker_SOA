import { Component, inject } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  private auth = inject(Auth);
  isLoggedIn$: Observable<boolean>;

  constructor() {
    this.isLoggedIn$ = authState(this.auth).pipe(
      map(user => !!user)
    );
  }

  logout() {
    this.auth.signOut()
      .then(() => {
        // Redirigir al login después de cerrar sesión
        window.location.href = '/login';
      })
      .catch(error => {
        console.error('Error al cerrar sesión:', error);
      });
  }
}