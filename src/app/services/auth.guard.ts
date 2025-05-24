import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from './auth.service'; // O la ruta a tu AuthService

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    return this.authService.user$.pipe(
      take(1), // Solo toma el primer valor y luego completa
      map(user => {
        if (user) {
          return true; // Usuario autenticado, permite el acceso
        } else {
          // Usuario no autenticado, redirige a la página de login
          console.log('Acceso denegado. Redirigiendo a login...');
          return this.router.createUrlTree(['/login']);
        }
      })
    );
  }
}