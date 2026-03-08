(ns mini-bank-clj.routes
  (:require [compojure.core :refer [defroutes GET POST DELETE]]
            [compojure.route :as route]
            [mini-bank-clj.service :as service]))

(defroutes app-routes
  (GET "/" []
    {:status 200
     :body {:message "Mini Bank API rodando com Clojure"}})
  

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