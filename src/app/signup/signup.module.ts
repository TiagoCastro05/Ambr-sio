import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SignupPageRoutingModule } from './signup-routing.module';

import { SignupPage } from './signup.page';

@NgModule({
  // Importações de outros módulos necessários para esta página
  imports: [
    CommonModule,            // Diretivas comuns (ngIf, ngFor, etc.)
    FormsModule,             // Suporte a formulários template-driven
    IonicModule,             // Componentes UI do Ionic (ion-button, ion-input, etc.)
    SignupPageRoutingModule  // Definições de rota específicas para a página de registo
  ],
  // Declaração do componente desta página para que o Angular saiba processá-lo
  declarations: [SignupPage]
})
export class SignupPageModule {}

