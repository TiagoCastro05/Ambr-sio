import { Component, Input, OnInit } from '@angular/core';
import { IonicModule, ModalController, ToastController, ActionSheetController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Produto, FirebaseService } from '../services/firebase.service';

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
          <ion-label position="stacked" style="color: #333 !important;">
            Loja *
          </ion-label>
          <ion-select 
            [(ngModel)]="produto.loja" 
            name="loja"
            interface="popover"
            placeholder="Selecione uma loja"
            required
            style="color: #000 !important;">
            <ion-select-option *ngFor="let loja of lojas" [value]="loja">
              {{ loja }}
            </ion-select-option>
            <ion-select-option value="custom">✏️ Escrever nova loja</ion-select-option>
          </ion-select>
        </ion-item>

        <!-- Campo personalizado para loja -->
        <ion-item *ngIf="produto.loja === 'custom'" lines="full">
          <ion-label position="stacked" style="color: #333 !important;">
            Nome da nova loja *
          </ion-label>
          <ion-input 
            [(ngModel)]="customLoja" 
            name="customLoja"
            placeholder="Digite o nome da loja"
            type="text"
            required
            (ionFocus)="scrollToElement($event)"
            style="color: #000 !important;">
          </ion-input>
        </ion-item>

        <!-- Categoria -->
        <ion-item lines="full">
          <ion-label position="stacked" style="color: #333 !important;">
            Categoria *
          </ion-label>
          <ion-select 
            [(ngModel)]="produto.tipoProduto" 
            name="tipoProduto"
            interface="popover"
            placeholder="Selecione uma categoria"
            required
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
          <ion-label position="stacked" style="color: #333 !important;">
            Nome da nova categoria *
          </ion-label>
          <ion-input 
            [(ngModel)]="customCategoria" 
            name="customCategoria"
            placeholder="Digite o nome da categoria"
            type="text"
            required
            (ionFocus)="scrollToElement($event)"
            style="color: #000 !important;">
          </ion-input>
        </ion-item>

        <!-- Produto -->
        <ion-item lines="full">
          <ion-label position="stacked" style="color: #333 !important;">
            Produto *
          </ion-label>
          <ion-select 
            [(ngModel)]="produto.produto" 
            name="produto"
            interface="popover"
            placeholder="Selecione um produto"
            required
            (ionChange)="onProdutoChange()"
            style="color: #000 !important;">
            <ion-select-option *ngFor="let prod of produtosFiltrados" [value]="prod">
              {{ prod }}
            </ion-select-option>
            <ion-select-option value="custom">✏️ Escrever novo produto</ion-select-option>
          </ion-select>
        </ion-item>

        <!-- Campo personalizado para produto -->
        <ion-item *ngIf="produto.produto === 'custom'" lines="full">
          <ion-label position="stacked" style="color: #333 !important;">
            Nome do novo produto *
          </ion-label>
          <ion-input 
            [(ngModel)]="customProduto" 
            name="customProduto"
            placeholder="Digite o nome do produto"
            type="text"
            required
            (ionFocus)="scrollToElement($event)"
            style="color: #000 !important;">
          </ion-input>
        </ion-item>

        <!-- Quantidade -->
        <ion-item lines="full">
          <ion-label position="stacked" style="color: #333 !important;">
            Quantidade *
          </ion-label>
          <div style="display: flex; gap: 8px; width: 100%; align-items: center;">
            <ion-input 
              [(ngModel)]="quantidadeInput" 
              name="quantidadeInput"
              placeholder="1"
              type="number"
              min="1"
              step="1"
              required
              clearInput="true"
              fill="outline"
              inputmode="numeric"
              (ionInput)="onQuantidadeChange()"
              (ionFocus)="scrollToElement($event)"
              style="color: #000 !important; flex: 1; --background: white; --border-color: #ccc;">
            </ion-input>
            <ion-select 
              [(ngModel)]="produto.unidade" 
              name="unidade"
              interface="popover"
              placeholder="Selecione unidade"
              required
              style="color: #000 !important; flex: 0 0 140px;">
              <ion-select-option value="garrafas">garrafas</ion-select-option>
              <ion-select-option value="latas">latas</ion-select-option>
              <ion-select-option value="unidades">unidades</ion-select-option>
              <ion-select-option value="pacotes">pacotes</ion-select-option>
              <ion-select-option value="caixas">caixas</ion-select-option>
              <ion-select-option value="kg">kg</ion-select-option>
              <ion-select-option value="g">g</ion-select-option>
              <ion-select-option value="L">L</ion-select-option>
              <ion-select-option value="ml">ml</ion-select-option>
            </ion-select>
          </div>
        </ion-item>

        <!-- Preço -->
        <ion-item lines="full" [class.item-has-error]="!produto.preco || parsePreco(produto.preco) < 0">
          <ion-label position="stacked" style="color: #333 !important;">
            Preço (€) *
          </ion-label>
          <ion-input 
            [(ngModel)]="produto.preco" 
            name="preco"
            placeholder="0.00"
            type="number"
            step="0.01"
            min="0"
            required
            (ionFocus)="scrollToElement($event)"
            style="color: #000 !important;">
          </ion-input>
        </ion-item>

        <!-- Imagem do Produto -->
        <ion-item lines="full">
          <ion-label position="stacked" style="color: #333 !important;">
            Imagem do Produto
          </ion-label>
          <div style="display: flex; flex-direction: column; gap: 12px; width: 100%; margin-top: 8px;">
            <!-- Preview da imagem -->
            <div style="display: flex; justify-content: center;">
              <img 
                [src]="getImagemPreview()" 
                alt="Imagem do produto"
                style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px; border: 2px solid #e0e0e0;">
            </div>
            <!-- Botões de ação -->
            <div style="display: flex; gap: 8px; justify-content: center;">
              <ion-button 
                fill="outline" 
                size="small"
                (click)="selecionarImagem()">
                <ion-icon name="camera" slot="start"></ion-icon>
                Escolher Imagem
              </ion-button>
              <ion-button 
                fill="clear" 
                size="small" 
                color="danger"
                *ngIf="produto.imagemUrl"
                (click)="removerImagem()">
                <ion-icon name="trash" slot="start"></ion-icon>
                Remover
              </ion-button>
            </div>
          </div>
          <!-- Input oculto para arquivo -->
          <input 
            id="fileInput"
            type="file" 
            accept="image/*" 
            style="display: none;" 
            (change)="onFileSelected($event)">
        </ion-item>

        <!-- Data de Validade -->
        <ion-item lines="full" [class.item-has-error]="!produto.validade">
          <ion-label position="stacked" style="color: #333 !important;">
            Data de Validade *
          </ion-label>
          <ion-datetime 
            [(ngModel)]="produto.validade"
            name="validade"
            presentation="date"
            display-format="DD/MM/YYYY"
            min="2025-01-01"
            max="2030-12-31"
            placeholder="Selecione a data de validade"
            required
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
            (click)="save()">
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
    
    ion-item.item-has-error {
      --border-color: #ff3333;
      --background: #fff5f5;
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
    
    ion-footer ion-button[disabled] {
      --background: #cccccc;
      --color: #666666;
    }
  `]
})
export class ProdutoModalComponent implements OnInit {
  @Input() produto: Produto = {
    loja: '',
    tipoProduto: '',
    produto: '',
    quantidade: '1',
    quantidadeNumero: 1,
    unidade: 'garrafas',
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

  // Campo intermediário para a quantidade
  quantidadeInput: number = 1;
  
  // Propriedades para imagem
  imagemSelecionada: File | null = null;
  uploadProgress: number = 0;
  isUploading: boolean = false;

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

  // Mapeamento das categorias do sistema para as pastas de imagens
  private categoriasParaPastas: { [key: string]: string } = {
    'Fruta': 'Fruta',
    'Legumes': 'Legumes',
    'Carne': 'Carne',
    'Peixe': 'Peixe',
    'Lacticínios': 'Laticinios',
    'Cereais': 'Cereais',
    'Bebidas': 'Bebidas',
    'Congelados': 'Congelados',
    'Conservas': 'Conservas',
    'Padaria': 'Padaria',
    'Doces': 'Doces',
    'Temperos': 'Temperos'
  };

  // Método para obter a imagem do produto
  getImagemProduto(): string {
    // Se há uma imagem sendo carregada (preview local)
    if (this.imagemSelecionada) {
      console.log('Usando imagem selecionada:', this.imagemSelecionada.name);
      return URL.createObjectURL(this.imagemSelecionada);
    }
    
    // Se há uma imagem já salva no produto
    if (this.produto.imagemUrl) {
      console.log('Usando imagem salva:', this.produto.imagemUrl);
      return this.produto.imagemUrl;
    }
    
    // Tentar encontrar imagem baseada no produto e categoria selecionados
    const categoria = this.produto.tipoProduto === 'custom' ? this.customCategoria : this.produto.tipoProduto;
    const produtoNome = this.produto.produto === 'custom' ? this.customProduto : this.produto.produto;
    
    console.log('Tentando encontrar imagem para:', { categoria, produtoNome });
    
    if (categoria && produtoNome && categoria !== 'custom' && produtoNome !== 'custom') {
      const pastaImagem = this.categoriasParaPastas[categoria];
      if (pastaImagem) {
        // Tentar diferentes variações do nome do produto
        const imagemPath = this.tentarEncontrarImagem(pastaImagem, produtoNome);
        if (imagemPath) {
          console.log('Imagem encontrada:', imagemPath);
          return imagemPath;
        } else {
          console.log('Imagem não encontrada para:', pastaImagem, produtoNome);
        }
      } else {
        console.log('Pasta não encontrada para categoria:', categoria);
      }
    }
    
    // Imagem padrão baseada no tipo de produto
    console.log('Usando imagem padrão do Firebase');
    return this.firebaseService.getImagemFinalProduto(this.produto);
  }

  // Método para tentar encontrar a imagem com diferentes variações
  private tentarEncontrarImagem(pasta: string, nomeProduto: string): string | null {
    const basePath = `assets/imagens/produtos/${pasta}`;
    
    // Mapeamento conhecido de imagens baseado na estrutura das pastas
    const imagensConhecidas: { [pasta: string]: string[] } = {
      'Fruta': ['Ananás.jpg', 'Bananas.jpg', 'Kiwis.jpg', 'Laranjas.jpg', 'Mangas.jpg', 'Maças.jpg', 'Melancia.jpg', 'Melão.jpg', 'Morangos.jpg', 'Peras.jpg', 'Pessegos.jpg', 'Uvas.jpg'],
      'Legumes': ['Alface.jpg', 'Batatas.jpg', 'Beringela.jpg', 'Brocolos.jpg', 'Cebolas.jpg', 'cenoura.jpg', 'Courgettes.jpg', 'Espinafre.jpg', 'Feijão Verde.jpg', 'Pepinos.jpg', 'Pimentos.jpg', 'tomate.jpg'],
      'Bebidas': ['Agua.jpg', 'Cafe.jpg', 'Cerveja.jpg', 'Cha.jpg', 'Kombucha.jpg', 'Leite.jpg', 'Refrigerante.jpg', 'Sumo.webp', 'Vinho.jpg'],
      'Carne': ['Alheira.jpg', 'Bacon.jpg', 'Borrego.jpg', 'Chouriço.png', 'Fiambre.jpg', 'Frango.jpg', 'Peru.jpg', 'Porco.jpg', 'Presunto.jpg', 'Salsichas.jpg', 'Vaca.jpg'],
      'Peixe': ['Atum.jpg', 'bacalhau.jpg', 'Camarão.png', 'Dourada.jpg', 'Linguado.jpg', 'Lulas.png', 'Pescada.jpg', 'Polvo.jpg', 'Robalo.jpg', 'salmao.jpg', 'Sardinha.jpg'],
      'Laticinios': ['Iorgute.jpg', 'Leite Condensado.png', 'Leite.jpg', 'Manteiga.jpg', 'Natas.jpg', 'Ovos.png', 'Queijo Fresco.jpg', 'queijo.jpg', 'Requeijão.jpg'],
      'Cereais': ['Arroz.jpg', 'Aveia.jpg', 'Bolachas.jpg', 'Cereais.jpg', 'Farinha.jpg', 'Granola.jpg', 'Massa.jpg', 'Pão.jpg', 'Quinoa.jpg', 'Tostas.jpg'],
      'Doces': ['Açucar.jpg', 'Biscoitos.jpg', 'Chocolate.jpg', 'Doce de Fruta.jpg', 'Gomas.jpg', 'Mel.jpg', 'Nutella.jpg'],
      'Temperos': ['Alho.jpg', 'Azeite.jpg', 'Canela.jpg', 'Cebola em pó.jpg', 'Molho de Tomate.jpg', 'Oregãos.jpg', 'Pimenta.jpg', 'Sal.jpg', 'Vinagre.jpg'],
      'Conservas': ['Atum em lata.jpg', 'Feijão em Lata.jpg', 'Grão em Lata.jpg', 'Milho em Lata.jpg', 'Sardinha em Lata.jpg', 'Tomate Pelado.jpg'],
      'Padaria': ['Baguete.jpg', 'Bolos.jpg', 'Broa.jpg', 'Croissant.jpg', 'Pastéis.jpg', 'Pão de Forma.jpg', 'Pão Integral.jpg'],
      'Congelados': ['Batata Fritas.jpg', 'Fruta Congelada.png', 'Gelado.jpg', 'Legumes Congelados.jpg', 'Peixe Congelado.png', 'Pizza.png']
    };
    
    const arquivosNaPasta = imagensConhecidas[pasta] || [];
    const nomeProcurado = nomeProduto.toLowerCase();
    
    // Mapeamento de correspondências especiais
    const correspondenciasEspeciais: { [key: string]: string } = {
      'maçãs': 'Maças.jpg',
      'pêssegos': 'Pessegos.jpg',
      'brócolos': 'Brocolos.jpg',
      'cenouras': 'cenoura.jpg',
      'tomates': 'tomate.jpg',
      'espinafres': 'Espinafre.jpg',
      'água': 'Agua.jpg',
      'café': 'Cafe.jpg',
      'chá': 'Cha.jpg',
      'bacalhau': 'bacalhau.jpg',
      'salmão': 'salmao.jpg',
      'camarão': 'Camarão.png',
      'iogurte': 'Iorgute.jpg',
      'queijo': 'queijo.jpg',
      'chouriço': 'Chouriço.png',
      'açúcar': 'Açucar.jpg',
      'oregãos': 'Oregãos.jpg',
      'feijão verde': 'Feijão Verde.jpg',
      'atum em lata': 'Atum em lata.jpg',
      'sardinha em lata': 'Sardinha em Lata.jpg',
      'feijão em lata': 'Feijão em Lata.jpg',
      'grão em lata': 'Grão em Lata.jpg',
      'milho em lata': 'Milho em Lata.jpg',
      'tomate pelado': 'Tomate Pelado.jpg',
      'pão de forma': 'Pão de Forma.jpg',
      'pão integral': 'Pão Integral.jpg',
      'doce de fruta': 'Doce de Fruta.jpg',
      'cebola em pó': 'Cebola em pó.jpg',
      'molho de tomate': 'Molho de Tomate.jpg',
      'pizza congelada': 'Pizza.png',
      'batatas fritas': 'Batata Fritas.jpg',
      'fruta congelada': 'Fruta Congelada.png',
      'legumes congelados': 'Legumes Congelados.jpg',
      'peixe congelado': 'Peixe Congelado.png',
      'leite condensado': 'Leite Condensado.png',
      'queijo fresco': 'Queijo Fresco.jpg',
      'requeijão': 'Requeijão.jpg'
    };
    
    // Primeiro, verificar correspondências especiais
    if (correspondenciasEspeciais[nomeProcurado]) {
      const arquivo = correspondenciasEspeciais[nomeProcurado];
      if (arquivosNaPasta.includes(arquivo)) {
        return `${basePath}/${arquivo}`;
      }
    }
    
    // Procurar por correspondência direta
    for (const arquivo of arquivosNaPasta) {
      const nomeArquivoSemExt = arquivo.replace(/\.[^/.]+$/, '').toLowerCase();
      
      // Correspondência exata
      if (nomeArquivoSemExt === nomeProcurado) {
        return `${basePath}/${arquivo}`;
      }
      
      // Correspondência parcial
      if (nomeArquivoSemExt.includes(nomeProcurado) || nomeProcurado.includes(nomeArquivoSemExt)) {
        return `${basePath}/${arquivo}`;
      }
    }
    
    return null;
  }

  // Método para normalizar nomes (remover acentos, etc.)
  private normalizarNome(nome: string): string {
    return nome
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-zA-Z0-9\s]/g, '')  // Remove caracteres especiais
      .trim();
  }

  // Método para verificar se a imagem existe (baseado nos nomes conhecidos)
  private verificarSeImagemExiste(pasta: string, nome: string, extensao: string): boolean {
    // Mapeamento conhecido de imagens baseado na estrutura das pastas
    const imagensConhecidas: { [pasta: string]: string[] } = {
      'Fruta': ['Ananás.jpg', 'Bananas.jpg', 'Kiwis.jpg', 'Laranjas.jpg', 'Mangas.jpg', 'Maças.jpg', 'Melancia.jpg', 'Melão.jpg', 'Morangos.jpg', 'Peras.jpg', 'Pessegos.jpg', 'Uvas.jpg'],
      'Legumes': ['Alface.jpg', 'Batatas.jpg', 'Beringela.jpg', 'Brocolos.jpg', 'Cebolas.jpg', 'cenoura.jpg', 'Courgettes.jpg', 'Espinafre.jpg', 'Feijão Verde.jpg', 'Pepinos.jpg', 'Pimentos.jpg', 'tomate.jpg'],
      'Bebidas': ['Agua.jpg', 'Cafe.jpg', 'Cerveja.jpg', 'Cha.jpg', 'Kombucha.jpg', 'Leite.jpg', 'Refrigerante.jpg', 'Sumo.webp', 'Vinho.jpg'],
      'Carne': ['Alheira.jpg', 'Bacon.jpg', 'Borrego.jpg', 'Chouriço.png', 'Fiambre.jpg', 'Frango.jpg', 'Peru.jpg', 'Porco.jpg', 'Presunto.jpg', 'Salsichas.jpg', 'Vaca.jpg'],
      'Peixe': ['Atum.jpg', 'bacalhau.jpg', 'Camarão.png', 'Dourada.jpg', 'Linguado.jpg', 'Lulas.png', 'Pescada.jpg', 'Polvo.jpg', 'Robalo.jpg', 'salmao.jpg', 'Sardinha.jpg'],
      'Laticinios': ['Iorgute.jpg', 'Leite Condensado.png', 'Leite.jpg', 'Manteiga.jpg', 'Natas.jpg', 'Ovos.png', 'Queijo Fresco.jpg', 'queijo.jpg', 'Requeijão.jpg'],
      'Cereais': ['Arroz.jpg', 'Aveia.jpg', 'Bolachas.jpg', 'Cereais.jpg', 'Farinha.jpg', 'Granola.jpg', 'Massa.jpg', 'Pão.jpg', 'Quinoa.jpg', 'Tostas.jpg'],
      'Doces': ['Açucar.jpg', 'Biscoitos.jpg', 'Chocolate.jpg', 'Doce de Fruta.jpg', 'Gomas.jpg', 'Mel.jpg', 'Nutella.jpg'],
      'Temperos': ['Alho.jpg', 'Azeite.jpg', 'Canela.jpg', 'Cebola em pó.jpg', 'Molho de Tomate.jpg', 'Oregãos.jpg', 'Pimenta.jpg', 'Sal.jpg', 'Vinagre.jpg'],
      'Conservas': ['Atum em lata.jpg', 'Feijão em Lata.jpg', 'Grão em Lata.jpg', 'Milho em Lata.jpg', 'Sardinha em Lata.jpg', 'Tomate Pelado.jpg'],
      'Padaria': ['Baguete.jpg', 'Bolos.jpg', 'Broa.jpg', 'Croissant.jpg', 'Pastéis.jpg', 'Pão de Forma.jpg', 'Pão Integral.jpg'],
      'Congelados': ['Batata Fritas.jpg', 'Fruta Congelada.png', 'Gelado.jpg', 'Legumes Congelados.jpg', 'Peixe Congelado.png', 'Pizza.png']
    };
    
    const arquivosNaPasta = imagensConhecidas[pasta] || [];
    const nomeComExtensao = `${nome}.${extensao}`;
    
    // Verificar se existe uma correspondência exata ou aproximada
    return arquivosNaPasta.some(arquivo => {
      const nomeArquivo = arquivo.toLowerCase();
      const nomeProcurado = nomeComExtensao.toLowerCase();
      
      // Correspondência exata
      if (nomeArquivo === nomeProcurado) return true;
      
      // Correspondência sem a extensão
      const nomeArquivoSemExt = arquivo.replace(/\.[^/.]+$/, '').toLowerCase();
      const nomeProcuradoSemExt = nome.toLowerCase();
      
      if (nomeArquivoSemExt === nomeProcuradoSemExt) return true;
      
      // Correspondência parcial (contém)
      if (nomeArquivoSemExt.includes(nomeProcuradoSemExt) || nomeProcuradoSemExt.includes(nomeArquivoSemExt)) return true;
      
      // Correspondência para casos especiais
      const correspondenciasEspeciais: { [key: string]: string[] } = {
        'maçãs': ['maças'],
        'pêssegos': ['pessegos'],
        'brócolos': ['brocolos'],
        'cenouras': ['cenoura'],
        'tomates': ['tomate'],
        'espinafres': ['espinafre'],
        'água': ['agua'],
        'café': ['cafe'],
        'chá': ['cha'],
        'bacalhau': ['bacalhau'],
        'salmão': ['salmao'],
        'camarão': ['camarão'],
        'iogurte': ['iorgute'],
        'queijo': ['queijo'],
        'chouriço': ['chouriço'],
        'açúcar': ['açucar'],
        'oregãos': ['oregãos'],
        'pão': ['pão'],
        'feijão verde': ['feijão verde'],
        'atum em lata': ['atum em lata'],
        'sardinha em lata': ['sardinha em lata'],
        'feijão em lata': ['feijão em lata'],
        'grão em lata': ['grão em lata'],
        'milho em lata': ['milho em lata'],
        'tomate pelado': ['tomate pelado'],
        'pão de forma': ['pão de forma'],
        'pão integral': ['pão integral'],
        'doce de fruta': ['doce de fruta'],
        'cebola em pó': ['cebola em pó'],
        'molho de tomate': ['molho de tomate'],
        'pizza congelada': ['pizza'],
        'batatas fritas': ['batata fritas'],
        'fruta congelada': ['fruta congelada'],
        'legumes congelados': ['legumes congelados'],
        'peixe congelado': ['peixe congelado'],
        'leite condensado': ['leite condensado'],
        'queijo fresco': ['queijo fresco'],
        'requeijão': ['requeijão']
      };
      
      for (const [chave, valores] of Object.entries(correspondenciasEspeciais)) {
        if (nomeProcuradoSemExt.includes(chave) && valores.some(v => nomeArquivoSemExt.includes(v))) {
          return true;
        }
        if (chave.includes(nomeProcuradoSemExt) && valores.some(v => nomeArquivoSemExt.includes(v))) {
          return true;
        }
      }
      
      return false;
    });
  }

  produtosFiltrados: string[] = [];

  constructor(
    private modalController: ModalController,
    private toastController: ToastController,
    private firebaseService: FirebaseService,
    private actionSheetController: ActionSheetController
  ) {
    // Garantir que os valores padrão estejam definidos
    if (!this.produto.quantidadeNumero) {
      this.produto.quantidadeNumero = 1;
    }
    if (!this.produto.unidade) {
      this.produto.unidade = 'garrafas';
    }
    this.quantidadeInput = this.produto.quantidadeNumero;
    this.produto.listaNome = this.nomeLista;
    console.log('Constructor - produto inicial:', this.produto);
  }

  ngOnInit() {
    // Garantir que os valores estão corretos ao inicializar
    if (!this.produto.quantidadeNumero || this.produto.quantidadeNumero <= 0) {
      this.produto.quantidadeNumero = 1;
    }
    if (!this.produto.unidade) {
      this.produto.unidade = 'garrafas';
    }
    this.quantidadeInput = this.produto.quantidadeNumero;
    console.log('NgOnInit - produto após init:', this.produto);
    this.onCategoriaChange();
  }

  // Método para garantir que a quantidade é sempre um número válido
  onQuantidadeChange() {
    console.log('Quantidade mudou:', this.quantidadeInput);
    if (this.quantidadeInput) {
      const numero = Number(this.quantidadeInput);
      if (isNaN(numero) || numero < 1) {
        this.quantidadeInput = 1;
      } else {
        this.quantidadeInput = Math.floor(numero); // Garantir que é um inteiro
      }
    } else {
      this.quantidadeInput = 1;
    }
    // Sincronizar com o produto
    this.produto.quantidadeNumero = this.quantidadeInput;
    console.log('Quantidade final:', this.quantidadeInput, 'Produto:', this.produto.quantidadeNumero);
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
    
    // Limpar imagem customizada para mostrar a nova imagem do produto
    if (!this.imagemSelecionada && !this.produto.imagemUrl) {
      // Forçar atualização da imagem preview
      setTimeout(() => {
        // Trigger change detection para atualizar a imagem
      }, 100);
    }
  }

  // Método chamado quando o produto é alterado
  onProdutoChange() {
    // Limpar imagem customizada para mostrar a nova imagem do produto
    if (!this.imagemSelecionada && !this.produto.imagemUrl) {
      // Forçar atualização da imagem preview
      setTimeout(() => {
        // Trigger change detection para atualizar a imagem
      }, 100);
    }
  }

  isFormValid(): boolean {
    // Verificar loja (obrigatória)
    const loja = this.produto.loja === 'custom' ? this.customLoja : this.produto.loja;
    if (!loja || loja.trim() === '') {
      console.log('Validação: Loja não preenchida');
      return false;
    }

    // Verificar categoria (obrigatória)
    const categoria = this.produto.tipoProduto === 'custom' ? this.customCategoria : this.produto.tipoProduto;
    if (!categoria || categoria.trim() === '') {
      console.log('Validação: Categoria não preenchida');
      return false;
    }

    // Verificar produto (obrigatório)
    const produtoNome = this.produto.produto === 'custom' ? this.customProduto : this.produto.produto;
    if (!produtoNome || produtoNome.trim() === '') {
      console.log('Validação: Produto não preenchido');
      return false;
    }

    // Verificar quantidade (obrigatória) - simplificado
    if (!this.quantidadeInput || this.quantidadeInput <= 0) {
      console.log('Validação: Quantidade não preenchida ou inválida:', this.quantidadeInput);
      return false;
    }

    // Verificar unidade (obrigatória)
    if (!this.produto.unidade || this.produto.unidade.trim() === '') {
      console.log('Validação: Unidade não preenchida');
      return false;
    }

    // Verificar preço (obrigatório) - CORRIGIDO para lidar com number
    if (!this.produto.preco || this.produto.preco === '' || parseFloat(this.produto.preco.toString()) < 0) {
      console.log('Validação: Preço não preenchido ou inválido');
      return false;
    }

    // Verificar data de validade (obrigatória)
    if (!this.produto.validade || this.produto.validade.trim() === '') {
      console.log('Validação: Data de validade não preenchida');
      return false;
    }

    console.log('Validação: Todos os campos válidos!');
    return true;
  }

  // Método para identificar quais campos estão em falta (que estava faltando)
  getCamposEmFalta(): string[] {
    const camposEmFalta: string[] = [];

    // Verificar loja
    const loja = this.produto.loja === 'custom' ? this.customLoja : this.produto.loja;
    if (!loja || loja.trim() === '') {
      camposEmFalta.push('Loja');
    }

    // Verificar categoria
    const categoria = this.produto.tipoProduto === 'custom' ? this.customCategoria : this.produto.tipoProduto;
    if (!categoria || categoria.trim() === '') {
      camposEmFalta.push('Categoria');
    }

    // Verificar produto
    const produtoNome = this.produto.produto === 'custom' ? this.customProduto : this.produto.produto;
    if (!produtoNome || produtoNome.trim() === '') {
      camposEmFalta.push('Produto');
    }

    // Verificar quantidade
    if (!this.quantidadeInput || this.quantidadeInput <= 0) {
      camposEmFalta.push('Quantidade');
    }

    // Verificar unidade
    if (!this.produto.unidade || this.produto.unidade.trim() === '') {
      camposEmFalta.push('Unidade');
    }

    // Verificar preço - CORRIGIDO para lidar com number
    if (!this.produto.preco || this.produto.preco === '' || parseFloat(this.produto.preco.toString()) < 0) {
      camposEmFalta.push('Preço');
    }

    // Verificar data de validade
    if (!this.produto.validade || this.produto.validade.trim() === '') {
      camposEmFalta.push('Data de Validade');
    }

    return camposEmFalta;
  }

  // Métodos auxiliares para validação visual que estavam faltando
  getLoja(): string {
    return this.produto.loja === 'custom' ? this.customLoja : this.produto.loja;
  }

  getCategoria(): string {
    return this.produto.tipoProduto === 'custom' ? this.customCategoria : this.produto.tipoProduto;
  }

  getProdutoNome(): string {
    return this.produto.produto === 'custom' ? this.customProduto : this.produto.produto;
  }

  parsePreco(preco: string | number): number {
    if (typeof preco === 'number') {
      return preco;
    }
    return parseFloat(preco) || 0;
  }

  async save() {
    // Garantir que a quantidade esteja sincronizada antes de salvar
    this.produto.quantidadeNumero = this.quantidadeInput;
    
    if (!this.isFormValid()) {
      // Identificar quais campos estão em falta
      const camposEmFalta = this.getCamposEmFalta();
      
      const toast = await this.toastController.create({
        message: `Por favor, preencha os seguintes campos: ${camposEmFalta.join(', ')}`,
        duration: 4000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
      return;
    }

    this.isUploading = true;

    try {
      // Se há uma nova imagem selecionada, fazer upload
      if (this.imagemSelecionada) {
        const toast = await this.toastController.create({
          message: 'Fazendo upload da imagem...',
          duration: 2000,
          color: 'primary'
        });
        await toast.present();

        const { url, path } = await this.firebaseService.uploadImagemProduto(
          this.imagemSelecionada, 
          this.produto.produto
        );
        
        this.produto.imagemUrl = url;
        this.produto.imagemPath = path;
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
        listaNome: this.nomeLista,
        imagemUrl: this.produto.imagemUrl,
        imagemPath: this.produto.imagemPath
      };

      console.log('Produto final a ser salvo:', produtoFinal);
      this.modalController.dismiss(produtoFinal, 'save');
      
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      const toast = await this.toastController.create({
        message: 'Erro ao fazer upload da imagem. Tente novamente.',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.isUploading = false;
    }
  }

  cancel() {
    this.modalController.dismiss(null, 'cancel');
  }

  // === MÉTODOS PARA IMAGENS ===
  
  getImagemPreview(): string {
    return this.getImagemProduto();
  }
  
  async selecionarImagem(): Promise<void> {
    const actionSheet = await this.actionSheetController.create({
      header: 'Selecionar Imagem',
      buttons: [
        {
          text: 'Câmera',
          icon: 'camera',
          handler: () => {
            this.abrirCamera();
          }
        },
        {
          text: 'Galeria',
          icon: 'images',
          handler: () => {
            this.abrirGaleria();
          }
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }
  
  abrirCamera(): void {
    // Para web, usar input file
    this.abrirGaleria();
  }
  
  abrirGaleria(): void {
    const fileInput = document.querySelector('#fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }
  
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        this.showToast('Por favor, selecione apenas arquivos de imagem', 'warning');
        return;
      }
      
      // Validar tamanho (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        this.showToast('A imagem deve ter no máximo 5MB', 'warning');
        return;
      }
      
      this.imagemSelecionada = file;
      console.log('Imagem selecionada:', file.name, 'Tamanho:', file.size);
    }
  }
  
  async removerImagem(): Promise<void> {
    this.imagemSelecionada = null;
    
    // Se há uma imagem já salva, marcar para deletar
    if (this.produto.imagemUrl && this.produto.imagemPath) {
      // A imagem será deletada quando salvar o produto
      this.produto.imagemUrl = '';
      this.produto.imagemPath = '';
    }
    
    this.showToast('Imagem removida', 'success');
  }
  
  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'top'
    });
    await toast.present();
  }
  
  // Método para fazer scroll automático quando o teclado aparece
  scrollToElement(event: any) {
    setTimeout(() => {
      const element = event.target;
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 300);
  }
  
  // === FIM DOS MÉTODOS DE IMAGENS ===
}
