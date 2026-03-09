(ns mini-bank-clj.routes
  (:require [compojure.core :refer [defroutes GET POST DELETE]]
            [compojure.route :as route]
            [mini-bank-clj.service :as service]))

(defroutes app-routes
  (GET "/" []
    {:status 200
     :body {:message "Mini Bank API rodando com Clojure"}})

  (GET "/docs" []
    {:status 200
     :headers {"Content-Type" "text/html; charset=utf-8"}
     :body
     "<html>
        <head>
          <title>Mini Bank API Docs</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            h1 { color: #4F46E5; }
            code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; }
            .route { margin-bottom: 12px; }
          </style>
        </head>
        <body>
          <h1>Mini Bank API</h1>
          <p>Documentação simples da API.</p>

          <h2>Rotas</h2>

          <div class='route'><code>GET /</code> - Mensagem inicial</div>
          <div class='route'><code>GET /accounts</code> - Listar contas</div>
          <div class='route'><code>GET /accounts/:id</code> - Buscar conta por ID</div>
          <div class='route'><code>POST /accounts</code> - Criar conta</div>
          <div class='route'><code>POST /deposit</code> - Realizar depósito</div>
          <div class='route'><code>POST /transfer</code> - Realizar transferência</div>
          <div class='route'><code>DELETE /accounts/:id</code> - Deletar conta</div>
          <div class='route'><code>GET /transactions</code> - Listar transações</div>
          <div class='route'><code>GET /transactions/:id</code> - Buscar transação por ID</div>
          <div class='route'><code>GET /bank/total-balance</code> - Saldo total do banco</div>
        </body>
      </html>"})

  (GET "/accounts" []
    {:status 200
     :body (service/list-accounts)})

  (GET "/accounts/:id" [id]
    (let [account (service/get-account (Integer/parseInt id))]
      (if account
        {:status 200 :body account}
        {:status 404 :body {:error "Conta não encontrada"}})))

  (GET "/transactions" []
    {:status 200
     :body (service/list-transactions)})

  (GET "/transactions/:id" [id]
    (let [transaction (service/get-transaction (Integer/parseInt id))]
      (if transaction
        {:status 200 :body transaction}
        {:status 404 :body {:error "Transação não encontrada"}})))

  (GET "/bank/total-balance" []
    {:status 200
     :body {:total-balance (service/total-balance)}})

  (POST "/accounts" request
    (let [{:keys [id name balance]} (:body request)]
      {:status 201
       :body (service/create-account id name balance)}))

  (POST "/deposit" request
    (let [{:keys [id amount]} (:body request)]
      {:status 200
       :body (service/deposit id amount)}))

  (POST "/transfer" request
    (let [{:keys [from-id to-id amount]} (:body request)]
      {:status 200
       :body (service/transfer from-id to-id amount)}))

  (DELETE "/accounts/:id" [id]
    (let [result (service/delete-account (Integer/parseInt id))]
      (if (:error result)
        {:status 404 :body result}
        {:status 200 :body result})))

  (route/not-found
   {:status 404
    :body {:error "Rota não encontrada"}}))