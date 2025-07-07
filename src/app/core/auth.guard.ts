import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable, of } from 'rxjs';
import { map, catchError, take, timeout } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private afAuth: AngularFireAuth,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    console.log('AUTH GUARD - 🔐 Verificando autenticação...');
    
    return this.afAuth.authState.pipe(
      take(1),
      timeout(5000), // Timeout de 5 segundos para evitar travamentos
      map(user => {
        if (user) {
          console.log('AUTH GUARD - ✅ Usuário autenticado:', user.uid);
          return true;
        } else {
          console.log('AUTH GUARD - ❌ Usuário não autenticado, redirecionando para login');
          this.router.navigate(['/login']);
          return false;
        }
      }),
      catchError(error => {
        console.error('AUTH GUARD - ❌ Erro ao verificar autenticação:', error);
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}
