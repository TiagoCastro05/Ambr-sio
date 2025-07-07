import { Injectable } from '@angular/core';
import { Keyboard } from '@capacitor/keyboard';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class KeyboardService {
  private keyboardHeight = 0;
  private isKeyboardOpen = false;

  constructor(private platform: Platform) {
    this.initializeKeyboardListeners();
  }

  private initializeKeyboardListeners() {
    if (this.platform.is('capacitor')) {
      // Listener para quando o teclado abre
      Keyboard.addListener('keyboardWillShow', (info) => {
        this.keyboardHeight = info.keyboardHeight;
        this.isKeyboardOpen = true;
        document.body.classList.add('keyboard-is-open');
        console.log('Teclado aberto, altura:', info.keyboardHeight);
      });

      // Listener para quando o teclado fecha
      Keyboard.addListener('keyboardWillHide', () => {
        this.keyboardHeight = 0;
        this.isKeyboardOpen = false;
        document.body.classList.remove('keyboard-is-open');
        console.log('Teclado fechado');
      });
    }
  }

  // Método para fazer scroll suave para um elemento
  scrollToElement(element: HTMLElement, offset = 20) {
    if (!element) return;

    setTimeout(() => {
      const elementRect = element.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const finalOffset = elementRect.top + scrollTop - offset;

      window.scrollTo({
        top: finalOffset,
        behavior: 'smooth'
      });
    }, 300);
  }

  // Método para fazer scroll para um input específico
  scrollToInput(inputElement: HTMLIonInputElement | HTMLIonSelectElement) {
    if (!inputElement) return;

    setTimeout(() => {
      const nativeElement = inputElement as any;
      const element = nativeElement.el || nativeElement;
      
      if (element && element.scrollIntoView) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 300);
  }

  // Getters para o estado do teclado
  get isOpen(): boolean {
    return this.isKeyboardOpen;
  }

  get height(): number {
    return this.keyboardHeight;
  }

  // Método para configurar o resize do teclado
  setKeyboardResize(mode: 'ionic' | 'native' | 'none') {
    if (this.platform.is('capacitor')) {
      Keyboard.setResizeMode({ mode: mode as any });
    }
  }

  // Método para mostrar/esconder o teclado
  async show() {
    if (this.platform.is('capacitor')) {
      await Keyboard.show();
    }
  }

  async hide() {
    if (this.platform.is('capacitor')) {
      await Keyboard.hide();
    }
  }
}
