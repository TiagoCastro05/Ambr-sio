import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'tab1',
        loadChildren: () => import('../tab1/tab1.module').then(m => m.Tab1PageModule)
      },

      {
        path: 'tab4',
        loadComponent: () => import('../tab4/tab4.page').then(m => m.Tab4Page)
      },
      {
        path: 'tab5',
        loadComponent: () => import('../tab5/tab5.page').then(m => m.Tab5Page)
      },
      {
        path: 'lista/:nome',
        loadComponent: () => import('../lista-detalhe/lista-detalhe.page').then(m => m.ListaDetalhePage)
      },
      {
        path: 'estatisticas',
        loadComponent: () => import('../estatisticas/estatisticas.page').then(m => m.EstatisticasPage)
      },
      {
        path: '',
        redirectTo: 'tab1',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule {}
