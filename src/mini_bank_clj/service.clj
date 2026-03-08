(ns mini-bank-clj.service
  (:require [mini-bank-clj.db :refer [accounts transactions transaction-seq]])
  (:import [java.time LocalDateTime]
           [java.time.format DateTimeFormatter]))

(defn list-accounts []
  (vals @accounts))

(defn get-account [id]
  (get @accounts id))

(defn list-transactions []
  @transactions)

(defn get-transaction [id]
  (first
   (filter #(= (:id %) id) @transactions)))

(defn total-balance []
  (reduce + (map :balance (vals @accounts))))

(defn current-timestamp []
  (.format
   (LocalDateTime/now)
   (DateTimeFormatter/ofPattern "yyyy-MM-dd HH:mm:ss")))

(defn next-transaction-id []
  (swap! transaction-seq inc))

(defn add-transaction [transaction]
  (let [transaction-with-data
        (assoc transaction
               :id (next-transaction-id)
               :timestamp (current-timestamp))]
    (swap! transactions conj transaction-with-data)))

(defn create-account [id name balance]
  (cond
    (get @accounts id)
    {:error "Conta já existe"}

    (neg? balance)
    {:error "Saldo inicial não pode ser negativo"}

    :else
    (do
      (swap! accounts assoc id {:id id :name name :balance balance})
      (add-transaction
       {:type "create-account"
        :account-id id
        :name name
        :initial-balance balance})
      {:message "Conta criada com sucesso"
       :account (get @accounts id)})))

(defn deposit [id amount]
  (cond
    (nil? (get @accounts id))
    {:error "Conta não encontrada"}

    (<= amount 0)
    {:error "O valor do depósito deve ser maior que zero"}

    :else
    (do
      (swap! accounts update-in [id :balance] + amount)
      (add-transaction
       {:type "deposit"
        :account-id id
        :amount amount})
      {:message "Depósito realizado com sucesso"
       :account (get @accounts id)})))

(defn transfer [from-id to-id amount]
  (let [from-account (get @accounts from-id)
        to-account   (get @accounts to-id)]
    (cond
      (nil? from-account)
      {:error "Conta de origem não encontrada"}

      (nil? to-account)
      {:error "Conta de destino não encontrada"}

      (= from-id to-id)
      {:error "A conta de origem e destino não podem ser a mesma"}

      (<= amount 0)
      {:error "O valor da transferência deve ser maior que zero"}

      (< (:balance from-account) amount)
      {:error "Saldo insuficiente"}

      :else
      (do
        (swap! accounts update-in [from-id :balance] - amount)
        (swap! accounts update-in [to-id :balance] + amount)
        (add-transaction
         {:type "transfer"
          :from-account-id from-id
          :to-account-id to-id
          :amount amount})
        {:message "Transferência realizada com sucesso"
         :from-account (get @accounts from-id)
         :to-account (get @accounts to-id)}))))

(defn delete-account [id]
  (if-let [account (get @accounts id)]
    (do
      (swap! accounts dissoc id)
      (add-transaction
       {:type "delete-account"
        :account-id id
        :name (:name account)
        :final-balance (:balance account)})
      {:message "Conta removida com sucesso"
       :deleted-account account})
    {:error "Conta não encontrada"}))