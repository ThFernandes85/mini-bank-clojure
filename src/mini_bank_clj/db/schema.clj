(ns mini-bank-clj.db.schema
  (:require [clojure.java.jdbc :as jdbc]
            [mini-bank-clj.db.connection :refer [db-spec]]))

(defn create-accounts-table []
  (jdbc/db-do-commands
   db-spec
   "CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY,
      name TEXT,
      balance REAL
    )"))

(defn create-transactions-table []
  (jdbc/db-do-commands
   db-spec
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

(defn init-db []
  (create-accounts-table)
  (create-transactions-table))