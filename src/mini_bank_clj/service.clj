(ns mini-bank-clj.service
  (:require [mini-bank-clj.db :as db]
            [buddy.hashers :as hashers]
            [buddy.sign.jwt :as jwt])
  (:import [java.time LocalDateTime]
           [java.time.format DateTimeFormatter]))

(def jwt-secret "mini-bank-secret-key")

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

(defn register-user [name email password]
  (cond
    (db/get-user-by-email email)
    {:error "Usuário já existe"}

    (or (nil? name) (= "" name))
    {:error "Nome é obrigatório"}

    (or (nil? email) (= "" email))
    {:error "Email é obrigatório"}

    (or (nil? password) (= "" password))
    {:error "Senha é obrigatória"}

    :else
    (let [hashed-password (hashers/derive password)]
      (db/create-user name email hashed-password)
      {:message "Usuário criado com sucesso"})))

(defn login-user [email password]
  (let [user (db/get-user-by-email email)]
    (cond
      (nil? user)
      {:error "Usuário não encontrado"}

      (not (hashers/check password (:password user)))
      {:error "Senha inválida"}

      :else
      {:message "Login realizado com sucesso"
       :token (jwt/sign {:user-id (:id user)
                         :email (:email user)}
                        jwt-secret)})))

(defn create-account [name balance]
  (cond
    (or (nil? name) (= "" name))
    {:error "Nome é obrigatório"}

    (nil? balance)
    {:error "Saldo inicial é obrigatório"}

    (neg? balance)
    {:error "Saldo inicial não pode ser negativo"}

    :else
    (let [id (db/next-account-id)]
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

(defn get-account-statement [id]
  (let [account (db/get-account id)]
    (if (nil? account)
      {:error "Conta não encontrada"}
      {:account account
       :transactions (db/get-account-transactions id)})))

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