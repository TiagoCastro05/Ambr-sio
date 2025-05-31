import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UserService {
  user: { nome?: string; email?: string; telefone?: string } = {
    nome: 'Nome do Utilizador',
    email: 'email@exemplo.com',
    telefone: '912345678'
  };

  color: string = '#fff'; // default white

  setUser(user: { nome: string; email: string; telefone: string }) {
    this.user = user;
  }

  getUser() {
    return this.user;
  }

  setColor(color: string) {
    this.color = color;
  }

  getColor() {
    return this.color;
  }
}