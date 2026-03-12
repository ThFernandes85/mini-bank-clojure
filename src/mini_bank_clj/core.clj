(ns mini-bank-clj.core
  (:require
   [ring.adapter.jetty :refer [run-jetty]]
   [ring.middleware.json :refer [wrap-json-body wrap-json-response]]
   [ring.middleware.cors :refer [wrap-cors]]
   [mini-bank-clj.routes :refer [app-routes]]
   [mini-bank-clj.db.schema :as schema])
  (:gen-class))

(def app
  (-> app-routes
      (wrap-json-body {:keywords? true})
      wrap-json-response
      (wrap-cors
       :access-control-allow-origin [#".*"]
       :access-control-allow-methods [:get :post :put :delete :options]
       :access-control-allow-headers ["Content-Type" "Authorization"])))

(defn get-port []
  (Integer/parseInt (or (System/getenv "PORT") "3000")))

(defn -main []
  (schema/init-db)
  (let [port (get-port)]
    (println (str "Mini Bank API rodando na porta " port))
    (run-jetty app {:port port :join? false})))