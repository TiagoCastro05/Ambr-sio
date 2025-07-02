import { Component, OnDestroy, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthUserService } from '../core/auth-user.service';
import { FirebaseService, Product, Lista } from '../services/firebase.service';
import { AlertController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';

// Definição das interfaces para estruturar os dados dos produtos e listas
interface Produto {
  nome: string;          // Nome do produto
  quantidade: number;    // Quantidade do produto
}

@Component({
  selector: 'app-tab4',            // Nome do seletor do componente
  standalone: true,                // Componente independente (sem módulo associado)
  imports: [IonicModule, FormsModule, CommonModule, RouterModule], // Importação de módulos necessários
  templateUrl: './tab4.page.html',  // Ficheiro HTML associado
  styleUrls: ['./tab4.page.scss'],  // Ficheiro de estilos CSS associado
})
export class Tab4Page implements OnDestroy {
  showCreateInput = false;     // Controlo para mostrar/esconder o campo de criação de nova lista
  nomeLista = '';              // Nome da nova lista a criar

  // Campos para registo de novo produto
  productNome = '';
  productQuantidade = 1;

  listas: Lista[] = [];          // Array para armazenar as listas de produtos
  private subscription: Subscription = new Subscription();

  // Serviços via injeção de dependência
  private userService = inject(AuthUserService);
  private firebaseService = inject(FirebaseService);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);
  private router = inject(Router);

  constructor() {
    this.loadListas();    // Carrega as listas ao criar o componente
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  // Carrega as listas do Firebase com logs detalhados
  loadListas() {
    console.log('TAB4 - 🔍 Carregando listas...');
    
    this.subscription.add(
      this.firebaseService.getListas().subscribe(
        listas => {
          console.log('TAB4 - ✅ Listas carregadas:', listas.length, listas);
          this.listas = listas;
        },
        error => {
          console.error('TAB4 - ❌ Erro ao carregar listas:', error);
          this.showToast('Erro ao carregar listas', 'danger');
        }
      )
    );
  }

  // Método para criar nova lista sem AlertController para evitar problemas de injeção
  async onAddLista() {
    console.log('TAB4 - 📝 Iniciando criação de lista...');
    this.showCreateInput = true;
    this.nomeLista = '';
  }

  // Método para salvar lista usando input simples
  async onSaveLista() {
    if (!this.nomeLista.trim()) {
      this.showToast('Por favor, digite um nome válido', 'warning');
      return;
    }

    try {
      console.log('TAB4 - 💾 Salvando lista:', this.nomeLista.trim());
      
      const lista: Lista = {
        nome: this.nomeLista.trim(),
        products: []
      };
      
      console.log('TAB4 - 🔥 Chamando firebaseService.addLista...');
      const listaId = await this.firebaseService.addLista(lista);
      
      console.log('TAB4 - ✅ Lista salva com sucesso, ID:', listaId);
      this.showToast('Lista criada com sucesso!', 'success');
      
      // Limpar campos
      this.nomeLista = '';
      this.showCreateInput = false;
      
    } catch (error) {
      console.error('TAB4 - ❌ Erro ao salvar lista:', error);
      this.showToast('Erro ao criar lista: ' + (error as any).message, 'danger');
    }
  }

  // Método para cancelar criação de lista
  onCancelLista() {
    this.showCreateInput = false;
    this.nomeLista = '';
  }

  // Método para editar uma lista
  async editLista(lista: Lista) {
    const alert = await this.alertController.create({
      header: 'Editar Lista',
      inputs: [
        {
          name: 'nome',
          type: 'text',
          value: lista.nome,
          placeholder: 'Nome da lista'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Salvar',
          handler: async (data) => {
            if (data.nome && data.nome.trim() && lista.id) {
              try {
                await this.firebaseService.updateLista(lista.id, { nome: data.nome.trim() });
                this.showToast('Lista atualizada com sucesso!', 'success');
                return true;
              } catch (error) {
                console.error('Erro ao atualizar lista:', error);
                this.showToast('Erro ao atualizar lista', 'danger');
                return false;
              }
            } else {
              this.showToast('Por favor, digite um nome válido', 'warning');
              return false;
            }
          }
        }
      ]
    });
    await alert.present();
  }

  // Método para excluir uma lista
  async deleteLista(lista: Lista) {
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: `Tem certeza que deseja excluir a lista "${lista.nome}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Excluir',
          handler: async () => {
            if (lista.id) {
              try {
                await this.firebaseService.deleteLista(lista.id);
                this.showToast('Lista excluída com sucesso!', 'warning');
              } catch (error) {
                console.error('Erro ao excluir lista:', error);
                this.showToast('Erro ao excluir lista', 'danger');
              }
            }
          }
        }
      ]
    });
    await alert.present();
  }

  // Método para mostrar mensagens toast
  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: color,
      position: 'bottom'
    });
    toast.present();
  }
}
