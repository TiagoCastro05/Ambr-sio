import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, ToastController, AlertController, ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FirebaseService, Produto } from '../services/firebase.service';
import { Subscription } from 'rxjs';
import { ProdutoModalComponent } from './produto-modal.component';

@Component({
  selector: 'app-lista-detalhe',
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule],
  templateUrl: './lista-detalhe.page.html',
  styleUrls: ['./lista-detalhe.page.scss'],
})
export class ListaDetalhePage implements OnDestroy {
  // Nome da lista atual (obtido da rota)
  nomeLista = '';

  // Lista de produtos adicionados à lista
  produtos: Produto[] = [];
  private subscription: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController,
    private modalController: ModalController,
    private firebaseService: FirebaseService  // REATIVANDO O FIREBASE SERVICE
  ) {
    this.nomeLista = this.route.snapshot.paramMap.get('nome') || '';
    console.log('LISTA-DETALHE - 📋 Lista carregada:', this.nomeLista);
    this.loadProdutos();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  // Carrega os produtos da lista
  loadProdutos() {
    console.log('LISTA-DETALHE - 🔍 Carregando produtos para lista:', this.nomeLista);
    
    this.subscription.add(
      this.firebaseService.getProdutosByLista(this.nomeLista).subscribe(
        produtos => {
          console.log('LISTA-DETALHE - ✅ Produtos carregados:', produtos.length, produtos);
          this.produtos = produtos;
        },
        error => {
          console.error('LISTA-DETALHE - ❌ Erro ao carregar produtos:', error);
          this.showToast('Erro ao carregar produtos', 'danger');
        }
      )
    );
  }

  // Mostra modal para adicionar produtos
  async onAdicionarProdutos() {
    const modal = await this.modalController.create({
      component: ProdutoModalComponent,
      componentProps: {
        nomeLista: this.nomeLista,
        isEdit: false
      }
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    
    if (role === 'save' && data) {
      console.log('LISTA-DETALHE - 💾 Salvando produto:', data);
      
      try {
        // Salvar no Firebase
        await this.firebaseService.addProduto(data);
        console.log('LISTA-DETALHE - ✅ Produto salvo no Firebase');
        this.showToast('Produto adicionado com sucesso!', 'success');
      } catch (error) {
        console.error('LISTA-DETALHE - ❌ Erro ao salvar produto:', error);
        this.showToast('Erro ao adicionar produto', 'danger');
      }
    }
  }

  // Editar um produto existente usando o modal
  async editProduto(produto: Produto, index: number) {
    const modal = await this.modalController.create({
      component: ProdutoModalComponent,
      componentProps: {
        produto: { ...produto }, // Fazer uma cópia para evitar mutação
        nomeLista: this.nomeLista,
        isEdit: true
      }
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    
    if (role === 'save' && data) {
      console.log('LISTA-DETALHE - 📝 Atualizando produto:', data);
      
      try {
        // Atualizar no Firebase
        if (produto.id) {
          await this.firebaseService.updateProduto(produto.id, data);
          console.log('LISTA-DETALHE - ✅ Produto atualizado no Firebase');
          this.showToast('Produto atualizado!', 'success');
        }
      } catch (error) {
        console.error('LISTA-DETALHE - ❌ Erro ao atualizar produto:', error);
        this.showToast('Erro ao atualizar produto', 'danger');
      }
    }
  }

  // Eliminar um produto - versão local
  async deleteProduto(produto: Produto, index: number) {
    const alert = await this.alertController.create({
      header: 'Eliminar Produto',
      message: `Tens a certeza que queres eliminar "${produto.produto}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            console.log('LISTA-DETALHE - 🗑️ Eliminando produto:', produto.produto);
            
            try {
              // Eliminar do Firebase
              if (produto.id) {
                await this.firebaseService.deleteProduto(produto.id);
                console.log('LISTA-DETALHE - ✅ Produto eliminado do Firebase');
                this.showToast('Produto eliminado!', 'success');
              }
            } catch (error) {
              console.error('LISTA-DETALHE - ❌ Erro ao eliminar produto:', error);
              this.showToast('Erro ao eliminar produto', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: color,
      position: 'bottom'
    });
    await toast.present();
  }

  // Navegar de volta para a lista de listas
  onBack() {
    this.router.navigate(['/tabs/tab4']);
  }
}
