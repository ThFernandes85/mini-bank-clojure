(ns mini-bank-clj.service
  (:require [clojure.java.jdbc :as jdbc]
            [clojure.string :as str]
            [mini-bank-clj.db.connection :refer [db-spec]]
            [buddy.hashers :as hashers]
            [buddy.sign.jwt :as jwt]))

(def secret-key "mini-bank-secret")

(defn generate-token [user]
  (jwt/sign {:id (:id user)
             :email (:email user)
             :role (:role user)}
            secret-key))

(defn generate-account-number [user-id]
  (format "%06d-%d" (+ 100000 (or user-id 0)) (mod (or user-id 0) 10)))

(defn get-user-by-id [user-id]
  (first
   (jdbc/query db-spec
               ["SELECT * FROM users WHERE id = ?" user-id])))

(defn get-user-by-email [email]
  (first
   (jdbc/query db-spec
               ["SELECT * FROM users WHERE email = ?" email])))

(defn get-user-by-name [name]
  (first
   (jdbc/query db-spec
               ["SELECT * FROM users WHERE name = ? ORDER BY id ASC" name])))

(defn get-account-by-name [name]
  (first
   (jdbc/query db-spec
               ["SELECT * FROM accounts WHERE name = ? ORDER BY id ASC" name])))

(defn get-account-by-id [account-id]
  (first
   (jdbc/query db-spec
               ["SELECT * FROM accounts WHERE id = ?" account-id])))

(defn get-account-by-user-id [user-id]
  (first
   (jdbc/query db-spec
               ["SELECT * FROM accounts WHERE user_id = ? ORDER BY id ASC" user-id])))

(defn get-accounts-by-user-id [user-id]
  (jdbc/query db-spec
              ["SELECT * FROM accounts WHERE user_id = ? ORDER BY id ASC" user-id]))

(defn get-all-accounts []
  {:success true
   :data (jdbc/query db-spec ["SELECT * FROM accounts ORDER BY id ASC"])})

(defn admin-user? [user]
  (= "admin" (:role user)))

(defn login-user [email password]
  (let [user (get-user-by-email email)]
    (if (and user (hashers/check password (:password user)))
      {:success true
       :message "Login realizado com sucesso"
       :data {:token (generate-token user)
              :user {:id (:id user)
                     :name (:name user)
                     :email (:email user)
                     :role (:role user)}}}
      {:success false
       :message "Email ou senha inválidos"})))

(defn ensure-account-for-user! [user]
  (let [user-id (:id user)
        user-name (:name user)
        existing-account (or (get-account-by-user-id user-id)
                             (get-account-by-name user-name))]
    (when-not existing-account
      (jdbc/insert! db-spec
                    :accounts
                    {:user_id user-id
                     :name user-name
                     :balance 0.0
                     :agency "0001"
                     :account_number (generate-account-number user-id)
                     :account_type "corrente"
                     :status "ativa"}))))

(defn get-dashboard-data [user-id]
  (let [user (get-user-by-id user-id)
        _ (when user (ensure-account-for-user! user))
        account (when user (get-account-by-user-id user-id))
        all-accounts (jdbc/query db-spec ["SELECT * FROM accounts ORDER BY id ASC"])]
    {:success true
     :data {:user {:id (:id user)
                   :name (:name user)
                   :email (:email user)
                   :role (:role user)}
            :account account
            :accounts all-accounts
            :transactions []}}))

(defn deposit! [account-id amount]
  (let [account (get-account-by-id account-id)
        amount (double amount)]
    (cond
      (nil? account)
      {:success false :message "Conta não encontrada"}

      (= "encerrada" (:status account))
      {:success false :message "Conta encerrada não pode receber depósitos"}

      (<= amount 0)
      {:success false :message "Valor inválido"}

      :else
      (do
        (jdbc/update! db-spec
                      :accounts
                      {:balance (+ (:balance account) amount)}
                      ["id = ?" account-id])

        (jdbc/insert! db-spec
                      :transactions
                      {:type "deposit"
                       :account_id account-id
                       :amount amount
                       :name (:name account)
                       :timestamp (str (java.time.LocalDateTime/now))})

        {:success true
         :message "Depósito realizado com sucesso"}))))

(defn transfer! [from-account-id to-account-id amount]
  (let [from-account (get-account-by-id from-account-id)
        to-account (get-account-by-id to-account-id)
        amount (double amount)]
    (cond
      (nil? from-account)
      {:success false :message "Conta de origem não encontrada"}

      (nil? to-account)
      {:success false :message "Conta de destino não encontrada"}

      (= "encerrada" (:status from-account))
      {:success false :message "Conta de origem está encerrada"}

      (= "encerrada" (:status to-account))
      {:success false :message "Conta de destino está encerrada"}

      (= (:id from-account) (:id to-account))
      {:success false :message "Não é possível transferir para a mesma conta"}

      (<= amount 0)
      {:success false :message "Valor inválido"}

      (< (:balance from-account) amount)
      {:success false :message "Saldo insuficiente"}

      :else
      (do
        (jdbc/update! db-spec
                      :accounts
                      {:balance (- (:balance from-account) amount)}
                      ["id = ?" from-account-id])

        (jdbc/update! db-spec
                      :accounts
                      {:balance (+ (:balance to-account) amount)}
                      ["id = ?" to-account-id])

        (jdbc/insert! db-spec
                      :transactions
                      {:type "transfer_out"
                       :from_account_id from-account-id
                       :to_account_id to-account-id
                       :amount amount
                       :name (:name from-account)
                       :timestamp (str (java.time.LocalDateTime/now))})

        (jdbc/insert! db-spec
                      :transactions
                      {:type "transfer_in"
                       :from_account_id from-account-id
                       :to_account_id to-account-id
                       :amount amount
                       :name (:name to-account)
                       :timestamp (str (java.time.LocalDateTime/now))})

        {:success true
         :message "Transferência realizada com sucesso"}))))

(defn get-extract [account-id]
  {:success true
   :data (jdbc/query
          db-spec
          ["SELECT * FROM transactions
            WHERE account_id = ?
               OR from_account_id = ?
               OR to_account_id = ?
            ORDER BY id DESC"
           account-id account-id account-id])})

(defn register-user! [{:keys [name email password role account_type]}]
  (let [existing-user (get-user-by-email email)]
    (if existing-user
      {:success false
       :message "Já existe um usuário com esse email"}
      (do
        (jdbc/insert!
         db-spec
         :users
         {:name name
          :email email
          :password (hashers/derive password)
          :role (or role "user")})

        (let [created-user (get-user-by-email email)
              user-id (:id created-user)
              account-number (generate-account-number user-id)]
          (jdbc/insert!
           db-spec
           :accounts
           {:user_id user-id
            :name name
            :balance 0.0
            :agency "0001"
            :account_number account-number
            :account_type (or account_type "corrente")
            :status "ativa"}))

        {:success true
         :message "Conta criada com sucesso"}))))

(defn close-account! [account-id]
  (let [account (get-account-by-id account-id)]
    (cond
      (nil? account)
      {:success false
       :message "Conta não encontrada"}

      (= "encerrada" (:status account))
      {:success false
       :message "Conta já está encerrada"}

      :else
      (do
        (jdbc/update! db-spec
                      :accounts
                      {:status "encerrada"}
                      ["id = ?" account-id])

        {:success true
         :message "Conta encerrada com sucesso"}))))

(defn delete-account! [account-id]
  (let [account (get-account-by-id account-id)
        linked-user (when (:user_id account)
                      (get-user-by-id (:user_id account)))]
    (cond
      (nil? account)
      {:success false
       :message "Conta não encontrada"}

      (admin-user? linked-user)
      {:success false
       :message "Não é permitido apagar conta vinculada a administrador"}

      :else
      (do
        (jdbc/delete! db-spec
                      :transactions
                      ["account_id = ? OR from_account_id = ? OR to_account_id = ?"
                       account-id account-id account-id])

        (jdbc/delete! db-spec
                      :accounts
                      ["id = ?" account-id])

        {:success true
         :message "Conta apagada com sucesso"}))))

(defn delete-client-by-account-id! [account-id]
  (let [account (get-account-by-id account-id)
        resolved-user (when account
                        (or (when (:user_id account)
                              (get-user-by-id (:user_id account)))
                            (get-user-by-name (:name account))))
        resolved-user-id (:id resolved-user)
        final-accounts (cond
                         resolved-user-id
                         (let [linked-accounts (get-accounts-by-user-id resolved-user-id)]
                           (if (seq linked-accounts)
                             linked-accounts
                             (jdbc/query db-spec
                                         ["SELECT * FROM accounts WHERE name = ? ORDER BY id ASC"
                                          (:name resolved-user)])))

                         account
                         [account]

                         :else
                         [])]
    (cond
      (nil? account)
      {:success false
       :message "Conta não encontrada"}

      (admin-user? resolved-user)
      {:success false
       :message "Não é permitido excluir um usuário administrador"}

      (nil? resolved-user)
      (do
        (doseq [acc final-accounts]
          (let [acc-id (:id acc)]
            (jdbc/delete! db-spec
                          :transactions
                          ["account_id = ? OR from_account_id = ? OR to_account_id = ?"
                           acc-id acc-id acc-id])))
        (jdbc/delete! db-spec :accounts ["id = ?" account-id])
        {:success true
         :message "Conta removida, mas usuário não foi localizado"})

      :else
      (do
        (doseq [acc final-accounts]
          (let [acc-id (:id acc)]
            (jdbc/delete! db-spec
                          :transactions
                          ["account_id = ? OR from_account_id = ? OR to_account_id = ?"
                           acc-id acc-id acc-id])))

        (jdbc/delete! db-spec
                      :accounts
                      ["user_id = ? OR name = ?"
                       resolved-user-id (:name resolved-user)])

        (jdbc/delete! db-spec
                      :users
                      ["id = ?" resolved-user-id])

        {:success true
         :message "Cliente excluído com sucesso"}))))

(defn delete-user-by-email! [email]
  (let [user (get-user-by-email email)]
    (cond
      (nil? user)
      {:success false
       :message "Usuário não encontrado para esse email"}

      (admin-user? user)
      {:success false
       :message "Não é permitido excluir um usuário administrador"}

      :else
      (let [user-id (:id user)
            user-name (:name user)
            accounts (let [linked-accounts (get-accounts-by-user-id user-id)]
                       (if (seq linked-accounts)
                         linked-accounts
                         (jdbc/query db-spec
                                     ["SELECT * FROM accounts WHERE name = ? ORDER BY id ASC"
                                      user-name])))]
        (doseq [acc accounts]
          (let [acc-id (:id acc)]
            (jdbc/delete! db-spec
                          :transactions
                          ["account_id = ? OR from_account_id = ? OR to_account_id = ?"
                           acc-id acc-id acc-id])))

        (jdbc/delete! db-spec
                      :accounts
                      ["user_id = ? OR name = ?"
                       user-id user-name])

        (jdbc/delete! db-spec
                      :users
                      ["email = ?" email])

        {:success true
         :message "Usuário removido com sucesso pelo email"}))))

(defn normalize-name [name]
  (some-> name str str/trim str/lower-case))

(defn account-client-key [acc]
  (cond
    (:user_id acc) (str "user-id:" (:user_id acc))
    (seq (normalize-name (:name acc))) (str "name:" (normalize-name (:name acc)))
    :else (str "account-id:" (:id acc))))

(defn get-bank-summary []
  (let [accounts (jdbc/query db-spec ["SELECT * FROM accounts ORDER BY balance DESC"])
        transactions (jdbc/query db-spec ["SELECT * FROM transactions ORDER BY id DESC"])
        active-accounts (filter #(= "ativa" (:status %)) accounts)
        closed-accounts (filter #(= "encerrada" (:status %)) accounts)
        total-balance (reduce + 0 (map #(double (or (:balance %) 0)) accounts))
        total-moved (reduce + 0 (map #(double (or (:amount %) 0)) transactions))
        biggest-balance (first accounts)
        biggest-transfer (first (sort-by #(double (or (:amount %) 0))
                                         >
                                         (filter #(or (= (:type %) "transfer_out")
                                                      (= (:type %) "transfer_in"))
                                                 transactions)))
        ranking (take 5
                      (map (fn [acc]
                             {:id (:id acc)
                              :user_id (:user_id acc)
                              :name (:name acc)
                              :balance (:balance acc)
                              :account_number (:account_number acc)
                              :status (:status acc)})
                           accounts))
        total-clients (count (distinct (map account-client-key accounts)))]
    {:success true
     :data {:total_clients total-clients
            :total_accounts (count accounts)
            :active_accounts (count active-accounts)
            :closed_accounts (count closed-accounts)
            :total_balance total-balance
            :total_moved total-moved
            :biggest_balance (when biggest-balance
                               {:name (:name biggest-balance)
                                :balance (:balance biggest-balance)
                                :account_number (:account_number biggest-balance)})
            :biggest_transfer (when biggest-transfer
                                {:name (:name biggest-transfer)
                                 :amount (:amount biggest-transfer)
                                 :type (:type biggest-transfer)})
            :ranking ranking}}))