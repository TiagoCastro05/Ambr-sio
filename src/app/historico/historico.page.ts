import { Component, OnInit } from '@angular/core';
import { ListService, Product } from '../services/list.service';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { HistoricoService } from '../services/historico.service';

@Component({
  selector: 'app-historico',
  templateUrl: './historico.page.html',
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class HistoricoPage implements OnInit {
  products: any[] = [];

  constructor(private historicoService: HistoricoService) {}

  ngOnInit() {
    this.products = this.historicoService.getAll();
  }
}