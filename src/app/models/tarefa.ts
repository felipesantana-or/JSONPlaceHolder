export interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

export interface Tarefa {
  id?: number;
  titulo: string;
  descricao: string;
  prioridade: 'baixa' | 'media' | 'alta';
  categoria: string;
  status: 'pendente' | 'em andamento' | 'concluida';
  dataLimite: string;
}

// Converte o formato da API para o formato da aplicação
export function paraTarefa(post: Post): Tarefa {
  return {
    id: post.id,
    titulo: post.title,
    descricao: post.body,
    prioridade: 'media',
    categoria: 'Geral',
    status: 'pendente',
    dataLimite: '',
  };
}