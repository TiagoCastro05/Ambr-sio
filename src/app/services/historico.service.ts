import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

export interface HistoricoProduto {
  nome: string;
  quantidade: number;
  // add other fields if needed
}

@Injectable({ providedIn: 'root' })
export class HistoricoService {
  private historico: HistoricoProduto[] = [];

  constructor(private storage: Storage) {
    this.initStorage();
  }

  async initStorage() {
    await this.storage.create();
    await this.loadHistorico();
  }

  async loadHistorico() {
    const historico = await this.storage.get('historico');
    this.historico = historico || [];
  }

  async saveHistorico() {
    await this.storage.set('historico', this.historico);
  }

  async adicionar(produto: HistoricoProduto) {
    this.historico.push(produto);
    await this.saveHistorico();
  }

  getAll(): HistoricoProduto[] {
    return this.historico;
  }
}