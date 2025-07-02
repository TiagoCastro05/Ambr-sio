import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { RouteReuseStrategy } from '@angular/router';

import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { environment } from '../environments/environment';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { IonicStorageModule } from '@ionic/storage-angular';

import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';

@NgModule({
  declarations: [AppComponent],               // Declara o componente principal da app
  imports: [
    BrowserModule,                            // Necessário para apps web
    IonicModule.forRoot(),                    // Inicializa o Ionic Framework
    AppRoutingModule,                         // Modulo que gere as rotas da aplicação
    AngularFireModule.initializeApp(environment.firebase), // Inicializa o Firebase com as credenciais do ambiente
    AngularFireAuthModule,                    // Módulo para autenticação Firebase
    AngularFirestoreModule,                   // Módulo para Firestore Database
    IonicStorageModule.forRoot(),             // Módulo para armazenamento local (persistente)
    // outros imports podem ser adicionados aqui...
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }, BarcodeScanner  // Estratégia para reutilizar rotas do Ionic
  ],
  bootstrap: [AppComponent],                  // Componente inicial da app
})
export class AppModule {}

// Serviço para gerir dados históricos usando armazenamento local
@Injectable({
  providedIn: 'root',       // Serviço disponível em toda a aplicação
})
export class HistoricoService {
  constructor(private storage: Storage) {
    this.init();            // Inicializa o armazenamento local ao criar o serviço
  }

  // Inicializa a instância do armazenamento local
  async init() {
    await this.storage.create();
  }

  // Método para guardar dados no armazenamento local usando uma chave
  async saveData(key: string, value: any) {
    await this.storage.set(key, value);
  }

  // Método para obter dados do armazenamento local pela chave
  async getData(key: string) {
    return await this.storage.get(key);
  }
}
