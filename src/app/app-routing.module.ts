import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'signup',
    loadComponent: () => import('./signup/signup.page').then(m => m.SignupPage)
  },
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'historico',
    loadComponent: () => import('./historico/historico.page').then(m => m.HistoricoPage)
  },
  {
    path: 'tab4',
    loadComponent: () => import('./tab4/tab4.page').then(m => m.Tab4Page)
  },
  {
    path: 'tabs/tab5',
    loadComponent: () => import('./tab5/tab5.page').then(m => m.Tab5Page)
  },
  {
  path: 'estatisticas',
  loadChildren: () => import('./estatisticas/estatisticas.module').then(m => m.EstatisticasPageModule)
},
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'estatisticas',
    loadChildren: () => import('./estatisticas/estatisticas.module').then( m => m.EstatisticasPageModule)
  }

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
