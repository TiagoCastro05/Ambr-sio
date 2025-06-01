import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { HistoricoService, HistoricoProduto } from '../services/historico.service';

@Component({
  selector: 'app-historico',
  templateUrl: './historico.page.html',
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class HistoricoPage implements OnInit {
  products: HistoricoProduto[] = [];

  constructor(private historicoService: HistoricoService) {}

  async ngOnInit() {
    await this.historicoService.initStorage(); // Ensure storage is ready
    this.products = this.historicoService.getAll();
  }
}