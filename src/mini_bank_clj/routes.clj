(ns mini-bank-clj.routes
  (:require [compojure.core :refer [defroutes GET POST DELETE routes]]
            [compojure.route :as route]
            [mini-bank-clj.service :as service]
            [mini-bank-clj.auth :refer [wrap-jwt-auth]]
            [mini-bank-clj.utils.response :as response]))

(defroutes public-routes
  (GET "/" []
    (response/ok {:message "Mini Bank API rodando com Clojure"}))

  (GET "/health" []
    (response/ok {:status "ok"}))

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

          <h2>Rotas Públicas</h2>
          <div class='route'><code>GET /</code> - Mensagem inicial</div>
          <div class='route'><code>GET /health</code> - Health check da API</div>
          <div class='route'><code>GET /docs</code> - Documentação</div>
          <div class='route'><code>POST /register</code> - Criar usuário</div>
          <div class='route'><code>POST /login</code> - Login e token JWT</div>

          <h2>Rotas Protegidas</h2>
          <div class='route'><code>GET /accounts</code> - Listar contas</div>
          <div class='route'><code>GET /accounts/:id</code> - Buscar conta por ID</div>
          <div class='route'><code>GET /accounts/:id/statement</code> - Extrato da conta</div>
          <div class='route'><code>POST /accounts</code> - Criar conta</div>
          <div class='route'><code>POST /deposit</code> - Realizar depósito</div>
          <div class='route'><code>POST /transfer</code> - Realizar transferência</div>
          <div class='route'><code>DELETE /accounts/:id</code> - Deletar conta</div>
          <div class='route'><code>GET /transactions</code> - Listar transações</div>
          <div class='route'><code>GET /transactions/:id</code> - Buscar transação por ID</div>
          <div class='route'><code>GET /bank/total-balance</code> - Saldo total do banco</div>
        </body>
      </html>"})

  (POST "/register" request
    (let [{:keys [name email password]} (:body request)
          result (service/register-user name email password)]
      (if (:error result)
        (response/bad-request (:error result))
        (response/created result))))

  (POST "/login" request
    (let [{:keys [email password]} (:body request)
          result (service/login-user email password)]
      (if (:error result)
        (response/unauthorized (:error result))
        (response/ok result)))))

(defroutes protected-routes
  (GET "/accounts" []
    (response/ok (service/list-accounts)))

  (GET "/accounts/:id" [id]
    (let [account (service/get-account (Integer/parseInt id))]
      (if account
        (response/ok account)
        (response/not-found "Conta não encontrada"))))

  (GET "/accounts/:id/statement" [id]
    (let [result (service/get-account-statement (Integer/parseInt id))]
      (if (:error result)
        (response/not-found (:error result))
        (response/ok result))))

  (GET "/transactions" []
    (response/ok (service/list-transactions)))

  (GET "/transactions/:id" [id]
    (let [transaction (service/get-transaction (Integer/parseInt id))]
      (if transaction
        (response/ok transaction)
        (response/not-found "Transação não encontrada"))))

  (GET "/bank/total-balance" []
    (response/ok {:total-balance (service/total-balance)}))

  (POST "/accounts" request
    (let [{:keys [name balance]} (:body request)
          result (service/create-account name balance)]
      (if (:error result)
        (response/bad-request (:error result))
        (response/created result))))

  (POST "/deposit" request
    (let [{:keys [id amount]} (:body request)
          result (service/deposit id amount)]
      (if (:error result)
        (response/bad-request (:error result))
        (response/ok result))))

  (POST "/transfer" request
    (let [{:keys [from-id to-id amount]} (:body request)
          result (service/transfer from-id to-id amount)]
      (if (:error result)
        (response/bad-request (:error result))
        (response/ok result))))

  (DELETE "/accounts/:id" [id]
    (let [result (service/delete-account (Integer/parseInt id))]
      (if (:error result)
        (response/not-found (:error result))
        (response/ok result)))))

(def app-routes
  (routes
   public-routes
   (wrap-jwt-auth protected-routes)
   (route/not-found
    {:status 404
     :body {:success false
            :error "Rota não encontrada"}})))

