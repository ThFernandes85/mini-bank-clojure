(ns mini-bank-clj.db.connection)

(def db-spec
  {:classname   "org.sqlite.JDBC"
   :subprotocol "sqlite"
   :subname     "mini_bank.db"})