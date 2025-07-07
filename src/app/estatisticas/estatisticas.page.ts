import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EstatisticasService, EstatisticaLista } from '../services/estatisticas.service';
import { DebugService } from '../services/debug.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-estatisticas',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './estatisticas.page.html',
  styleUrls: ['./estatisticas.page.scss'],
})
export class EstatisticasPage implements OnInit {
  estatisticas: EstatisticaLista[] = [];
  isLoading = true;
  hasError = false;
  errorMessage = '';
  produtosExpandidos: { [listaNome: string]: boolean } = {};
  produtosPorLista: { [listaNome: string]: any[] } = {};
  private debounceTimer: any;

  constructor(
    private estatisticasService: EstatisticasService,
    private debugService: DebugService
  ) {}

  async ngOnInit() {
    console.log('ESTATISTICAS-PAGE - Iniciando componente...');
    
    // Verificar autenticação
    this.estatisticasService['firebaseService']['afAuth'].authState.subscribe(user => {
      console.log('ESTATISTICAS-PAGE - Estado de autenticação:', user ? 'Autenticado' : 'Não autenticado', user?.email);
    });
    
    // Recarregar sempre que a página for inicializada
    await this.recarregarAutomatico();
  }

  async ionViewWillEnter() {
    console.log('ESTATISTICAS-PAGE - Entrando na página...');
    // Recarregar sempre que entrar na página
    await this.recarregarAutomatico();
  }

  // Método para recarregamento automático
  async recarregarAutomatico() {
    console.log('ESTATISTICAS-PAGE - Iniciando recarregamento automático...');
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';
    
    try {
      // Aguardar um pouco para garantir que a autenticação está pronta
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Forçar refresh da autenticação e dados
      await this.estatisticasService['firebaseService'].forceRefreshAuth();
      
      // Tentar várias vezes se necessário
      let tentativas = 0;
      let estatisticas: EstatisticaLista[] = [];
      
      while (tentativas < 3 && estatisticas.length === 0) {
        tentativas++;
        console.log('ESTATISTICAS-PAGE - Tentativa', tentativas, 'de carregamento...');
        
        try {
          estatisticas = await this.estatisticasService.getEstatisticasListas();
          console.log('ESTATISTICAS-PAGE - Estatísticas carregadas na tentativa', tentativas, ':', estatisticas.length);
          
          // Se carregou estatísticas, organizar produtos por lista para interface
          if (estatisticas.length > 0) {
            this.organizarProdutosPorLista(estatisticas);
          }
        } catch (error) {
          console.error('ESTATISTICAS-PAGE - Erro na tentativa', tentativas, ':', error);
          if (tentativas < 3) {
            await new Promise(resolve => setTimeout(resolve, 800));
          }
        }
      }
      
      this.estatisticas = estatisticas;
      
      if (estatisticas.length === 0) {
        console.log('ESTATISTICAS-PAGE - Nenhuma estatística carregada após todas as tentativas');
      }
      
    } catch (error) {
      console.error('ESTATISTICAS-PAGE - Erro no recarregamento automático:', error);
      this.hasError = true;
      this.errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    } finally {
      this.isLoading = false;
    }
  }

  // Método para organizar produtos por lista (garante dados atualizados)
  private async organizarProdutosPorLista(estatisticas: EstatisticaLista[]) {
    this.produtosPorLista = {};
    
    for (const estatistica of estatisticas) {
      try {
        // Buscar produtos mais recentes diretamente do Firebase
        const produtos = await this.estatisticasService['firebaseService']
          .getProdutosByLista(estatistica.lista.nome)
          .pipe(take(1))
          .toPromise();
        
        if (produtos && produtos.length > 0) {
          this.produtosPorLista[estatistica.lista.nome] = produtos;
          console.log('ESTATISTICAS-PAGE - Produtos atualizados para lista', estatistica.lista.nome, ':', produtos.length);
        }
      } catch (error) {
        console.error('ESTATISTICAS-PAGE - Erro ao buscar produtos atualizados para lista', estatistica.lista.nome, ':', error);
      }
    }
  }

  async carregarEstatisticas() {
    try {
      console.log('ESTATISTICAS-PAGE - Iniciando carregamento...');
      this.isLoading = true;
      this.hasError = false;
      this.errorMessage = '';
      
      // Adicionar timeout para evitar loading infinito
      const timeoutPromise = new Promise<EstatisticaLista[]>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout - Carregamento demorou muito')), 15000); // 15 segundos
      });
      
      const estatisticasPromise = this.estatisticasService.getEstatisticasListas();
      
      this.estatisticas = await Promise.race([estatisticasPromise, timeoutPromise]);
      
      console.log('ESTATISTICAS-PAGE - Carregadas:', this.estatisticas);
    } catch (error) {
      console.error('ESTATISTICAS-PAGE - Erro ao carregar:', error);
      this.hasError = true;
      this.errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.estatisticas = [];
    } finally {
      this.isLoading = false;
    }
  }

  getCorNivel(nivel: 'Anti-Ambrósio' | 'Ambrósio' | 'Super-Ambrósio'): string {
    return this.estatisticasService.getCorNivel(nivel);
  }

  getDescricaoNivel(nivel: 'Anti-Ambrósio' | 'Ambrósio' | 'Super-Ambrósio'): string {
    return this.estatisticasService.getDescricaoNivel(nivel);
  }

  // Método para testar o carregamento das estatísticas
  async testarEstatisticas() {
    console.log('ESTATISTICAS-PAGE - Iniciando teste de carregamento...');
    
    try {
      // Primeiro, testar conexão com Firebase
      await this.debugService.testarConexaoFirebase();
      
      // Testar se usuário está autenticado
      const user = await this.estatisticasService['firebaseService']['afAuth'].currentUser;
      console.log('ESTATISTICAS-PAGE - Usuário:', user?.email);
      
      if (!user) {
        console.log('ESTATISTICAS-PAGE - Usuário não autenticado');
        return;
      }
      
      // Testar carregamento de listas
      const listas = await this.estatisticasService['firebaseService'].getListas().pipe(take(1)).toPromise();
      console.log('ESTATISTICAS-PAGE - Listas encontradas:', listas);
      
      // Testar carregamento de produtos para cada lista
      if (listas && Array.isArray(listas) && listas.length > 0) {
        for (const lista of listas) {
          const produtos = await this.estatisticasService['firebaseService'].getProdutosByLista(lista.nome).pipe(take(1)).toPromise();
          console.log('ESTATISTICAS-PAGE - Produtos da lista', lista.nome, ':', produtos);
        }
      }
      
      // Recarregar estatísticas após teste
      await this.carregarEstatisticas();
      
    } catch (error) {
      console.error('ESTATISTICAS-PAGE - Erro no teste:', error);
    }
  }

  // Método para forçar recarregamento
  async forcarRecarregamento() {
    console.log('ESTATISTICAS-PAGE - Forçando recarregamento...');
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';
    
    try {
      // Aguardar um pouco para garantir que o Firebase está pronto
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const estatisticas = await this.estatisticasService.getEstatisticasListas();
      console.log('ESTATISTICAS-PAGE - Estatísticas carregadas:', estatisticas);
      
      this.estatisticas = estatisticas;
    } catch (error) {
      console.error('ESTATISTICAS-PAGE - Erro ao forçar recarregamento:', error);
      this.hasError = true;
      this.errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    } finally {
      this.isLoading = false;
    }
  }

  // Método para teste de conexão completa
  async testarConexaoCompleta() {
    console.log('ESTATISTICAS-PAGE - Iniciando teste de conexão completa...');
    
    try {
      await this.debugService.testarConexaoFirebase();
      console.log('ESTATISTICAS-PAGE - Teste de conexão completa concluído');
    } catch (error) {
      console.error('ESTATISTICAS-PAGE - Erro no teste de conexão completa:', error);
    }
  }

  // Método para expandir/contrair produtos de uma lista
  toggleProdutos(listaNome: string) {
    this.produtosExpandidos[listaNome] = !this.produtosExpandidos[listaNome];
    
    // Se está expandindo, sempre carregar produtos mais recentes
    if (this.produtosExpandidos[listaNome]) {
      this.carregarProdutosDaLista(listaNome);
    }
  }

  // Método para carregar produtos de uma lista específica (sempre atualizado)
  async carregarProdutosDaLista(listaNome: string) {
    console.log('ESTATISTICAS-PAGE - Carregando produtos atualizados da lista:', listaNome);
    
    try {
      // Sempre buscar dados mais recentes, não usar cache
      const produtos = await this.estatisticasService['firebaseService']
        .getProdutosByLista(listaNome)
        .pipe(take(1))
        .toPromise();
      
      if (produtos) {
        this.produtosPorLista[listaNome] = produtos;
        console.log('ESTATISTICAS-PAGE - Produtos atualizados carregados para', listaNome, ':', produtos.length);
        
        // Log dos valores atuais para debug
        produtos.forEach(produto => {
          console.log('ESTATISTICAS-PAGE - Produto:', produto.produto, 
            'Quantidade Total:', produto.quantidade, 
            'Quantidade Consumida:', produto.quantidadeConsumida || 0);
        });
      } else {
        this.produtosPorLista[listaNome] = [];
        console.log('ESTATISTICAS-PAGE - Nenhum produto encontrado para a lista:', listaNome);
      }
    } catch (error) {
      console.error('ESTATISTICAS-PAGE - Erro ao carregar produtos da lista:', listaNome, error);
      this.produtosPorLista[listaNome] = [];
    }
  }

  // Método para atualizar quantidade consumida
  async atualizarQuantidadeConsumida(produtoId: string, novaQuantidade: number | string) {
    const quantidade = typeof novaQuantidade === 'string' ? parseFloat(novaQuantidade) || 0 : novaQuantidade || 0;
    console.log('ESTATISTICAS-PAGE - Atualizando quantidade consumida:', produtoId, quantidade);
    
    try {
      await this.estatisticasService['firebaseService']
        .updateQuantidadeConsumida(produtoId, quantidade);
      
      console.log('ESTATISTICAS-PAGE - Quantidade consumida atualizada com sucesso');
      
      // Atualizar localmente o produto na lista para refletir imediatamente
      for (const listaNome in this.produtosPorLista) {
        const produtos = this.produtosPorLista[listaNome];
        const produto = produtos.find(p => p.id === produtoId);
        if (produto) {
          produto.quantidadeConsumida = quantidade;
          console.log('ESTATISTICAS-PAGE - Produto atualizado localmente:', produto);
          break;
        }
      }
      
      // Usar debounce para evitar muitas atualizações seguidas
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
      
      this.debounceTimer = setTimeout(() => {
        this.recarregarAutomatico();
      }, 800);
      
    } catch (error) {
      console.error('ESTATISTICAS-PAGE - Erro ao atualizar quantidade consumida:', error);
    }
  }

  // Método para calcular percentual de um produto específico
  calcularPercentualProduto(produto: any): number {
    const quantidadeOriginal = produto.quantidadeNumero || 0;
    const quantidadeConsumida = produto.quantidadeConsumida || 0;
    
    if (quantidadeOriginal === 0) return 0;
    
    return Math.round((quantidadeConsumida / quantidadeOriginal) * 100);
  }

  // Método para obter cor do percentual
  getCorPercentual(produto: any): string {
    const percentual = this.calcularPercentualProduto(produto);
    
    if (percentual <= 80) {
      return '#28a745'; // Verde
    } else if (percentual <= 110) {
      return '#ffc107'; // Amarelo
    } else {
      return '#dc3545'; // Vermelho
    }
  }
}
