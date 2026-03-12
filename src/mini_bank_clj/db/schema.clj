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
      password TEXT
    )"))

(defn seed-default-user []
  (let [existing-user (first
                       (jdbc/query
                        (db-spec)
                        ["SELECT * FROM users WHERE email = ?" "thiago@email.com"]))]
    (when (nil? existing-user)
      (jdbc/insert! (db-spec)
                    :users
                    {:name "Thiago"
                     :email "thiago@email.com"
                     :password "123456"}))))

(defn init-db []
  (create-accounts-table)
  (create-transactions-table)
  (create-users-table)
  (seed-default-user))

