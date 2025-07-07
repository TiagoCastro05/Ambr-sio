import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/auth.guard';
import { LoginGuard } from './core/login.guard';

const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage),
    canActivate: [LoginGuard]
  },
  {
    path: 'signup',
    loadComponent: () => import('./signup/signup.page').then(m => m.SignupPage),
    canActivate: [LoginGuard]
  },
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'historico',
    loadComponent: () => import('./historico/historico.page').then(m => m.HistoricoPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'tab4',
    loadComponent: () => import('./tab4/tab4.page').then(m => m.Tab4Page),
    canActivate: [AuthGuard]
  },
  {
    path: 'tabs/tab5',
    loadComponent: () => import('./tab5/tab5.page').then(m => m.Tab5Page),
    canActivate: [AuthGuard]
  },
  {
    path: 'estatisticas',
    loadChildren: () => import('./estatisticas/estatisticas.module').then(m => m.EstatisticasPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
