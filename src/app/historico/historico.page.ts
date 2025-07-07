import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { HistoricoService, HistoricoProduto } from '../services/historico.service';
import { DebugService } from '../services/debug.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-historico',
  templateUrl: './historico.page.html',
  standalone: true,
  imports: [IonicModule, CommonModule] // Importação dos módulos necessários para o componente
})
export class HistoricoPage implements OnInit, OnDestroy {
  // Array que armazena o histórico de produtos (ex: compras ou listas anteriores)
  products: HistoricoProduto[] = [];
  private subscription: Subscription = new Subscription();
  private historicoPopulado = false; // Flag para evitar população repetida

  // Injecção do serviço de histórico através do construtor
  constructor(
    private historicoService: HistoricoService,
    private debugService: DebugService
  ) {}

  // Método chamado quando o componente é inicializado
  async ngOnInit() {
    console.log('HISTORICO-PAGE - Inicializando componente...');
    
    // Verificar estado de autenticação
    this.subscription.add(
      this.historicoService['afAuth'].authState.subscribe(user => {
        console.log('HISTORICO-PAGE - Estado de autenticação:', user ? 'Autenticado' : 'Não autenticado', user?.email);
      })
    );
    
    // Inicializa o armazenamento (storage) antes de usar os dados
    await this.historicoService.initStorage();
    
    // Carregar histórico
    await this.carregarHistorico();
  }

  async ionViewWillEnter() {
    console.log('HISTORICO-PAGE - Entrando na página...');
    // Recarregar sempre que entrar na página
    await this.carregarHistorico();
    
    // Sincronizar histórico automaticamente
    await this.sincronizarHistorico();
  }

  // Método para carregar histórico
  async carregarHistorico() {
    console.log('HISTORICO-PAGE - Carregando histórico...');
    
    try {
      // Aguardar um pouco para garantir autenticação
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Subscrever ao histórico
      this.subscription.add(
        this.historicoService.getAll().subscribe(
          products => {
            console.log('HISTORICO-PAGE - Produtos recebidos:', products.length, products);
            this.products = products;
            
            // Se não há produtos e ainda não foi populado automaticamente, tentar popular
            if (products.length === 0 && !this.historicoPopulado) {
              console.log('HISTORICO-PAGE - Histórico vazio, tentando popular automaticamente...');
              this.historicoPopulado = true; // Marcar como tentativa feita
              setTimeout(() => {
                this.popularHistoricoAutomatico();
              }, 1000);
            }
          },
          error => {
            console.error('HISTORICO-PAGE - Erro ao carregar histórico:', error);
          }
        )
      );
    } catch (error) {
      console.error('HISTORICO-PAGE - Erro ao configurar carregamento:', error);
    }
  }

  // Método para popular histórico automaticamente (sem alerta)
  async popularHistoricoAutomatico() {
    console.log('HISTORICO-PAGE - Populando histórico automaticamente...');
    
    try {
      const user = await this.debugService['afAuth'].currentUser;
      if (!user) {
        console.log('HISTORICO-PAGE - Usuário não autenticado para popular automaticamente');
        return;
      }

      // Buscar todos os produtos do usuário
      const produtosSnapshot = await this.debugService['firestore'].collection('produtos', ref => 
        ref.where('userId', '==', user.uid).limit(5) // Limitar para não sobrecarregar
      ).get().toPromise();

      if (produtosSnapshot?.docs.length) {
        console.log('HISTORICO-PAGE - Adicionando', produtosSnapshot.docs.length, 'produtos ao histórico...');
        
        for (const doc of produtosSnapshot.docs) {
          const data = doc.data() as any;
          
          await this.historicoService.adicionar({
            nome: data.produto || 'Produto',
            quantidade: data.quantidadeNumero || 1,
            listaNome: data.listaNome || 'Lista'
          });
        }
        
        console.log('HISTORICO-PAGE - Histórico populado automaticamente!');
      }
      
    } catch (error) {
      console.error('HISTORICO-PAGE - Erro ao popular automaticamente:', error);
    }
  }

  // Método para testar adição ao histórico
  async testarHistorico() {
    console.log('HISTORICO-PAGE - Testando adição ao histórico...');
    
    try {
      // Primeiro, testar conexão com Firebase
      await this.debugService.testarConexaoFirebase();
      
      await this.historicoService.adicionar({
        nome: 'Produto Teste',
        quantidade: 1,
        listaNome: 'Lista Teste'
      });
      console.log('HISTORICO-PAGE - Produto teste adicionado com sucesso');
    } catch (error) {
      console.error('HISTORICO-PAGE - Erro ao testar:', error);
    }
  }

  // Método para formatar datas de forma segura
  formatarData(data: any): string {
    try {
      if (!data) return 'Data não disponível';
      
      let dataFormatada: Date;
      
      if (data instanceof Date) {
        dataFormatada = data;
      } else if (typeof data === 'string') {
        dataFormatada = new Date(data);
      } else if (typeof data === 'object' && data.seconds) {
        // Firestore Timestamp
        dataFormatada = new Date(data.seconds * 1000);
      } else if (typeof data === 'object' && data.toDate) {
        // Firestore Timestamp com método toDate
        dataFormatada = data.toDate();
      } else {
        dataFormatada = new Date(data);
      }
      
      if (isNaN(dataFormatada.getTime())) {
        return 'Data inválida';
      }
      
      return dataFormatada.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Erro na data';
    }
  }

  // Método para testar conexão
  async testarConexao() {
    console.log('HISTORICO-PAGE - Testando conexão...');
    
    try {
      await this.debugService.testarConexaoFirebase();
      console.log('HISTORICO-PAGE - Teste de conexão concluído');
    } catch (error) {
      console.error('HISTORICO-PAGE - Erro no teste de conexão:', error);
    }
  }

  // Método para popular o histórico com produtos existentes
  async popularHistorico() {
    console.log('HISTORICO-PAGE - Populando histórico...');
    
    try {
      // Usar o debugService para obter os produtos
      const user = await this.debugService['afAuth'].currentUser;
      if (!user) {
        console.log('HISTORICO-PAGE - Usuário não autenticado');
        return;
      }

      // Buscar todos os produtos do usuário
      const produtosSnapshot = await this.debugService['firestore'].collection('produtos', ref => 
        ref.where('userId', '==', user.uid)
      ).get().toPromise();

      console.log('HISTORICO-PAGE - Produtos encontrados para popular:', produtosSnapshot?.docs.length || 0);

      if (produtosSnapshot?.docs.length) {
        for (const doc of produtosSnapshot.docs) {
          const data = doc.data() as any;
          
          // Adicionar cada produto ao histórico
          await this.historicoService.adicionar({
            nome: data.produto || 'Produto',
            quantidade: data.quantidadeNumero || 1,
            listaNome: data.listaNome || 'Lista'
          });
          
          console.log('HISTORICO-PAGE - Produto adicionado ao histórico:', data.produto);
        }
        
        console.log('HISTORICO-PAGE - Histórico populado com sucesso!');
      } else {
        console.log('HISTORICO-PAGE - Nenhum produto encontrado para popular');
      }
      
    } catch (error) {
      console.error('HISTORICO-PAGE - Erro ao popular histórico:', error);
    }
  }

  // Método para debug - listar todos os itens do histórico
  async debugHistorico() {
    console.log('HISTORICO-PAGE - DEBUG: Verificando histórico no Firebase...');
    
    try {
      const user = await this.debugService['afAuth'].currentUser;
      if (!user) {
        console.log('HISTORICO-PAGE - DEBUG: Usuário não autenticado');
        return;
      }

      console.log('HISTORICO-PAGE - DEBUG: Usuário autenticado:', user.uid);

      // Buscar TODOS os documentos da coleção historico para este usuário
      const historicoSnapshot = await this.debugService['firestore'].collection('historico', ref => 
        ref.where('userId', '==', user.uid)
      ).get().toPromise();

      console.log('HISTORICO-PAGE - DEBUG: Total de documentos encontrados:', historicoSnapshot?.docs.length || 0);

      if (historicoSnapshot?.docs.length) {
        historicoSnapshot.docs.forEach((doc, index) => {
          const data = doc.data() as any;
          console.log(`HISTORICO-PAGE - DEBUG: Documento ${index + 1}:`, {
            id: doc.id,
            nome: data.nome,
            quantidade: data.quantidade,
            listaNome: data.listaNome,
            data: data.data ? data.data.toDate() : 'sem data',
            userId: data.userId
          });
        });
      } else {
        console.log('HISTORICO-PAGE - DEBUG: Nenhum documento encontrado na coleção historico');
        
        // Verificar se há produtos na coleção produtos
        const produtosSnapshot = await this.debugService['firestore'].collection('produtos', ref => 
          ref.where('userId', '==', user.uid)
        ).get().toPromise();
        
        console.log('HISTORICO-PAGE - DEBUG: Total de produtos encontrados:', produtosSnapshot?.docs.length || 0);
        
        if (produtosSnapshot?.docs.length) {
          produtosSnapshot.docs.forEach((doc, index) => {
            const data = doc.data() as any;
            console.log(`HISTORICO-PAGE - DEBUG: Produto ${index + 1}:`, {
              id: doc.id,
              produto: data.produto,
              listaNome: data.listaNome,
              quantidade: data.quantidadeNumero,
              quantidadeConsumida: data.quantidadeConsumida
            });
          });
        }
      }
      
    } catch (error) {
      console.error('HISTORICO-PAGE - DEBUG: Erro ao verificar histórico:', error);
    }
  }

  // Método para sincronizar todos os produtos existentes com o histórico (automático)
  async sincronizarHistorico() {
    try {
      const user = await this.debugService['afAuth'].currentUser;
      if (!user) {
        return;
      }

      // Buscar todos os produtos do usuário
      const produtosSnapshot = await this.debugService['firestore'].collection('produtos', ref => 
        ref.where('userId', '==', user.uid)
      ).get().toPromise();

      if (produtosSnapshot?.docs.length) {
        let adicionados = 0;
        
        for (const doc of produtosSnapshot.docs) {
          const data = doc.data() as any;
          
          try {
            // Verificar se já existe no histórico
            const existingSnapshot = await this.debugService['firestore'].collection('historico', ref => 
              ref.where('userId', '==', user.uid)
                 .where('nome', '==', data.produto)
                 .where('listaNome', '==', data.listaNome)
            ).get().toPromise();

            if (!existingSnapshot || existingSnapshot.docs.length === 0) {
              // Não existe no histórico, adicionar
              await this.debugService['firestore'].collection('historico').add({
                nome: data.produto || 'Produto',
                quantidade: data.quantidadeNumero || 0,
                listaNome: data.listaNome || 'Lista',
                userId: user.uid,
                data: new Date()
              });
              
              adicionados++;
            }
          } catch (error) {
            console.error('HISTORICO-PAGE - Erro ao sincronizar produto:', data.produto, error);
          }
        }
        
        if (adicionados > 0) {
          console.log('HISTORICO-PAGE - Sincronização automática concluída. Produtos adicionados:', adicionados);
        }
      }
      
    } catch (error) {
      console.error('HISTORICO-PAGE - Erro na sincronização automática:', error);
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
