import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

/**
 * Componente da página inicial (Tab1).
 * Mostra slideshow, notificações e navegação para outras secções da app.
 */
@Component({
  selector: 'app-tab1',
  templateUrl: './tab1.page.html',
  styleUrls: ['./tab1.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class Tab1Page implements OnInit, OnDestroy {
  // Lista de imagens para o slideshow
  images: string[] = [
    'assets/imagens/doce.png',
    'assets/imagens/folheto.png',
    'assets/imagens/pingo.png'
  ];
  // Índice da imagem atualmente visível no slideshow
  currentImageIndex = 0;
  // ID do intervalo para o slideshow automático
  intervalId: any;

  // Estado das notificações (ativo/inativo)
  notificationsActive = false;

  constructor(private router: Router) {}

  /**
   * Inicia o slideshow ao entrar na página.
   */
  ngOnInit() {
    this.intervalId = setInterval(() => {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
    }, 7000);
  }

  /**
   * Limpa o intervalo do slideshow ao sair da página.
   */
  ngOnDestroy() {
    clearInterval(this.intervalId);
  }

  /**
   * Ativa ou desativa as notificações.
   */
  toggleNotifications() {
    this.notificationsActive = !this.notificationsActive;
    console.log(
      this.notificationsActive
        ? 'Notificações ativadas'
        : 'Notificações desativadas'
    );
  }

  /**
   * Mostra uma notificação (placeholder para lógica futura).
   */
  showNotification() {
    console.log('Notificação clicada!');
    // Adicione aqui a lógica real de notificação
  }

  /**
   * Navega para a página de Listas (Tab4).
   */
  goToListas() {
    this.router.navigate(['/tabs/tab4']);
  }

  /**
   * Navega para o histórico.
   * @param event Evento do clique (para remover o foco do botão)
   */
  goToHistorico(event: Event) {
    (event.target as HTMLElement).blur();
    this.router.navigate(['/historico']);
  }

  /**
   * Navega para o perfil do utilizador (Tab5).
   */
  goToTab5() {
    this.router.navigate(['/tabs/tab5']);
  }

  /**
   * Navega para a página de estatísticas.
   */
  goToEstatisticas() {
    this.router.navigate(['/tabs/estatisticas']);
  }
}