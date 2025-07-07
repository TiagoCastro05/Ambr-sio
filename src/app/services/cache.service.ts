import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject, Observable } from 'rxjs';
import { Lista, Produto } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private _storage: Storage | null = null;
  private listasSubject = new BehaviorSubject<Lista[]>([]);
  private produtosSubject = new BehaviorSubject<Produto[]>([]);
  private isInitialized = false;

  // Chaves para o armazenamento local
  private readonly LISTAS_KEY = 'cached_listas';
  private readonly PRODUTOS_KEY = 'cached_produtos';
  private readonly LAST_SYNC_KEY = 'last_sync_timestamp';
  private readonly USER_ID_KEY = 'current_user_id';

  constructor(private storage: Storage) {
    this.init();
  }

  async init() {
    if (this.isInitialized) return;
    
    // Criar a instância do storage
    const storage = await this.storage.create();
    this._storage = storage;
    this.isInitialized = true;
    
    console.log('CacheService inicializado');
    
    // Carregar dados salvos
    await this.loadCachedData();
  }

  // Garantir que o storage está inicializado
  private async ensureInitialized() {
    if (!this.isInitialized) {
      await this.init();
    }
  }

  // Carregar dados do cache local
  private async loadCachedData() {
    try {
      await this.ensureInitialized();
      
      const cachedListas = await this._storage?.get(this.LISTAS_KEY) || [];
      const cachedProdutos = await this._storage?.get(this.PRODUTOS_KEY) || [];
      
      console.log('Cache carregado:', {
        listas: cachedListas.length,
        produtos: cachedProdutos.length
      });
      
      this.listasSubject.next(cachedListas);
      this.produtosSubject.next(cachedProdutos);
      
    } catch (error) {
      console.error('Erro ao carregar cache:', error);
    }
  }

  // Salvar listas no cache
  async saveListas(listas: Lista[], userId: string) {
    try {
      await this.ensureInitialized();
      
      // Filtrar apenas listas do usuário atual
      const listasDoUsuario = listas.filter(lista => lista.userId === userId);
      
      await this._storage?.set(this.LISTAS_KEY, listasDoUsuario);
      await this._storage?.set(this.USER_ID_KEY, userId);
      await this._storage?.set(this.LAST_SYNC_KEY, new Date().toISOString());
      
      this.listasSubject.next(listasDoUsuario);
      
      console.log('Listas salvas no cache:', listasDoUsuario.length);
      
    } catch (error) {
      console.error('Erro ao salvar listas no cache:', error);
    }
  }

  // Salvar produtos no cache
  async saveProdutos(produtos: Produto[], userId: string) {
    try {
      await this.ensureInitialized();
      
      // Filtrar apenas produtos do usuário atual
      const produtosDoUsuario = produtos.filter(produto => produto.userId === userId);
      
      await this._storage?.set(this.PRODUTOS_KEY, produtosDoUsuario);
      await this._storage?.set(this.USER_ID_KEY, userId);
      await this._storage?.set(this.LAST_SYNC_KEY, new Date().toISOString());
      
      this.produtosSubject.next(produtosDoUsuario);
      
      console.log('Produtos salvos no cache:', produtosDoUsuario.length);
      
    } catch (error) {
      console.error('Erro ao salvar produtos no cache:', error);
    }
  }

  // Obter listas do cache
  getListas(): Observable<Lista[]> {
    return this.listasSubject.asObservable();
  }

  // Obter produtos do cache
  getProdutos(): Observable<Produto[]> {
    return this.produtosSubject.asObservable();
  }

  // Obter listas sincronamente (para casos específicos)
  async getListasSync(): Promise<Lista[]> {
    await this.ensureInitialized();
    return await this._storage?.get(this.LISTAS_KEY) || [];
  }

  // Obter produtos sincronamente (para casos específicos)
  async getProdutosSync(): Promise<Produto[]> {
    await this.ensureInitialized();
    return await this._storage?.get(this.PRODUTOS_KEY) || [];
  }

  // Adicionar uma nova lista ao cache
  async addLista(lista: Lista) {
    try {
      await this.ensureInitialized();
      
      const listasAtuais = this.listasSubject.value;
      const novasListas = [...listasAtuais, lista];
      
      await this._storage?.set(this.LISTAS_KEY, novasListas);
      this.listasSubject.next(novasListas);
      
      console.log('Lista adicionada ao cache:', lista.nome);
      
    } catch (error) {
      console.error('Erro ao adicionar lista ao cache:', error);
    }
  }

  // Atualizar uma lista no cache
  async updateLista(listaId: string, dadosAtualizados: Partial<Lista>) {
    try {
      await this.ensureInitialized();
      
      const listasAtuais = this.listasSubject.value;
      const listaIndex = listasAtuais.findIndex(l => l.id === listaId);
      
      if (listaIndex !== -1) {
        listasAtuais[listaIndex] = { ...listasAtuais[listaIndex], ...dadosAtualizados };
        
        await this._storage?.set(this.LISTAS_KEY, listasAtuais);
        this.listasSubject.next([...listasAtuais]);
        
        console.log('Lista atualizada no cache:', listaId);
      }
      
    } catch (error) {
      console.error('Erro ao atualizar lista no cache:', error);
    }
  }

  // Remover uma lista do cache
  async removeLista(listaId: string) {
    try {
      await this.ensureInitialized();
      
      const listasAtuais = this.listasSubject.value;
      const novasListas = listasAtuais.filter(l => l.id !== listaId);
      
      await this._storage?.set(this.LISTAS_KEY, novasListas);
      this.listasSubject.next(novasListas);
      
      console.log('Lista removida do cache:', listaId);
      
    } catch (error) {
      console.error('Erro ao remover lista do cache:', error);
    }
  }

  // Adicionar um produto ao cache
  async addProduto(produto: Produto) {
    try {
      await this.ensureInitialized();
      
      const produtosAtuais = this.produtosSubject.value;
      const novosProdutos = [...produtosAtuais, produto];
      
      await this._storage?.set(this.PRODUTOS_KEY, novosProdutos);
      this.produtosSubject.next(novosProdutos);
      
      console.log('Produto adicionado ao cache:', produto.produto);
      
    } catch (error) {
      console.error('Erro ao adicionar produto ao cache:', error);
    }
  }

  // Atualizar um produto no cache
  async updateProduto(produtoId: string, dadosAtualizados: Partial<Produto>) {
    try {
      await this.ensureInitialized();
      
      const produtosAtuais = this.produtosSubject.value;
      const produtoIndex = produtosAtuais.findIndex(p => p.id === produtoId);
      
      if (produtoIndex !== -1) {
        produtosAtuais[produtoIndex] = { ...produtosAtuais[produtoIndex], ...dadosAtualizados };
        
        await this._storage?.set(this.PRODUTOS_KEY, produtosAtuais);
        this.produtosSubject.next([...produtosAtuais]);
        
        console.log('Produto atualizado no cache:', produtoId);
      }
      
    } catch (error) {
      console.error('Erro ao atualizar produto no cache:', error);
    }
  }

  // Remover um produto do cache
  async removeProduto(produtoId: string) {
    try {
      await this.ensureInitialized();
      
      const produtosAtuais = this.produtosSubject.value;
      const novosProdutos = produtosAtuais.filter(p => p.id !== produtoId);
      
      await this._storage?.set(this.PRODUTOS_KEY, novosProdutos);
      this.produtosSubject.next(novosProdutos);
      
      console.log('Produto removido do cache:', produtoId);
      
    } catch (error) {
      console.error('Erro ao remover produto do cache:', error);
    }
  }

  // Limpar cache quando o usuário faz logout
  async clearUserData() {
    try {
      await this.ensureInitialized();
      
      await this._storage?.remove(this.LISTAS_KEY);
      await this._storage?.remove(this.PRODUTOS_KEY);
      await this._storage?.remove(this.USER_ID_KEY);
      await this._storage?.remove(this.LAST_SYNC_KEY);
      
      this.listasSubject.next([]);
      this.produtosSubject.next([]);
      
      console.log('Cache do usuário limpo');
      
    } catch (error) {
      console.error('Erro ao limpar cache do usuário:', error);
    }
  }

  // Verificar se há dados em cache
  async hasCachedData(): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      const listas = await this._storage?.get(this.LISTAS_KEY) || [];
      const produtos = await this._storage?.get(this.PRODUTOS_KEY) || [];
      
      return listas.length > 0 || produtos.length > 0;
      
    } catch (error) {
      console.error('Erro ao verificar cache:', error);
      return false;
    }
  }

  // Obter timestamp da última sincronização
  async getLastSyncTimestamp(): Promise<string | null> {
    try {
      await this.ensureInitialized();
      return await this._storage?.get(this.LAST_SYNC_KEY) || null;
    } catch (error) {
      console.error('Erro ao obter timestamp:', error);
      return null;
    }
  }

  // Obter ID do usuário em cache
  async getCachedUserId(): Promise<string | null> {
    try {
      await this.ensureInitialized();
      return await this._storage?.get(this.USER_ID_KEY) || null;
    } catch (error) {
      console.error('Erro ao obter user ID:', error);
      return null;
    }
  }
}
