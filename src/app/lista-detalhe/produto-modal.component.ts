import { Component, Input, OnInit } from '@angular/core';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Produto } from '../services/firebase.service';

@Component({
  selector: 'app-produto-modal',
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ isEdit ? 'Editar Produto' : 'Adicionar Produto' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="cancel()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form #produtoForm="ngForm">
        
        <!-- Loja -->
        <ion-item lines="full">
          <ion-label position="stacked" style="color: #333 !important;">Loja *</ion-label>
          <ion-select 
            [(ngModel)]="produto.loja" 
            name="loja"
            interface="popover"
            placeholder="Selecione ou digite nova loja"
            style="color: #000 !important;">
            <ion-select-option *ngFor="let loja of lojas" [value]="loja">
              {{ loja }}
            </ion-select-option>
            <ion-select-option value="custom">✏️ Escrever nova loja</ion-select-option>
          </ion-select>
        </ion-item>

        <!-- Campo personalizado para loja -->
        <ion-item *ngIf="produto.loja === 'custom'" lines="full">
          <ion-label position="stacked" style="color: #333 !important;">Nome da nova loja</ion-label>
          <ion-input 
            [(ngModel)]="customLoja" 
            name="customLoja"
            placeholder="Digite o nome da loja"
            type="text"
            style="color: #000 !important;">
          </ion-input>
        </ion-item>

        <!-- Categoria -->
        <ion-item lines="full">
          <ion-label position="stacked" style="color: #333 !important;">Categoria *</ion-label>
          <ion-select 
            [(ngModel)]="produto.tipoProduto" 
            name="tipoProduto"
            interface="popover"
            placeholder="Selecione ou digite nova categoria"
            (ionChange)="onCategoriaChange()"
            style="color: #000 !important;">
            <ion-select-option *ngFor="let categoria of categorias" [value]="categoria">
              {{ categoria }}
            </ion-select-option>
            <ion-select-option value="custom">✏️ Escrever nova categoria</ion-select-option>
          </ion-select>
        </ion-item>

        <!-- Campo personalizado para categoria -->
        <ion-item *ngIf="produto.tipoProduto === 'custom'" lines="full">
          <ion-label position="stacked" style="color: #333 !important;">Nome da nova categoria</ion-label>
          <ion-input 
            [(ngModel)]="customCategoria" 
            name="customCategoria"
            placeholder="Digite o nome da categoria"
            type="text"
            style="color: #000 !important;">
          </ion-input>
        </ion-item>

        <!-- Produto -->
        <ion-item lines="full">
          <ion-label position="stacked" style="color: #333 !important;">Produto *</ion-label>
          <ion-select 
            [(ngModel)]="produto.produto" 
            name="produto"
            interface="popover"
            placeholder="Selecione ou digite novo produto"
            style="color: #000 !important;">
            <ion-select-option *ngFor="let prod of produtosFiltrados" [value]="prod">
              {{ prod }}
            </ion-select-option>
            <ion-select-option value="custom">✏️ Escrever novo produto</ion-select-option>
          </ion-select>
        </ion-item>

        <!-- Campo personalizado para produto -->
        <ion-item *ngIf="produto.produto === 'custom'" lines="full">
          <ion-label position="stacked" style="color: #333 !important;">Nome do novo produto</ion-label>
          <ion-input 
            [(ngModel)]="customProduto" 
            name="customProduto"
            placeholder="Digite o nome do produto"
            type="text"
            style="color: #000 !important;">
          </ion-input>
        </ion-item>

        <!-- Quantidade -->
        <ion-item lines="full">
          <ion-label position="stacked" style="color: #333 !important;">Quantidade *</ion-label>
          <div style="display: flex; gap: 8px; width: 100%;">
            <ion-input 
              [(ngModel)]="produto.quantidadeNumero" 
              name="quantidadeNumero"
              placeholder="Ex: 2, 500, 1"
              type="number"
              step="0.01"
              required
              style="color: #000 !important; flex: 1;">
            </ion-input>
            <ion-select 
              [(ngModel)]="produto.unidade" 
              name="unidade"
              interface="popover"
              placeholder="Unidade"
              style="color: #000 !important; flex: 0 0 120px;">
              <ion-select-option value="unidades">unidades</ion-select-option>
              <ion-select-option value="kg">kg</ion-select-option>
              <ion-select-option value="g">g</ion-select-option>
              <ion-select-option value="L">L</ion-select-option>
              <ion-select-option value="ml">ml</ion-select-option>
              <ion-select-option value="pacotes">pacotes</ion-select-option>
              <ion-select-option value="caixas">caixas</ion-select-option>
              <ion-select-option value="latas">latas</ion-select-option>
              <ion-select-option value="garrafas">garrafas</ion-select-option>
            </ion-select>
          </div>
        </ion-item>

        <!-- Preço -->
        <ion-item lines="full">
          <ion-label position="stacked" style="color: #333 !important;">Preço (€)</ion-label>
          <ion-input 
            [(ngModel)]="produto.preco" 
            name="preco"
            placeholder="0.00"
            type="number"
            step="0.01"
            style="color: #000 !important;">
          </ion-input>
        </ion-item>

        <!-- Data de Validade -->
        <ion-item lines="full">
          <ion-label position="stacked" style="color: #333 !important;">Data de Validade</ion-label>
          <ion-datetime 
            [(ngModel)]="produto.validade"
            name="validade"
            display-format="DD/MM/YYYY"
            picker-format="DD MMM YYYY"
            placeholder="Selecione a data"
            style="color: #000 !important;">
          </ion-datetime>
        </ion-item>

      </form>
    </ion-content>

    <ion-footer>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button fill="clear" (click)="cancel()">
            Cancelar
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button 
            fill="solid" 
            (click)="save()"
            [disabled]="!isFormValid()">
            {{ isEdit ? 'Atualizar' : 'Adicionar' }}
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-footer>
  `,
  styles: [`
    ion-content {
      --background: #f9f9f9;
      --color: #000;
    }
    
    ion-item {
      --background: white;
      --color: #000;
      margin-bottom: 12px;
      border-radius: 8px;
      --border-color: #e0e0e0;
    }
    
    ion-label {
      --color: #333 !important;
      color: #333 !important;
    }
    
    ion-select, ion-input, ion-datetime {
      --padding-start: 12px;
      --color: #000 !important;
      --placeholder-color: #666 !important;
      color: #000 !important;
    }
    
    ion-select-option {
      --color: #000 !important;
      color: #000 !important;
    }
    
    ion-input input {
      color: #000 !important;
    }
    
    ion-header ion-toolbar {
      --background: #3880ff;
      --color: white;
    }
    
    ion-header ion-title {
      color: white;
    }
    
    ion-header ion-button {
      --color: white;
    }
    
    ion-footer ion-toolbar {
      --background: white;
      --color: #000;
      border-top: 1px solid #e0e0e0;
    }
    
    ion-footer ion-button {
      --color: #3880ff;
    }
    
    ion-footer ion-button[fill="solid"] {
      --background: #3880ff;
      --color: white;
    }
  `]
})
export class ProdutoModalComponent implements OnInit {
  @Input() produto: Produto = {
    loja: '',
    tipoProduto: '',
    produto: '',
    quantidade: '',
    quantidadeNumero: undefined,
    unidade: 'unidades',
    validade: '',
    preco: '',
    listaNome: ''
  };
  @Input() isEdit: boolean = false;
  @Input() nomeLista: string = '';

  // Campos customizados
  customLoja = '';
  customCategoria = '';
  customProduto = '';

  // Dados para os dropdowns - apenas relacionados com alimentação
  lojas: string[] = [
    'Continente', 'Pingo Doce', 'Lidl', 'Intermarché', 'Auchan', 
    'Mercadona', 'E.Leclerc', 'Minipreço', 'Jumbo', 'Froiz'
  ];

  categorias: string[] = [
    'Fruta', 'Legumes', 'Carne', 'Peixe', 'Lacticínios', 'Cereais', 
    'Bebidas', 'Congelados', 'Conservas', 'Padaria', 'Doces', 'Temperos'
  ];

  nomesProdutos: { [categoria: string]: string[] } = {
    'Fruta': ['Maçãs', 'Bananas', 'Laranjas', 'Peras', 'Uvas', 'Morangos', 'Kiwis', 'Mangas', 'Ananás', 'Melão', 'Melancia', 'Pêssegos'],
    'Legumes': ['Batatas', 'Cenouras', 'Cebolas', 'Tomates', 'Alface', 'Brócolos', 'Courgettes', 'Pepinos', 'Pimentos', 'Beringela', 'Espinafres', 'Feijão verde'],
    'Carne': ['Frango', 'Porco', 'Vaca', 'Presunto', 'Fiambre', 'Salsichas', 'Bacon', 'Chouriço', 'Alheira', 'Peru', 'Borrego'],
    'Peixe': ['Salmão', 'Bacalhau', 'Sardinha', 'Dourada', 'Robalo', 'Atum', 'Linguado', 'Pescada', 'Camarão', 'Lulas', 'Polvo'],
    'Lacticínios': ['Leite', 'Queijo', 'Iogurte', 'Manteiga', 'Natas', 'Requeijão', 'Queijo fresco', 'Leite condensado', 'Ovos'],
    'Cereais': ['Pão', 'Arroz', 'Massa', 'Aveia', 'Bolachas', 'Cereais', 'Farinha', 'Quinoa', 'Granola', 'Tostas'],
    'Bebidas': ['Água', 'Sumo', 'Refrigerante', 'Cerveja', 'Vinho', 'Café', 'Chá', 'Leite', 'Kombucha'],
    'Congelados': ['Pizza congelada', 'Gelado', 'Legumes congelados', 'Peixe congelado', 'Batatas fritas', 'Fruta congelada'],
    'Conservas': ['Atum em lata', 'Sardinha em lata', 'Tomate pelado', 'Feijão em lata', 'Grão em lata', 'Milho em lata'],
    'Padaria': ['Pão de forma', 'Croissant', 'Baguete', 'Pão integral', 'Broa', 'Bolos', 'Pastéis'],
    'Doces': ['Chocolate', 'Gomas', 'Biscoitos', 'Mel', 'Açúcar', 'Doce de fruta', 'Nutella'],
    'Temperos': ['Sal', 'Pimenta', 'Alho', 'Cebola em pó', 'Oregãos', 'Canela', 'Azeite', 'Vinagre', 'Molho de tomate']
  };

  produtosFiltrados: string[] = [];

  constructor(
    private modalController: ModalController,
    private toastController: ToastController
  ) {
    this.produto.listaNome = this.nomeLista;
  }

  ngOnInit() {
    this.onCategoriaChange();
  }

  onCategoriaChange() {
    if (this.produto.tipoProduto && this.produto.tipoProduto !== 'custom') {
      this.produtosFiltrados = this.nomesProdutos[this.produto.tipoProduto] || [];
    } else {
      this.produtosFiltrados = [];
    }
    
    // Limpar produto selecionado se categoria mudou
    if (this.produto.produto && this.produto.produto !== 'custom') {
      if (!this.produtosFiltrados.includes(this.produto.produto)) {
        this.produto.produto = '';
      }
    }
  }

  isFormValid(): boolean {
    const loja = this.produto.loja === 'custom' ? this.customLoja : this.produto.loja;
    const categoria = this.produto.tipoProduto === 'custom' ? this.customCategoria : this.produto.tipoProduto;
    const produtoNome = this.produto.produto === 'custom' ? this.customProduto : this.produto.produto;
    
    // Verificar se há quantidade (seja no formato antigo ou no novo formato com número e unidade)
    const temQuantidade = this.produto.quantidade || 
                         (this.produto.quantidadeNumero && this.produto.unidade);
    
    return !!(loja && categoria && produtoNome && temQuantidade);
  }

  async save() {
    if (!this.isFormValid()) {
      const toast = await this.toastController.create({
        message: 'Por favor, preencha todos os campos obrigatórios',
        duration: 2000,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    // Criar a quantidade final combinando número e unidade
    const quantidadeFinal = this.produto.quantidadeNumero && this.produto.unidade 
      ? `${this.produto.quantidadeNumero} ${this.produto.unidade}`
      : this.produto.quantidade;

    // Usar valores customizados se aplicável
    const produtoFinal: Produto = {
      loja: this.produto.loja === 'custom' ? this.customLoja : this.produto.loja,
      tipoProduto: this.produto.tipoProduto === 'custom' ? this.customCategoria : this.produto.tipoProduto,
      produto: this.produto.produto === 'custom' ? this.customProduto : this.produto.produto,
      quantidade: quantidadeFinal,
      quantidadeNumero: this.produto.quantidadeNumero,
      unidade: this.produto.unidade,
      preco: this.produto.preco,
      validade: this.produto.validade,
      listaNome: this.nomeLista
    };

    this.modalController.dismiss(produtoFinal, 'save');
  }

  cancel() {
    this.modalController.dismiss(null, 'cancel');
  }
}
