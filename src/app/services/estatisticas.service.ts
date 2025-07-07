import { Injectable } from '@angular/core';
import { FirebaseService, Lista, Produto } from './firebase.service';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

export interface EstatisticaLista {
  lista: Lista;
  nivel: 'Anti-Ambrósio' | 'Ambrósio' | 'Super-Ambrósio';
  percentualConsumo: number;
  detalhes: {
    totalProdutos: number;
    produtosComConsumo: number;
    mediaConsumo: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class EstatisticasService {

  constructor(private firebaseService: FirebaseService) {}

  // Calcula as estatísticas de todas as listas
  async getEstatisticasListas(): Promise<EstatisticaLista[]> {
    try {
      console.log('ESTATISTICAS - Iniciando carregamento...');
      
      // Verificar se há usuário autenticado com retry
      let currentUser = await this.firebaseService['afAuth'].currentUser;
      
      if (!currentUser) {
        console.log('ESTATISTICAS - Aguardando autenticação...');
        // Aguardar até 3 segundos pela autenticação
        await new Promise(resolve => setTimeout(resolve, 1000));
        currentUser = await this.firebaseService['afAuth'].currentUser;
      }
      
      if (!currentUser) {
        console.log('ESTATISTICAS - Nenhum usuário autenticado após retry');
        return [];
      }
      
      console.log('ESTATISTICAS - Usuário autenticado:', currentUser.email);
      
      // Tentar obter listas com timeout menor
      const listas = await Promise.race([
        this.firebaseService.getListas().pipe(take(1)).toPromise(),
        new Promise<Lista[]>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout ao carregar listas')), 10000)
        )
      ]);
      
      console.log('ESTATISTICAS - Listas carregadas:', listas?.length || 0, listas);
      
      if (!listas || listas.length === 0) {
        console.log('ESTATISTICAS - Nenhuma lista encontrada');
        return [];
      }
      
      const estatisticas: EstatisticaLista[] = [];
      
      // Processar cada lista sequencialmente para evitar sobrecarga
      for (const lista of listas) {
        try {
          console.log('ESTATISTICAS - Processando lista:', lista.nome);
          
          const produtos = await Promise.race([
            this.firebaseService.getProdutosByLista(lista.nome).pipe(take(1)).toPromise(),
            new Promise<Produto[]>((_, reject) => 
              setTimeout(() => reject(new Error('Timeout ao carregar produtos')), 8000)
            )
          ]);
          
          console.log('ESTATISTICAS - Produtos da lista', lista.nome, ':', produtos?.length || 0);
          
          const estatistica = this.calcularEstatisticaLista(lista, produtos || []);
          estatisticas.push(estatistica);
          
        } catch (error) {
          console.error('ESTATISTICAS - Erro ao processar lista', lista.nome, ':', error);
          // Retornar estatística vazia em caso de erro
          const estatistica = this.calcularEstatisticaLista(lista, []);
          estatisticas.push(estatistica);
        }
      }
      
      console.log('ESTATISTICAS - Estatísticas calculadas:', estatisticas.length, estatisticas);
      return estatisticas;
      
    } catch (error) {
      console.error('ESTATISTICAS - Erro ao carregar estatísticas:', error);
      return [];
    }
  }

  // Calcula a estatística de uma lista específica
  private calcularEstatisticaLista(lista: Lista, produtos: Produto[]): EstatisticaLista {
    console.log('ESTATISTICAS - Calculando estatística para lista:', lista.nome);
    console.log('ESTATISTICAS - Produtos recebidos:', produtos.length, produtos);
    
    if (produtos.length === 0) {
      console.log('ESTATISTICAS - Nenhum produto na lista:', lista.nome);
      return {
        lista,
        nivel: 'Ambrósio',
        percentualConsumo: 0,
        detalhes: {
          totalProdutos: 0,
          produtosComConsumo: 0,
          mediaConsumo: 0
        }
      };
    }

    let somaPercentuais = 0;
    let produtosComConsumo = 0;

    for (const produto of produtos) {
      const quantidadeOriginal = produto.quantidadeNumero || 0;
      const quantidadeConsumida = produto.quantidadeConsumida || 0;
      
      console.log('ESTATISTICAS - Produto:', produto.produto, 'Original:', quantidadeOriginal, 'Consumida:', quantidadeConsumida);
      
      if (quantidadeOriginal > 0) {
        const percentual = (quantidadeConsumida / quantidadeOriginal) * 100;
        somaPercentuais += percentual;
        produtosComConsumo++;
        console.log('ESTATISTICAS - Percentual calculado:', percentual, '%');
      } else {
        console.log('ESTATISTICAS - Produto sem quantidade original válida');
      }
    }

    const mediaConsumo = produtosComConsumo > 0 ? somaPercentuais / produtosComConsumo : 0;
    const nivel = this.determinarNivel(mediaConsumo);

    console.log('ESTATISTICAS - Resultado final:', {
      lista: lista.nome,
      nivel,
      mediaConsumo,
      produtosComConsumo,
      totalProdutos: produtos.length
    });

    return {
      lista,
      nivel,
      percentualConsumo: mediaConsumo,
      detalhes: {
        totalProdutos: produtos.length,
        produtosComConsumo,
        mediaConsumo
      }
    };
  }

  // Determina o nível baseado na média de consumo
  private determinarNivel(mediaConsumo: number): 'Anti-Ambrósio' | 'Ambrósio' | 'Super-Ambrósio' {
    console.log('ESTATISTICAS - Determinando nível para média de consumo:', mediaConsumo);
    
    if (mediaConsumo === 0) {
      console.log('ESTATISTICAS - Nível: Super-Ambrósio (0% consumo)');
      return 'Super-Ambrósio'; // Não consumiu nada ainda
    } else if (mediaConsumo <= 80) {
      console.log('ESTATISTICAS - Nível: Super-Ambrósio (<=80% consumo)');
      return 'Super-Ambrósio'; // Consumiu 80% ou menos = Bom (não desperdiça)
    } else if (mediaConsumo <= 110) {
      console.log('ESTATISTICAS - Nível: Ambrósio (81-110% consumo)');
      return 'Ambrósio'; // Consumiu entre 81% e 110% = Normal
    } else {
      console.log('ESTATISTICAS - Nível: Anti-Ambrósio (>110% consumo)');
      return 'Anti-Ambrósio'; // Consumiu mais de 110% = Mau (desperdício/consumo excessivo)
    }
  }

  // Retorna a cor do nível
  getCorNivel(nivel: 'Anti-Ambrósio' | 'Ambrósio' | 'Super-Ambrósio'): string {
    switch (nivel) {
      case 'Super-Ambrósio':
        return '#28a745'; // Verde
      case 'Ambrósio':
        return '#ffc107'; // Amarelo
      case 'Anti-Ambrósio':
        return '#dc3545'; // Vermelho
      default:
        return '#6c757d'; // Cinza
    }
  }

  // Retorna a descrição do nível
  getDescricaoNivel(nivel: 'Anti-Ambrósio' | 'Ambrósio' | 'Super-Ambrósio'): string {
    switch (nivel) {
      case 'Super-Ambrósio':
        return 'Consumo controlado e sem desperdício!';
      case 'Ambrósio':
        return 'Consumo dentro do esperado.';
      case 'Anti-Ambrósio':
        return 'Consumo excessivo, atenção!';
      default:
        return '';
    }
  }
}
