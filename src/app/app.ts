import { Component, inject, signal } from '@angular/core';

import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { TarefaService } from './services';
import { paraTarefa, Tarefa } from './models/tarefa';

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private tarefaService = inject(TarefaService);

  // =========================
  // FORMULÁRIO DE CRIAÇÃO
  // =========================

  form = new FormGroup({
    titulo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),

    descricao: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),

    prioridade: new FormControl<Tarefa['prioridade']>('media', {
      nonNullable: true,
    }),

    categoria: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),

    status: new FormControl<Tarefa['status']>('pendente', {
      nonNullable: true,
    }),

    dataLimite: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  // =========================
  // FORMULÁRIO DE EDIÇÃO
  // =========================

  formEdicao = new FormGroup({
    titulo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),

    descricao: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),

    prioridade: new FormControl<Tarefa['prioridade']>('media', {
      nonNullable: true,
    }),

    categoria: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),

    dataLimite: new FormControl('', {
      nonNullable: true,
    }),
  });

  // =========================
  // SIGNALS
  // =========================

  tarefas = signal<Tarefa[]>([]);

  carregando = signal(false);

  enviando = signal(false);

  erro = signal('');

  idEmEdicao = signal<number | null>(null);

  // IDs locais para tarefas criadas
  private proximoIdLocal = Date.now();

  // =========================
  // CONSTRUTOR
  // =========================

  constructor() {
    this.carregar();
  }

  // =========================
  // GET - LISTAR TAREFAS
  // =========================

  carregar() {
    this.carregando.set(true);
    this.erro.set('');

    this.tarefaService.listar().subscribe({
      next: (posts) => {
        this.tarefas.set(posts.map(paraTarefa));

        this.carregando.set(false);
      },

      error: () => {
        this.erro.set(
          'Erro ao carregar as tarefas. Tente novamente.'
        );

        this.carregando.set(false);
      },
    });
  }

  // =========================
  // POST - CRIAR TAREFA
  // =========================

  salvar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      this.erro.set(
        'Preencha todos os campos obrigatórios.'
      );

      return;
    }

    this.enviando.set(true);
    this.erro.set('');

    const tarefa: Tarefa = this.form.getRawValue();

    this.tarefaService.criar(tarefa).subscribe({
      next: (resposta) => {
        this.enviando.set(false);

        const tarefaCriada: Tarefa = {
          ...resposta,
          id: this.proximoIdLocal++,
        };

        this.tarefas.update((lista) => [
          tarefaCriada,
          ...lista,
        ]);

        this.form.reset({
          prioridade: 'media',
          status: 'pendente',
        });
      },

      error: () => {
        this.enviando.set(false);

        this.erro.set(
          'Erro ao criar a tarefa. Tente novamente.'
        );
      },
    });
  }

  // =========================
  // INICIAR EDIÇÃO
  // =========================

  iniciarEdicao(tarefa: Tarefa) {
    this.idEmEdicao.set(tarefa.id ?? null);

    this.formEdicao.setValue({
      titulo: tarefa.titulo,
      descricao: tarefa.descricao,
      prioridade: tarefa.prioridade,
      categoria: tarefa.categoria,
      dataLimite: tarefa.dataLimite,
    });
  }

  // =========================
  // CANCELAR EDIÇÃO
  // =========================

  cancelarEdicao() {
    this.idEmEdicao.set(null);
  }

  // =========================
  // PUT - SALVAR EDIÇÃO
  // =========================

  salvarEdicao(tarefaAtual: Tarefa) {
    if (!tarefaAtual.id || this.formEdicao.invalid) {
      this.formEdicao.markAllAsTouched();

      this.erro.set(
        'Preencha todos os campos obrigatórios da edição.'
      );

      return;
    }

    const id = tarefaAtual.id;

    const tarefaCompleta: Tarefa = {
      ...tarefaAtual,
      ...this.formEdicao.getRawValue(),
    };

    this.erro.set('');

    this.tarefaService
      .atualizar(id, tarefaCompleta)
      .subscribe({
        next: () => {
          this.aplicarEdicaoLocal(id, tarefaCompleta);
        },

        error: () => {
          // Tarefas criadas localmente não existem realmente
          // na JSONPlaceholder, então atualizamos localmente.
          if (id > 100) {
            this.aplicarEdicaoLocal(
              id,
              tarefaCompleta
            );
          } else {
            this.erro.set(
              'Erro ao atualizar a tarefa. Tente novamente.'
            );
          }
        },
      });
  }

  // =========================
  // APLICAR EDIÇÃO LOCAL
  // =========================

  private aplicarEdicaoLocal(
    id: number,
    tarefaCompleta: Tarefa
  ) {
    this.tarefas.update((lista) =>
      lista.map((t) =>
        t.id === id ? tarefaCompleta : t
      )
    );

    this.idEmEdicao.set(null);
  }

  // =========================
  // PATCH - CONCLUIR / REABRIR
  // =========================

  alternarStatus(tarefa: Tarefa) {
    if (!tarefa.id) return;

    const novoStatus: Tarefa['status'] =
      tarefa.status === 'concluida'
        ? 'pendente'
        : 'concluida';

    this.tarefaService
      .atualizarParcial(tarefa.id, {
        status: novoStatus,
      })
      .subscribe({
        next: () => {
          this.tarefas.update((lista) =>
            lista.map((t) =>
              t.id === tarefa.id
                ? { ...t, status: novoStatus }
                : t
            )
          );
        },

        error: () => {
          this.erro.set(
            'Erro ao atualizar o status da tarefa.'
          );
        },
      });
  }

  // =========================
  // DELETE - EXCLUIR
  // =========================

  excluir(id: number | undefined) {
    if (!id) return;

    const confirmar = confirm(
      'Deseja realmente excluir esta tarefa?'
    );

    if (!confirmar) return;

    this.tarefaService.remover(id).subscribe({
      next: () => {
        this.tarefas.update((lista) =>
          lista.filter((t) => t.id !== id)
        );
      },

      error: () => {
        this.erro.set(
          'Erro ao excluir a tarefa. Tente novamente.'
        );
      },
    });
  }
}