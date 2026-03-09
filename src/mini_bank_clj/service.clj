(ns mini-bank-clj.service
  (:require
   [mini-bank-clj.db :as db])
  (:import [java.time LocalDateTime]
           [java.time.format DateTimeFormatter]))

(defn list-accounts []
  (db/get-accounts))

(defn get-account [id]
  (db/get-account id))

(defn list-transactions []
  (db/get-transactions))

(defn get-transaction [id]
  (db/get-transaction id))

(defn total-balance []
  (reduce + 0 (map :balance (db/get-accounts))))

(defn current-timestamp []
  (.format
   (LocalDateTime/now)
   (DateTimeFormatter/ofPattern "yyyy-MM-dd HH:mm:ss")))

(defn add-transaction [transaction]
  (db/create-transaction
   (assoc transaction
          :id (db/next-transaction-id)
          :timestamp (current-timestamp))))

(defn create-account [id name balance]
  (cond
    (db/get-account id)
    {:error "Conta já existe"}

    (neg? balance)
    {:error "Saldo inicial não pode ser negativo"}

    :else
    (do
      (db/create-account id name balance)
      (add-transaction
       {:type "create-account"
        :account_id id
        :name name
        :amount balance})
      {:message "Conta criada com sucesso"
       :account (db/get-account id)})))

(defn deposit [id amount]
  (let [account (db/get-account id)]
    (cond
      (nil? account)
      {:error "Conta não encontrada"}

      (<= amount 0)
      {:error "O valor do depósito deve ser maior que zero"}

      :else
      (let [new-balance (+ (:balance account) amount)]
        (db/update-balance id new-balance)
        (add-transaction
         {:type "deposit"
          :account_id id
          :amount amount})
        {:message "Depósito realizado com sucesso"
         :account (db/get-account id)}))))

(defn transfer [from-id to-id amount]
  (let [from-account (db/get-account from-id)
        to-account   (db/get-account to-id)]
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
      (let [new-from-balance (- (:balance from-account) amount)
            new-to-balance   (+ (:balance to-account) amount)]
        (db/update-balance from-id new-from-balance)
        (db/update-balance to-id new-to-balance)
        (add-transaction
         {:type "transfer"
          :from_account_id from-id
          :to_account_id to-id
          :amount amount})
        {:message "Transferência realizada com sucesso"
         :from-account (db/get-account from-id)
         :to-account (db/get-account to-id)}))))

(defn delete-account [id]
  (if-let [account (db/get-account id)]
    (do
      (db/delete-account id)
      (add-transaction
       {:type "delete-account"
        :account_id id
        :name (:name account)
        :amount (:balance account)})
      {:message "Conta removida com sucesso"
       :deleted-account account})
    {:error "Conta não encontrada"}))