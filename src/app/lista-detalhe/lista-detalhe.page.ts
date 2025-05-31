import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { HistoricoService } from '../services/historico.service';

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
    private router: Router
  ) {
    this.nomeLista = this.route.snapshot.paramMap.get('nome') || '';
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

 onSaveManual() {
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