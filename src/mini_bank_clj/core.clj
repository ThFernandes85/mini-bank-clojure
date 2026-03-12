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

(defn -main []
  (schema/init-db)
  (println "Mini Bank API rodando na porta 3000")
  (run-jetty app {:port 3000 :join? false}))