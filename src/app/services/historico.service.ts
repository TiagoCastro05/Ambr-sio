import { Injectable } from '@angular/core';

export interface HistoricoProduto {
  nome: string;
  quantidade: number;
  // add other fields if needed
}

@Injectable({ providedIn: 'root' })
export class HistoricoService {
  private historico: HistoricoProduto[] = [];

  adicionar(produto: HistoricoProduto) {
    this.historico.push(produto);
  }

  getAll(): HistoricoProduto[] {
    return this.historico;
  }
}