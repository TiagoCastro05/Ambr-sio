import { Component, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { IonicModule, AlertController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthUserService } from '../core/auth-user.service';
import { FirebaseService, Product, Lista } from '../services/firebase.service';
import { HistoricoService } from '../services/historico.service';
import { ToastController } from '@ionic/angular';
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
  listas: Lista[] = [];          // Array para armazenar as listas de produtos
  private subscription: Subscription = new Subscription();
  
  // Usando inject() para resolver problema de EnvironmentInjector
  private userService = inject(AuthUserService);
  private firebaseService = inject(FirebaseService);
  private historicoService = inject(HistoricoService);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

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

  // Método para mostrar modal de criação de nova lista
  async onAddLista() {
    const alert = await this.alertController.create({
      header: 'Nova Lista',
      message: 'Digite o nome da nova lista:',
      inputs: [
        {
          name: 'nomeLista',
          type: 'text',
          placeholder: 'Nome da lista',
          attributes: {
            maxlength: 50
          }
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Criar',
          handler: (data) => {
            if (data.nomeLista && data.nomeLista.trim()) {
              this.criarNovaLista(data.nomeLista.trim());
              return true;
            } else {
              this.showToast('Por favor, insira um nome para a lista', 'warning');
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Método para criar nova lista
  async criarNovaLista(nomeLista: string) {
    try {
      console.log('TAB4 - 🚀 Iniciando criação de lista:', nomeLista);
      
      const listaData = {
        nome: nomeLista,
        products: []
      };
      
      console.log('TAB4 - 📋 Dados da lista a criar:', listaData);
      
      const listaId = await this.firebaseService.addLista(listaData);
      
      console.log('TAB4 - ✅ Lista criada com ID:', listaId);
      this.showToast('Lista criada com sucesso!', 'success');
      
      // Recarregar as listas
      this.loadListas();
      
    } catch (error) {
      console.error('TAB4 - ❌ Erro ao criar lista:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.showToast(`Erro ao criar lista: ${errorMessage}`, 'danger');
    }
  }

  // Método para editar uma lista
  async editLista(lista: Lista) {
    const alert = await this.alertController.create({
      header: 'Editar Lista',
      message: 'Digite o novo nome da lista:',
      inputs: [
        {
          name: 'nomeLista',
          type: 'text',
          placeholder: 'Nome da lista',
          value: lista.nome,
          attributes: {
            maxlength: 50
          }
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Atualizar',
          handler: (data) => {
            if (data.nomeLista && data.nomeLista.trim()) {
              this.atualizarLista(lista.id!, data.nomeLista.trim());
              return true;
            } else {
              this.showToast('Por favor, insira um nome para a lista', 'warning');
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Método para atualizar lista existente
  async atualizarLista(listaId: string, novoNome: string) {
    try {
      console.log('TAB4 - 🔄 Editando lista:', listaId, novoNome);
      
      await this.firebaseService.updateLista(listaId, { nome: novoNome });
      
      console.log('TAB4 - ✅ Lista atualizada com sucesso');
      this.showToast('Lista atualizada com sucesso!', 'success');
      
      // Recarregar as listas
      this.loadListas();
      
    } catch (error) {
      console.error('TAB4 - ❌ Erro ao atualizar lista:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.showToast(`Erro ao atualizar lista: ${errorMessage}`, 'danger');
    }
  }

  // Método para adicionar um produto a uma lista específica
  async addProductToList(productNome: string, productQuantidade: number, lista: Lista) {
    if (lista.id) {
      const updatedProducts = [...lista.products, { nome: productNome, quantidade: productQuantidade }];
      try {
        await this.firebaseService.updateLista(lista.id, { products: updatedProducts });
        
        // Adicionar ao histórico
        await this.historicoService.adicionar({
          nome: productNome,
          quantidade: productQuantidade,
          listaNome: lista.nome,
          listaId: lista.id
        });
        
        this.showToast('Produto adicionado à lista!', 'success');
      } catch (error) {
        console.error('Erro ao adicionar produto à lista:', error);
        this.showToast('Erro ao adicionar produto à lista', 'danger');
      }
    }
  }

  // Método para eliminar uma lista
  async deleteLista(lista: Lista) {
    if (confirm(`Tem certeza que deseja eliminar a lista "${lista.nome}"?`)) {
      if (lista.id) {
        try {
          await this.firebaseService.deleteLista(lista.id);
          this.showToast('Lista eliminada!', 'success');
        } catch (error) {
          console.error('Erro ao eliminar lista:', error);
          this.showToast('Erro ao eliminar lista', 'danger');
        }
      }
    }
  }

  // Navegar para detalhe da lista
  navigateToLista(lista: Lista) {
    if (lista.id) {
      const listaId = lista.id as string;
      this.router.navigate(['/tabs/lista', listaId]);
    }
  }

  // Método utilitário para mostrar toasts de feedback
  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: color,
      position: 'bottom'
    });
    toast.present();
  }
}
