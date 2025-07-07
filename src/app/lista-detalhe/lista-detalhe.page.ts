import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, ToastController, AlertController, ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FirebaseService, Produto } from '../services/firebase.service';
import { HistoricoService } from '../services/historico.service';
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
    private firebaseService: FirebaseService,  // REATIVANDO O FIREBASE SERVICE
    private historicoService: HistoricoService
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
        
        // Adicionar ao histórico
        try {
          await this.historicoService.adicionar({
            nome: data.produto,
            quantidade: parseInt(data.quantidade) || 1,
            listaNome: this.nomeLista
          });
          console.log('LISTA-DETALHE - ✅ Produto adicionado ao histórico');
        } catch (historicoError) {
          console.error('LISTA-DETALHE - ⚠️ Erro ao adicionar ao histórico:', historicoError);
          // Não falhar a operação principal se o histórico falhar
        }
        
        this.showToast('Produto adicionado com sucesso!', 'success');
      } catch (error) {
        console.error('LISTA-DETALHE - ❌ Erro ao salvar produto:', error);
        this.showToast('Erro ao adicionar produto', 'danger');
      }
    }
  }

  // Editar um produto existente usando o modal
  async editProduto(produto: Produto, index: number) {
    // Adicionar feedback visual
    this.addClickFeedback(event?.target as HTMLElement, 'edit');
    
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
          this.showToast('Produto atualizado com sucesso!', 'success');
        }
      } catch (error) {
        console.error('LISTA-DETALHE - ❌ Erro ao atualizar produto:', error);
        this.showToast('Erro ao atualizar produto', 'danger');
      }
    }
  }

  // Aumentar quantidade consumida
  async aumentarQuantidade(produto: Produto, index: number) {
    if (produto.id) {
      const novaQuantidade = (produto.quantidadeConsumida || 0) + 1;
      try {
        await this.firebaseService.updateQuantidadeConsumida(produto.id, novaQuantidade);
        // Atualizar localmente
        produto.quantidadeConsumida = novaQuantidade;
        console.log('LISTA-DETALHE - Quantidade aumentada para:', novaQuantidade);
      } catch (error) {
        console.error('LISTA-DETALHE - Erro ao aumentar quantidade:', error);
        this.showToast('Erro ao atualizar quantidade', 'danger');
      }
    }
  }

  // Diminuir quantidade consumida
  async diminuirQuantidade(produto: Produto, index: number) {
    if (produto.id && (produto.quantidadeConsumida || 0) > 0) {
      const novaQuantidade = (produto.quantidadeConsumida || 0) - 1;
      try {
        await this.firebaseService.updateQuantidadeConsumida(produto.id, novaQuantidade);
        // Atualizar localmente
        produto.quantidadeConsumida = novaQuantidade;
        console.log('LISTA-DETALHE - Quantidade diminuída para:', novaQuantidade);
      } catch (error) {
        console.error('LISTA-DETALHE - Erro ao diminuir quantidade:', error);
        this.showToast('Erro ao atualizar quantidade', 'danger');
      }
    }
  }

  // Método para lidar com mudanças na quantidade consumida via input
  async onQuantidadeConsumidaChange(produto: Produto, event: any) {
    if (!produto.id) return;
    
    const valor = event.target.value || '';
    console.log('LISTA-DETALHE - Valor inserido:', valor);
    
    // Extrair apenas o número do valor inserido
    const numeroMatch = valor.match(/[\d.,]+/);
    if (numeroMatch) {
      const numeroStr = numeroMatch[0].replace(',', '.');
      const novaQuantidade = parseFloat(numeroStr);
      
      if (!isNaN(novaQuantidade) && novaQuantidade >= 0) {
        try {
          await this.firebaseService.updateQuantidadeConsumida(produto.id, novaQuantidade);
          // Atualizar localmente
          produto.quantidadeConsumida = novaQuantidade;
          console.log('LISTA-DETALHE - Quantidade atualizada para:', novaQuantidade);
        } catch (error) {
          console.error('LISTA-DETALHE - Erro ao atualizar quantidade:', error);
          this.showToast('Erro ao atualizar quantidade', 'danger');
        }
      } else {
        console.log('LISTA-DETALHE - Valor inválido inserido:', valor);
        this.showToast('Valor inválido. Digite um número válido.', 'warning');
      }
    } else {
      console.log('LISTA-DETALHE - Nenhum número encontrado no valor:', valor);
      this.showToast('Digite um número válido.', 'warning');
    }
  }

  // Eliminar um produto - versão local
  async deleteProduto(produto: Produto, index: number) {
    // Adicionar feedback visual
    this.addClickFeedback(event?.target as HTMLElement, 'delete');
    
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
          handler: () => {
            // Retornar true permite que o alerta seja fechado automaticamente
            return true;
          }
        }
      ]
    });

    await alert.present();
    
    // Lidar com o resultado do alerta
    const { role } = await alert.onDidDismiss();
    
    if (role === 'destructive') {
      console.log('LISTA-DETALHE - 🗑️ Eliminando produto:', produto.produto);
      
      try {
        // Eliminar do Firebase
        if (produto.id) {
          await this.firebaseService.deleteProduto(produto.id);
          console.log('LISTA-DETALHE - ✅ Produto eliminado do Firebase');
          this.showToast('Produto eliminado com sucesso!', 'success');
        }
      } catch (error) {
        console.error('LISTA-DETALHE - ❌ Erro ao eliminar produto:', error);
        this.showToast('Erro ao eliminar produto', 'danger');
      }
    }
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

  // Obter URL da imagem do produto
  getProductImageUrl(produto: Produto): string {
    console.log('🖼️ DEBUG - Processando imagem para:', produto.produto, 'categoria:', produto.tipoProduto);
    
    // Se o produto já tem uma imagem URL do Firebase, usa essa
    if (produto.imagemUrl) {
      console.log('🖼️ DEBUG - Usando imagem do Firebase:', produto.imagemUrl);
      return produto.imagemUrl;
    }
    
    // Caso contrário, tenta encontrar uma imagem local baseada na categoria e nome do produto
    const categoria = produto.tipoProduto?.toLowerCase() || 'outros';
    const nomeProduto = produto.produto?.trim() || '';
    
    console.log('🖼️ DEBUG - Categoria normalizada:', categoria, 'Nome produto:', nomeProduto);
    
    // Mapear algumas categorias para os nomes das pastas
    const categoriaMap: { [key: string]: string } = {
      'bebidas': 'Bebidas',
      'carne': 'Carne', 
      'cereais': 'Cereais',
      'congelados': 'Congelados',
      'conservas': 'Conservas',
      'doces': 'Doces',
      'fruta': 'Fruta',
      'higiene': 'Higiene',
      'lacticínios': 'Laticinios',
      'laticinios': 'Laticinios',
      'laticínios': 'Laticinios', // Variação com acento
      'lacticinios': 'Laticinios', // Variação sem acento
      'legumes': 'Legumes',
      'limpeza': 'Limpeza',
      'padaria': 'Padaria',
      'peixe': 'Peixe',
      'temperos': 'Temperos',
      'outros': 'Outros'
    };
    
    const pastaCategoria = categoriaMap[categoria] || 'Outros';
    console.log('🖼️ DEBUG - Pasta categoria:', pastaCategoria);
    
    // Função para normalizar texto (remover acentos, minúsculas)
    const normalizeText = (text: string): string => {
      return text.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .trim();
    };
    
    // 3. Mapeamento manual mais robusto - mover para o início
    const produtoImageMap: { [key: string]: { [key: string]: string } } = {
      'Bebidas': {
        'água': 'Agua.jpg', 'agua': 'Agua.jpg',
        'cafe': 'Cafe.jpg', 'café': 'Cafe.jpg',
        'cerveja': 'Cerveja.jpg',
        'chá': 'Cha.jpg', 'cha': 'Cha.jpg',
        'kombucha': 'Kombucha.jpg',
        'leite': 'Leite.jpg',
        'refrigerante': 'Refrigerante.jpg',
        'sumo': 'Sumo.webp', 'sumos': 'Sumo.webp',
        'vinho': 'Vinho.jpg'
      },
      'Conservas': {
        'atum em lata': 'Atum em lata.jpg', 'atum': 'Atum em lata.jpg',
        'feijão em lata': 'Feijão em Lata.jpg', 'feijao': 'Feijão em Lata.jpg',
        'grão em lata': 'Grão em Lata.jpg', 'grão': 'Grão em Lata.jpg',
        'grao': 'Grão em Lata.jpg', 'milho em lata': 'Milho em Lata.jpg',
        'milho': 'Milho em Lata.jpg', 'sardinha em lata': 'Sardinha em Lata.jpg',
        'sardinha': 'Sardinha em Lata.jpg', 'tomate pelado': 'Tomate Pelado.jpg'
      },
      'Temperos': {
        'alho': 'Alho.jpg', 'azeite': 'Azeite.jpg',
        'canela': 'Canela.jpg', 'cebola em pó': 'Cebola em pó.jpg',
        'molho de tomate': 'Molho de Tomate.jpg',
        'oregãos': 'Oregãos.jpg', 'oreganos': 'Oregãos.jpg',
        'pimenta': 'Pimenta.jpg', 'sal': 'Sal.jpg',
        'vinagre': 'Vinagre.jpg'
      },
      'Congelados': {
        'batata fritas': 'Batata Fritas.jpg', 'batatas fritas': 'Batata Fritas.jpg',
        'fritas': 'Batata Fritas.jpg', 'fruta congelada': 'Fruta Congelada.png',
        'gelado': 'Gelado.jpg', 'gelados': 'Gelado.jpg',
        'legumes congelados': 'Legumes Congelados.jpg',
        'peixe congelado': 'Peixe Congelado.png',
        'pizza': 'Pizza.png', 'pizzas': 'Pizza.png'
      },
      'Legumes': {
        'alface': 'Alface.jpg', 'batatas': 'Batatas.jpg',
        'batata': 'Batatas.jpg', 'beringela': 'Beringela.jpg',
        'brócolis': 'Brocolos.jpg', 'brocolos': 'Brocolos.jpg',
        'cebolas': 'Cebolas.jpg', 'cebola': 'Cebolas.jpg',
        'cenoura': 'cenoura.jpg', 'cenouras': 'cenoura.jpg',
        'courgettes': 'Courgettes.jpg', 'courgette': 'Courgettes.jpg',
        'espinafre': 'Espinafre.jpg', 'feijão verde': 'Feijão Verde.jpg',
        'feijao verde': 'Feijão Verde.jpg', 'pepinos': 'Pepinos.jpg',
        'pepino': 'Pepinos.jpg', 'pimentos': 'Pimentos.jpg',
        'pimento': 'Pimentos.jpg', 'tomate': 'tomate.jpg',
        'tomates': 'tomate.jpg'
      },
      'Carne': {
        'alheira': 'Alheira.jpg', 'bacon': 'Bacon.jpg',
        'borrego': 'Borrego.jpg', 'chouriço': 'Chouriço.png',
        'chorizo': 'Chouriço.png', 'fiambre': 'Fiambre.jpg',
        'frango': 'Frango.jpg', 'peru': 'Peru.jpg',
        'porco': 'Porco.jpg', 'presunto': 'Presunto.jpg',
        'salsichas': 'Salsichas.jpg', 'salsicha': 'Salsichas.jpg',
        'vaca': 'Vaca.jpg'
      },
      'Fruta': {
        'ananás': 'Ananás.jpg', 'ananas': 'Ananás.jpg',
        'bananas': 'Bananas.jpg', 'banana': 'Bananas.jpg',
        'kiwis': 'Kiwis.jpg', 'kiwi': 'Kiwis.jpg',
        'laranjas': 'Laranjas.jpg', 'laranja': 'Laranjas.jpg',
        'mangas': 'Mangas.jpg', 'manga': 'Mangas.jpg',
        'maçãs': 'Maças.jpg', 'maças': 'Maças.jpg',
        'maçã': 'Maças.jpg', 'maca': 'Maças.jpg',
        'melancia': 'Melancia.jpg', 'melão': 'Melão.jpg',
        'melao': 'Melão.jpg', 'morangos': 'Morangos.jpg',
        'morango': 'Morangos.jpg', 'peras': 'Peras.jpg',
        'pera': 'Peras.jpg', 'pêssegos': 'Pessegos.jpg',
        'pessegos': 'Pessegos.jpg', 'pêssego': 'Pessegos.jpg',
        'pessego': 'Pessegos.jpg', 'uvas': 'Uvas.jpg',
        'uva': 'Uvas.jpg'
      },
      'Laticinios': {
        'iogurte': 'Iorgute.jpg', 
        'iorgute': 'Iorgute.jpg',
        'yogurt': 'Iorgute.jpg',
        'yogurte': 'Iorgute.jpg',
        'leite condensado': 'Leite Condensado.png',
        'leite': 'Leite.jpg', 
        'manteiga': 'Manteiga.jpg',
        'margarina': 'Manteiga.jpg',
        'natas': 'Natas.jpg', 
        'ovos': 'Ovos.png',
        'ovo': 'Ovos.png', 
        'queijo fresco': 'Queijo Fresco.jpg',
        'queijo': 'queijo.jpg',
        'queijos': 'queijo.jpg',
        'requeijão': 'Requeijão.jpg',
        'requeijao': 'Requeijão.jpg'
      },
      'Cereais': {
        'arroz': 'Arroz.jpg', 'aveia': 'Aveia.jpg',
        'bolachas': 'Bolachas.jpg', 'bolacha': 'Bolachas.jpg',
        'cereais': 'Cereais.jpg', 'cereal': 'Cereais.jpg',
        'farinha': 'Farinha.jpg', 'granola': 'Granola.jpg',
        'massa': 'Massa.jpg', 'massas': 'Massa.jpg',
        'pão': 'Pão.jpg', 'pao': 'Pão.jpg',
        'quinoa': 'Quinoa.jpg', 'tostas': 'Tostas.jpg',
        'tosta': 'Tostas.jpg'
      },
      'Doces': {
        'açúcar': 'Açucar.jpg', 'açucar': 'Açucar.jpg',
        'sugar': 'Açucar.jpg', 'biscoitos': 'Biscoitos.jpg',
        'biscoito': 'Biscoitos.jpg', 'chocolate': 'Chocolate.jpg',
        'doce de fruta': 'Doce de Fruta.jpg', 'compota': 'Doce de Fruta.jpg',
        'gomas': 'Gomas.jpg', 'goma': 'Gomas.jpg',
        'mel': 'Mel.jpg', 'nutella': 'Nutella.jpg'
      },
      'Peixe': {
        'atum': 'Atum.jpg', 'bacalhau': 'bacalhau.jpg',
        'camarão': 'Camarão.png', 'camarao': 'Camarão.png',
        'dourada': 'Dourada.jpg', 'linguado': 'Linguado.jpg',
        'lulas': 'Lulas.png', 'lula': 'Lulas.png',
        'pescada': 'Pescada.jpg', 'polvo': 'Polvo.jpg',
        'robalo': 'Robalo.jpg', 'salmão': 'salmao.jpg',
        'salmao': 'salmao.jpg', 'sardinha': 'Sardinha.jpg',
        'sardinhas': 'Sardinha.jpg'
      },
      'Padaria': {
        'baguete': 'Baguete.jpg', 'baguettes': 'Baguete.jpg',
        'bolos': 'Bolos.jpg', 'bolo': 'Bolos.jpg',
        'broa': 'Broa.jpg', 'croissant': 'Croissant.jpg',
        'croissants': 'Croissant.jpg', 'pastéis': 'Pastéis.jpg',
        'pasteis': 'Pastéis.jpg', 'pastel': 'Pastéis.jpg',
        'pão de forma': 'Pão de Forma.jpg', 'pao de forma': 'Pão de Forma.jpg',
        'pão integral': 'Pão Integral.jpg', 'pao integral': 'Pão Integral.jpg'
      }
    };
    
    console.log('🖼️ DEBUG - Verificando mapeamento manual para categoria:', pastaCategoria);
    
    const imagensCategoria = produtoImageMap[pastaCategoria];
    if (imagensCategoria) {
      const nomeProdutoLower = nomeProduto.toLowerCase();
      const nomeProdutoNormalized = normalizeText(nomeProduto);
      
      console.log('🖼️ DEBUG - Chaves disponíveis na categoria:', Object.keys(imagensCategoria));
      console.log('🖼️ DEBUG - Procurando por produto:', nomeProdutoLower, 'normalizado:', nomeProdutoNormalized);
      
      // Estratégia 1: Correspondência exata
      if (imagensCategoria[nomeProdutoLower]) {
        const result = `assets/imagens/produtos/${pastaCategoria}/${imagensCategoria[nomeProdutoLower]}`;
        console.log('🖼️ DEBUG - Correspondência exata encontrada:', result);
        return result;
      }
      
      // Estratégia 2: Correspondência normalizada
      for (const [key, filename] of Object.entries(imagensCategoria)) {
        if (normalizeText(key) === nomeProdutoNormalized) {
          const result = `assets/imagens/produtos/${pastaCategoria}/${filename}`;
          console.log('🖼️ DEBUG - Correspondência normalizada encontrada:', result);
          return result;
        }
      }
      
      // Estratégia 3: Correspondência parcial (produto contém palavra-chave)
      for (const [key, filename] of Object.entries(imagensCategoria)) {
        if (nomeProdutoLower.includes(key)) {
          const result = `assets/imagens/produtos/${pastaCategoria}/${filename}`;
          console.log('🖼️ DEBUG - Correspondência parcial encontrada:', result);
          return result;
        }
      }
      
      // Estratégia 4: Correspondência parcial invertida (palavra-chave contém produto)
      for (const [key, filename] of Object.entries(imagensCategoria)) {
        if (key.includes(nomeProdutoLower)) {
          const result = `assets/imagens/produtos/${pastaCategoria}/${filename}`;
          console.log('🖼️ DEBUG - Correspondência parcial invertida encontrada:', result);
          return result;
        }
      }
    } else {
      console.log('🖼️ DEBUG - Nenhuma imagem encontrada na categoria:', pastaCategoria);
    }
    
    // Se ainda não encontrar, usa a imagem do Ambrosio como fallback
    console.log('🖼️ DEBUG - Usando fallback padrão');
    return 'assets/imagens/Ambrosio.png';
  }

  // Método auxiliar para obter palavras similares (variações comuns)
  private getSimilarWords(word: string): string[] {
    const variations = [word];
    
    // Variações de acentos
    const accentMap: { [key: string]: string[] } = {
      'a': ['á', 'à', 'ã', 'â'],
      'e': ['é', 'è', 'ê'],
      'i': ['í', 'ì', 'î'],
      'o': ['ó', 'ò', 'ô', 'õ'],
      'u': ['ú', 'ù', 'û'],
      'c': ['ç'],
      'n': ['ñ']
    };
    
    // Adicionar variações com acentos
    for (const [base, accents] of Object.entries(accentMap)) {
      for (const accent of accents) {
        if (word.includes(accent)) {
          variations.push(word.replace(new RegExp(accent, 'g'), base));
        }
        if (word.includes(base)) {
          for (const acc of accents) {
            variations.push(word.replace(new RegExp(base, 'g'), acc));
          }
        }
      }
    }
    
    // Variações de plural/singular
    if (word.endsWith('s') && word.length > 3) {
      variations.push(word.slice(0, -1)); // remover 's' final
    } else if (!word.endsWith('s')) {
      variations.push(word + 's'); // adicionar 's' final
    }
    
    // Variações específicas comuns
    const commonVariations: { [key: string]: string[] } = {
      'iogurte': ['iorgute', 'yogurt', 'yogurte'],
      'queijo': ['queijos'],
      'ovo': ['ovos'],
      'batata': ['batatas'],
      'tomate': ['tomates'],
      'pão': ['pao'],
      'açúcar': ['açucar', 'sugar']
    };
    
    for (const [key, vars] of Object.entries(commonVariations)) {
      if (word === key) {
        variations.push(...vars);
      } else if (vars.includes(word)) {
        variations.push(key);
        variations.push(...vars.filter(v => v !== word));
      }
    }
    
    return [...new Set(variations)]; // remover duplicatas
  }

  // Lidar com erro de carregamento da imagem
  onImageError(event: any) {
    const imgElement = event.target;
    const currentSrc = imgElement.src;
    
    console.log('🖼️ Erro ao carregar imagem:', currentSrc);
    
    // Se já está usando a imagem padrão, esconder elemento
    if (currentSrc.includes('Ambrosio.png')) {
      console.log('🖼️ Imagem padrão também falhou, escondendo imagem');
      imgElement.style.display = 'none';
      return;
    }
    
    // Obter informações do produto do atributo data
    const produtoNome = imgElement.getAttribute('data-produto');
    const produtoCategoria = imgElement.getAttribute('data-categoria');
    
    if (!imgElement.dataset.attemptCount) {
      imgElement.dataset.attemptCount = '0';
    }
    
    const attemptCount = parseInt(imgElement.dataset.attemptCount);
    
    // Estratégia 1: Tentar outras extensões
    if (attemptCount < 3) {
      const extensions = ['.jpeg', '.png', '.webp'];
      const basePath = currentSrc.replace(/\.[^/.]+$/, '');
      const newSrc = basePath + extensions[attemptCount];
      
      imgElement.dataset.attemptCount = (attemptCount + 1).toString();
      console.log('🖼️ Tentando nova extensão:', newSrc);
      imgElement.src = newSrc;
      return;
    }
    
    // Estratégia 2: Tentar variações do nome do produto
    if (attemptCount === 3 && produtoNome && produtoCategoria) {
      const variations = this.getSimilarWords(produtoNome.toLowerCase());
      
      if (variations.length > 1) {
        // Tentar a primeira variação diferente do nome original
        const nextVariation = variations.find(v => v !== produtoNome.toLowerCase());
        if (nextVariation) {
          const newUrl = this.getProductImageUrl({ 
            produto: nextVariation, 
            tipoProduto: produtoCategoria 
          } as any);
          
          if (newUrl !== currentSrc && !newUrl.includes('Ambrosio.png')) {
            imgElement.dataset.attemptCount = '4';
            console.log('🖼️ Tentando variação do nome:', nextVariation, '->', newUrl);
            imgElement.src = newUrl;
            return;
          }
        }
      }
    }
    
    // Estratégia final: Usar imagem padrão
    console.log('🖼️ Todas as tentativas falharam, usando imagem padrão');
    imgElement.src = 'assets/imagens/Ambrosio.png';
  }

  // Método auxiliar para debug das imagens
  debugImageUrl(produto: Produto) {
    console.log('LISTA-DETALHE - DEBUG Imagem:', {
      nomeProduto: produto.produto,
      categoria: produto.tipoProduto,
      imagemUrl: this.getProductImageUrl(produto)
    });
  }

  // Método para adicionar feedback visual aos botões
  private addClickFeedback(element: HTMLElement | null, type: 'edit' | 'delete') {
    if (!element) return;
    
    const button = element.closest('ion-button');
    if (!button) return;
    
    // Adicionar classe de animação
    button.classList.add('clicked');
    
    // Remover classe após animação
    setTimeout(() => {
      button.classList.remove('clicked');
    }, 300);
  }
}
