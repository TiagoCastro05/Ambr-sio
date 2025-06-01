import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { HistoricoService } from '../services/historico.service';
import { Storage } from '@ionic/storage-angular';

interface Produto {
  loja: string;
  tipoProduto: string;
  produto: string;
  quantidade: string;
  validade: string;
  preco: string;
}

@Component({
  selector: 'app-lista-detalhe',
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule],
  templateUrl: './lista-detalhe.page.html',
  styleUrls: ['./lista-detalhe.page.scss'],
})
export class ListaDetalhePage {
  nomeLista = '';
  showProductOptions = false;
  showManualForm = false;

  // Manual product fields
  loja = '';
  tipoProduto = '';
  produto = '';
  quantidade = '';
  validade = '';
  preco = '';

  produtos: Produto[] = [];

  constructor(
    private historicoService: HistoricoService,
    private route: ActivatedRoute,
    private router: Router,
    private storage: Storage // <-- add this
  ) {
    this.nomeLista = this.route.snapshot.paramMap.get('nome') || '';
    this.initStorage();
  }

  async initStorage() {
    await this.storage.create();
    await this.loadProdutos();
  }

  async loadProdutos() {
    const produtos = await this.storage.get(`produtos_${this.nomeLista}`);
    this.produtos = produtos || [];
  }

  async saveProdutos() {
    await this.storage.set(`produtos_${this.nomeLista}`, this.produtos);
  }

  onAdicionarProdutos() {
    this.showProductOptions = true;
  }

  onManual() {
    this.showManualForm = true;
    this.showProductOptions = false;
  }

  onScan() {
    this.router.navigate(['/tabs/tab3']);
  }

  async onSaveManual() {
    if (
      this.loja.trim() &&
      this.tipoProduto.trim() &&
      this.produto.trim() &&
      this.quantidade.trim() &&
      this.validade.trim() &&
      this.preco.trim()
    ) {
      this.produtos.push({
        loja: this.loja,
        tipoProduto: this.tipoProduto,
        produto: this.produto,
        quantidade: this.quantidade,
        validade: this.validade,
        preco: this.preco,
      });

      await this.saveProdutos(); // <-- persist to storage

      // Add to historico with correct types
      this.historicoService.adicionar({
        nome: this.produto,
        quantidade: Number(this.quantidade)
      });

      this.showManualForm = false;
      // Reset fields
      this.loja = '';
      this.tipoProduto = '';
      this.produto = '';
      this.quantidade = '';
      this.validade = '';
      this.preco = '';
    }
  }
}