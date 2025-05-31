import { Component, OnInit } from '@angular/core';
import { ListService, Product } from '../services/list.service';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-historico',
  templateUrl: './historico.page.html',
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class HistoricoPage implements OnInit {
  products: Product[] = [];

  constructor(private listService: ListService) {}

  ngOnInit() {
    this.products = this.listService.getAllProducts();
  }
}