(ns mini-bank-clj.db.schema
  (:require [clojure.java.jdbc :as jdbc]
            [mini-bank-clj.db.connection :refer [db-spec]]
            [buddy.hashers :as hashers]))

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
      role TEXT DEFAULT 'user'
    )"))

(defn role-column-exists? []
  (let [columns (jdbc/query (db-spec) ["PRAGMA table_info(users)"])]
    (some #(= (:name %) "role") columns)))

(defn ensure-role-column []
  (when-not (role-column-exists?)
    (jdbc/db-do-commands
     (db-spec)
     "ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'")))

(defn seed-default-user []
  (let [email "thiago@email.com"
        hashed-password (hashers/derive "123456")
        existing-user (first
                       (jdbc/query
                        (db-spec)
                        ["SELECT * FROM users WHERE email = ?" email]))]
    (if (nil? existing-user)
      (jdbc/insert! (db-spec)
                    :users
                    {:name "Thiago"
                     :email email
                     :password hashed-password
                     :role "admin"})
      (jdbc/update! (db-spec)
                    :users
                    {:name "Thiago"
                     :password hashed-password
                     :role "admin"}
                    ["email = ?" email]))))

(defn init-db []
  (create-accounts-table)
  (create-transactions-table)
  (create-users-table)
  (ensure-role-column)
  (seed-default-user))