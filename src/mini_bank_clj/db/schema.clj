(ns mini-bank-clj.db.schema
  (:require [clojure.java.jdbc :as jdbc]
            [mini-bank-clj.db.connection :refer [db-spec]]))

(defn create-accounts-table []
  (jdbc/db-do-commands
   (db-spec)
   "CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY,
      name TEXT,
      balance REAL
    )"))

(defn create-transactions-table []
  (jdbc/db-do-commands
   (db-spec)
   "CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY,
      type TEXT,
      account_id INTEGER,
      from_account_id INTEGER,
      to_account_id INTEGER,
      amount REAL,
      name TEXT,
      timestamp TEXT
    )"))

(defn create-users-table []
  (jdbc/db-do-commands
   (db-spec)
   "CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'USER'
    )"))

(defn get-user-columns []
  (jdbc/query (db-spec) ["PRAGMA table_info(users)"]))

(defn ensure-role-column []
  (let [columns (map :name (get-user-columns))]
    (when-not (some #{"role"} columns)
      (jdbc/db-do-commands
       (db-spec)
       "ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'USER'"))))

(defn seed-default-user []
  (let [existing-user
        (first
         (jdbc/query
          (db-spec)
          ["SELECT * FROM users WHERE email = ?" "thiago@email.com"]))]

    (if (nil? existing-user)
      (jdbc/insert!
       (db-spec)
       :users
       {:name "Thiago"
        :email "thiago@email.com"
        :password "123456"
        :role "ADMIN"})
      (jdbc/update!
       (db-spec)
       :users
       {:role "ADMIN"}
       ["email = ?" "thiago@email.com"]))))

(defn init-db []
  (create-accounts-table)
  (create-transactions-table)
  (create-users-table)
  (ensure-role-column)
  (seed-default-user)
  (println "✅ Banco inicializado com sucesso")
  (println "👑 thiago@email.com definido como ADMIN"))