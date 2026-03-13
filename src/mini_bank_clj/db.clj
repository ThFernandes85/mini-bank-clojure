(ns mini-bank-clj.db
  (:require [clojure.java.jdbc :as jdbc]
            [mini-bank-clj.db.connection :refer [db-spec]]))

(defn get-accounts []
  (jdbc/query (db-spec) ["SELECT * FROM accounts ORDER BY id"]))

(defn get-account [id]
  (first
   (jdbc/query (db-spec) ["SELECT * FROM accounts WHERE id = ?" id])))

(defn next-account-id []
  (let [result (jdbc/query
                (db-spec)
                ["SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM accounts"])]
    (:next_id (first result))))

(defn create-account [id name balance]
  (jdbc/insert! (db-spec)
                :accounts
                {:id id
                 :name name
                 :balance balance}))

(defn update-balance [id new-balance]
  (jdbc/update! (db-spec)
                :accounts
                {:balance new-balance}
                ["id = ?" id]))

(defn delete-account [id]
  (jdbc/delete! (db-spec) :accounts ["id = ?" id]))

(defn get-transactions []
  (jdbc/query (db-spec) ["SELECT * FROM transactions ORDER BY id"]))

(defn get-transaction [id]
  (first
   (jdbc/query (db-spec) ["SELECT * FROM transactions WHERE id = ?" id])))

(defn get-account-transactions [account-id]
  (jdbc/query
   (db-spec)
   ["SELECT * FROM transactions
     WHERE account_id = ?
        OR from_account_id = ?
        OR to_account_id = ?
     ORDER BY id"
    account-id account-id account-id]))

(defn next-transaction-id []
  (let [result (jdbc/query
                (db-spec)
                ["SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM transactions"])]
    (:next_id (first result))))

(defn create-transaction [transaction]
  (jdbc/insert! (db-spec) :transactions transaction))

(defn get-user-by-email [email]
  (first
   (jdbc/query (db-spec) ["SELECT * FROM users WHERE email = ?" email])))

(defn get-users []
  (jdbc/query
   (db-spec)
   ["SELECT id, name, email, role FROM users ORDER BY id"]))

(defn next-user-id []
  (let [result (jdbc/query
                (db-spec)
                ["SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM users"])]
    (:next_id (first result))))

(defn create-user [name email password role]
  (let [user-id (next-user-id)]
    (jdbc/insert! (db-spec)
                  :users
                  {:id user-id
                   :name name
                   :email email
                   :password password
                   :role role})
    (first
     (jdbc/query (db-spec)
                 ["SELECT * FROM users WHERE id = ?" user-id]))))