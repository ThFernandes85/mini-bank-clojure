(ns mini-bank-clj.core
  (:require [ring.adapter.jetty :refer [run-jetty]]
            [ring.middleware.json :refer [wrap-json-body wrap-json-response]]
            [mini-bank-clj.routes :refer [app-routes]]
            [mini-bank-clj.db.schema :as schema])
  (:gen-class))

(def app
  (-> app-routes
      (wrap-json-body {:keywords? true})
      wrap-json-response))

(defn get-port []
  (Integer/parseInt (or (System/getenv "PORT") "3000")))

(defn -main []
  (schema/init-db)
  (let [port (get-port)]
    (println (str "Servidor rodando em http://0.0.0.0:" port))
    (run-jetty app {:host "0.0.0.0"
                    :port port
                    :join? false})))