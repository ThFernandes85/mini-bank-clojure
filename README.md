# Mini Bank CLJ

API bancária simples desenvolvida em Clojure, inspirada em conceitos de backend usados em fintechs. O projeto foi criado para praticar programação funcional, rotas REST, regras de negócio e organização de código.

## Objetivo

Simular operações básicas de um sistema bancário, como:

- criação de contas
- consulta de saldo
- depósito
- transferência
- exclusão de conta
- histórico de transações
- cálculo do saldo total do banco

## Tecnologias utilizadas

- Clojure
- Leiningen
- Ring
- Compojure
- JSON API

## Estrutura do projeto

```text
mini-bank-clj
└── src
    └── mini_bank_clj
        ├── core.clj
        ├── db.clj
        ├── service.clj
        └── routes.clj