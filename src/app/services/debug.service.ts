import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DebugService {

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore
  ) {}

  async testarConexaoFirebase(): Promise<void> {
    console.log('DEBUG - Iniciando teste de conexão com Firebase...');
    
    try {
      // Teste 1: Verificar autenticação
      const user = await this.afAuth.currentUser;
      console.log('DEBUG - Usuário atual:', user ? 'Autenticado' : 'Não autenticado');
      
      if (user) {
        console.log('DEBUG - Dados do usuário:', {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        });
        
        // Teste 2: Verificar acesso ao Firestore
        console.log('DEBUG - Testando acesso ao Firestore...');
        
        // Tentar ler coleção listas
        const listasSnapshot = await this.firestore.collection('listas', ref => 
          ref.where('userId', '==', user.uid).limit(5)
        ).get().toPromise();
        
        console.log('DEBUG - Listas encontradas:', listasSnapshot?.docs.length || 0);
        
        if (listasSnapshot?.docs.length) {
          listasSnapshot.docs.forEach(doc => {
            console.log('DEBUG - Lista:', doc.id, doc.data());
          });
        }
        
        // Tentar ler coleção produtos
        const produtosSnapshot = await this.firestore.collection('produtos', ref => 
          ref.where('userId', '==', user.uid).limit(10)
        ).get().toPromise();
        
        console.log('DEBUG - Produtos encontrados:', produtosSnapshot?.docs.length || 0);
        
        if (produtosSnapshot?.docs.length) {
          produtosSnapshot.docs.forEach(doc => {
            const data = doc.data() as any;
            console.log('DEBUG - Produto:', doc.id, {
              produto: data.produto,
              listaNome: data.listaNome,
              quantidadeNumero: data.quantidadeNumero,
              quantidadeConsumida: data.quantidadeConsumida,
              userId: data.userId
            });
          });
        }
        
        // Verificar se há produtos para cada lista
        if (listasSnapshot?.docs.length) {
          console.log('DEBUG - Verificando produtos por lista...');
          
          for (const listaDoc of listasSnapshot.docs) {
            const listaNome = (listaDoc.data() as any).nome;
            console.log('DEBUG - Buscando produtos para lista:', listaNome);
            
            const produtosDaLista = await this.firestore.collection('produtos', ref => 
              ref.where('userId', '==', user.uid)
                 .where('listaNome', '==', listaNome)
            ).get().toPromise();
            
            console.log('DEBUG - Produtos da lista', listaNome, ':', produtosDaLista?.docs.length || 0);
            
            if (produtosDaLista?.docs.length) {
              produtosDaLista.docs.forEach(doc => {
                const data = doc.data() as any;
                console.log('DEBUG - Produto da lista:', {
                  id: doc.id,
                  produto: data.produto,
                  quantidadeNumero: data.quantidadeNumero,
                  quantidadeConsumida: data.quantidadeConsumida
                });
              });
            }
          }
        }
        
        // Tentar ler coleção histórico
        const historicoSnapshot = await this.firestore.collection('historico', ref => 
          ref.where('userId', '==', user.uid).limit(5)
        ).get().toPromise();
        
        console.log('DEBUG - Histórico encontrado:', historicoSnapshot?.docs.length || 0);
        
        if (historicoSnapshot?.docs.length) {
          historicoSnapshot.docs.forEach(doc => {
            console.log('DEBUG - Histórico:', doc.id, doc.data());
          });
        }
        
        // Teste 3: Verificar se consegue escrever no Firestore
        console.log('DEBUG - Testando escrita no Firestore...');
        
        const testDoc = await this.firestore.collection('debug_test').add({
          userId: user.uid,
          timestamp: new Date(),
          message: 'Teste de conexão'
        });
        
        console.log('DEBUG - Documento de teste criado:', testDoc.id);
        
        // Deletar documento de teste
        await testDoc.delete();
        console.log('DEBUG - Documento de teste removido');
        
        console.log('DEBUG - ✅ Todos os testes passaram!');
        
      } else {
        console.log('DEBUG - ❌ Usuário não autenticado');
      }
      
    } catch (error) {
      console.error('DEBUG - ❌ Erro durante teste:', error);
      throw error;
    }
  }
}
