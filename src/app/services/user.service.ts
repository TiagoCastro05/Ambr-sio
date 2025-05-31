import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

export interface User {
  nome?: string;
  email?: string;
  telefone?: string;
  password?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private _storage: Storage | null = null;
  private _ready: Promise<void>;
  user: User = {};

  constructor(private storage: Storage) {
    this._ready = this.init();
  }

  private async init() {
    this._storage = await this.storage.create();
    const storedUser = await this._storage.get('user');
    if (storedUser) {
      this.user = storedUser;
    }
  }

  async setUser(user: User) {
    await this._ready;
    this.user = user;
    await this._storage?.set('user', user);
  }

  async getUser(): Promise<User> {
    await this._ready;
    if (!this.user.nome) {
      const storedUser = await this._storage?.get('user');
      if (storedUser) {
        this.user = storedUser;
      }
    }
    return this.user;
  }
}