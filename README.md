![Clojure](https://img.shields.io/badge/Clojure-Functional-green)
![API](https://img.shields.io/badge/API-REST-blue)
![Status](https://img.shields.io/badge/status-online-success)
![Deploy](https://img.shields.io/badge/deploy-render-purple)

# 💜 Mini Bank API - Clojure 💳

API REST desenvolvida em **Clojure** que simula operações bancárias básicas de um banco digital.

O sistema permite:

- criação de usuários
- autenticação com JWT
- criação de contas
- depósitos
- transferências
- histórico de transações
- extrato bancário

Este projeto foi desenvolvido com foco em aprendizado de **programação funcional**, **arquitetura de APIs REST** e **boas práticas de backend**.

---

# 🚀 Tecnologias Utilizadas

- Clojure
- Ring
- Compojure
- Leiningen
- Jetty Server
- JSON Middleware
- JWT Authentication
- SQLite
- Clojure JDBC

---

# 📦 Estrutura do Projeto

```text
mini-bank-clj
└── src
    └── mini_bank_clj
        ├── auth.clj
        ├── core.clj
        ├── db.clj
        ├── routes.clj
        ├── service.clj
        └── utils
            └── response.clj