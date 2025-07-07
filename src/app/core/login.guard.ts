import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable, of } from 'rxjs';
import { map, catchError, take, timeout } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {
  constructor(
    private afAuth: AngularFireAuth,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    console.log('LOGIN GUARD - 🔐 Verificando se usuário já está autenticado...');
    
    return this.afAuth.authState.pipe(
      take(1),
      timeout(3000), // Timeout mais rápido para página de login
      map(user => {
        if (user) {
          console.log('LOGIN GUARD - ✅ Usuário já autenticado, redirecionando para /tabs/tab1');
          this.router.navigate(['/tabs/tab1']);
          return false; // Impede acesso à página de login
        } else {
          console.log('LOGIN GUARD - ❌ Usuário não autenticado, permitindo acesso ao login');
          return true; // Permite acesso à página de login
        }
      }),
      catchError(error => {
        console.error('LOGIN GUARD - ❌ Erro ao verificar autenticação:', error);
        return of(true); // Em caso de erro, permite acesso ao login
      })
    );
  }
}
