(ns mini-bank-clj.db.connection)

(defn database-url []
  (System/getenv "DATABASE_URL"))

(defn db-spec []
  (if-let [db-url (database-url)]
    {:connection-uri db-url}
    {:classname "org.sqlite.JDBC"
     :subprotocol "sqlite"
     :subname "mini_bank.db"}))