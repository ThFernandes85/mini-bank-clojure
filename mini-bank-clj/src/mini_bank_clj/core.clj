(ns mini-bank-clj.core
  (:gen-class)
  (:require [mini-bank-clj.db.schema :as schema]
            [mini-bank-clj.routes :refer [app]]
            [ring.adapter.jetty :refer [run-jetty]]))

(defn get-port []
  (Integer/parseInt (or (System/getenv "PORT") "3000")))

(defn -main []
  (let [port (get-port)]
    (schema/init-db)
    (println (str "Mini Bank API rodando na porta " port))
    (run-jetty app {:port port :join? false})))