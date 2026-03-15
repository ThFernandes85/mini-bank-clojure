(ns mini-bank-clj.db.schema
  (:require [clojure.java.jdbc :as jdbc]
            [mini-bank-clj.db.connection :refer [db-spec]]
            [buddy.hashers :as hashers]))

(defn create-accounts-table []
  (jdbc/db-do-commands
   db-spec
   "CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      balance REAL DEFAULT 0,
      agency TEXT DEFAULT '0001',
      account_number TEXT,
      account_type TEXT DEFAULT 'corrente',
      status TEXT DEFAULT 'ativa'
    )"))

(defn create-transactions-table []
  (jdbc/db-do-commands
   db-spec
   "CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      account_id INTEGER,
      from_account_id INTEGER,
      to_account_id INTEGER,
      amount REAL NOT NULL,
      name TEXT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    )"))

(defn create-users-table []
  (jdbc/db-do-commands
   db-spec
   "CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user'
    )"))

(defn user-column-exists? [column-name]
  (let [columns (jdbc/query db-spec ["PRAGMA table_info(users)"])]
    (boolean
     (some (fn [col] (= (:name col) column-name)) columns))))

(defn account-column-exists? [column-name]
  (let [columns (jdbc/query db-spec ["PRAGMA table_info(accounts)"])]
    (boolean
     (some (fn [col] (= (:name col) column-name)) columns))))

(defn ensure-role-column []
  (when-not (user-column-exists? "role")
    (jdbc/db-do-commands
     db-spec
     "ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'")))

(defn ensure-user-id-column []
  (when-not (account-column-exists? "user_id")
    (jdbc/db-do-commands
     db-spec
     "ALTER TABLE accounts ADD COLUMN user_id INTEGER")))

(defn ensure-agency-column []
  (when-not (account-column-exists? "agency")
    (jdbc/db-do-commands
     db-spec
     "ALTER TABLE accounts ADD COLUMN agency TEXT DEFAULT '0001'")))

(defn ensure-account-number-column []
  (when-not (account-column-exists? "account_number")
    (jdbc/db-do-commands
     db-spec
     "ALTER TABLE accounts ADD COLUMN account_number TEXT")))

(defn ensure-account-type-column []
  (when-not (account-column-exists? "account_type")
    (jdbc/db-do-commands
     db-spec
     "ALTER TABLE accounts ADD COLUMN account_type TEXT DEFAULT 'corrente'")))

(defn ensure-status-column []
  (when-not (account-column-exists? "status")
    (jdbc/db-do-commands
     db-spec
     "ALTER TABLE accounts ADD COLUMN status TEXT DEFAULT 'ativa'")))

(defn generate-account-number [user-id]
  (format "%06d-%d" (+ 100000 (or user-id 0)) (mod (or user-id 0) 10)))

(defn seed-default-user []
  (let [email "thiago@email.com"
        hashed-password (hashers/derive "123456")
        existing-user (first
                       (jdbc/query
                        db-spec
                        ["SELECT * FROM users WHERE email = ?" email]))]
    (if (nil? existing-user)
      (jdbc/insert!
       db-spec
       :users
       {:name "Thiago Fernandes"
        :email email
        :password hashed-password
        :role "admin"})
      (jdbc/update!
       db-spec
       :users
       {:name "Thiago Fernandes"
        :password hashed-password
        :role "admin"}
       ["email = ?" email]))))

(defn find-user-id-by-name [name]
  (let [user (first
              (jdbc/query db-spec
                          ["SELECT id FROM users WHERE name = ? ORDER BY id ASC" name]))]
    (:id user)))

(defn ensure-accounts-have-default-data []
  (let [accounts (jdbc/query db-spec ["SELECT * FROM accounts ORDER BY id ASC"])]
    (doseq [acc accounts]
      (let [resolved-user-id (or (:user_id acc)
                                 (find-user-id-by-name (:name acc)))]
        (jdbc/update!
         db-spec
         :accounts
         {:user_id resolved-user-id
          :agency (or (:agency acc) "0001")
          :account_number (or (:account_number acc)
                              (generate-account-number (or resolved-user-id (:id acc))))
          :account_type (or (:account_type acc) "corrente")
          :status (or (:status acc) "ativa")}
         ["id = ?" (:id acc)])))))

(defn init-db []
  (create-accounts-table)
  (create-transactions-table)
  (create-users-table)
  (ensure-role-column)
  (ensure-user-id-column)
  (ensure-agency-column)
  (ensure-account-number-column)
  (ensure-account-type-column)
  (ensure-status-column)
  (seed-default-user)
  (ensure-accounts-have-default-data)
  (println "Banco de dados inicializado com sucesso."))