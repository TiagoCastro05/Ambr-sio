import { Component, OnDestroy, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthUserService } from '../core/auth-user.service';
import { FirebaseService, Product, Lista } from '../services/firebase.service';
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
  showCreateInput = false;     // Controlo para mostrar/esconder o campo de criação de nova lista
  nomeLista = '';              // Nome da nova lista a criar

  // Campos para registo de novo produto
  productNome = '';
  productQuantidade = 1;

  listas: Lista[] = [];          // Array para armazenar as listas de produtos
  private subscription: Subscription = new Subscription();
  
  // Usando inject() para resolver problema de EnvironmentInjector
  private userService = inject(AuthUserService);
  private firebaseService = inject(FirebaseService);
  private toastController = inject(ToastController);
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

  // Método para alternar a exibição do campo de criação de lista
  onAddLista() {
    this.showCreateInput = !this.showCreateInput;
    if (this.showCreateInput) {
      this.nomeLista = '';
    }
  }
  
  // Criar nova lista com o nome digitado
  async criarNovaLista() {
    if (this.nomeLista && this.nomeLista.trim()) {
      try {
        console.log('TAB4 - Criando lista:', this.nomeLista.trim());
        const listaId = await this.firebaseService.addLista({
          nome: this.nomeLista.trim(),
          products: []
        });
        console.log('TAB4 - Lista criada com ID:', listaId);
        this.showToast('Lista criada com sucesso!', 'success');
        this.showCreateInput = false;
        this.nomeLista = '';
      } catch (error) {
        console.error('TAB4 - Erro ao criar lista:', error);
        this.showToast('Erro ao criar lista', 'danger');
      }
    }
  }

  // Método para registar um novo produto através do serviço Firebase
  async registerProduct() {
    if (this.productNome.trim() && this.productQuantidade > 0) {
      try {
        await this.firebaseService.addProduct({
          nome: this.productNome.trim(),
          quantidade: this.productQuantidade
        });
        this.showToast('Produto adicionado com sucesso!', 'success');
        this.productNome = '';
        this.productQuantidade = 1;
      } catch (error) {
        console.error('Erro ao adicionar produto:', error);
        this.showToast('Erro ao adicionar produto', 'danger');
      }
    }
  }

  // Método para adicionar um produto a uma lista específica
  async addProductToList(productNome: string, productQuantidade: number, lista: Lista) {
    if (lista.id) {
      const updatedProducts = [...lista.products, { nome: productNome, quantidade: productQuantidade }];
      try {
        await this.firebaseService.updateLista(lista.id, { products: updatedProducts });
        this.showToast('Produto adicionado à lista!', 'success');
      } catch (error) {
        console.error('Erro ao adicionar produto à lista:', error);
        this.showToast('Erro ao adicionar produto à lista', 'danger');
      }
    }
  }

  // Método para editar uma lista (sem usar AlertController)
  async editLista(lista: Lista) {
    this.showCreateInput = true;
    this.nomeLista = lista.nome;
    
    // Armazenamos o ID da lista sendo editada
    const listaId = lista.id;
    
    // Implementar a edição quando o usuário confirmar
    if (listaId) {
      try {
        await this.firebaseService.updateLista(listaId, { nome: this.nomeLista.trim() });
        this.showToast('Lista atualizada!', 'success');
        this.showCreateInput = false;
      } catch (error) {
        console.error('Erro ao atualizar lista:', error);
        this.showToast('Erro ao atualizar lista', 'danger');
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
      this.router.navigate(['/tabs/lista', lista.id]);
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
