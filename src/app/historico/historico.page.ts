import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { HistoricoService, HistoricoProduto } from '../services/historico.service';
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

  // Injecção do serviço de histórico através do construtor
  constructor(private historicoService: HistoricoService) {}

  // Método chamado quando o componente é inicializado
  async ngOnInit() {
    // Inicializa o armazenamento (storage) antes de usar os dados
    await this.historicoService.initStorage();
    
    // Subscreve ao histórico e obtém todos os produtos
    this.subscription.add(
      this.historicoService.getAll().subscribe(
        products => {
          this.products = products;
        },
        error => {
          console.error('Erro ao carregar histórico:', error);
        }
      )
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
