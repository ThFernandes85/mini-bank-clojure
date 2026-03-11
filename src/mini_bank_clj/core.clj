(ns mini-bank-clj.core
  (:require
   [ring.adapter.jetty :refer [run-jetty]]
   [ring.middleware.json :refer [wrap-json-body wrap-json-response]]
   [mini-bank-clj.routes :refer [app-routes]]
   [mini-bank-clj.db.schema :as schema])
  (:gen-class))

(def allowed-origin "http://localhost:5173")

(defn wrap-cors [handler]
  (fn [request]
    (if (= :options (:request-method request))
      {:status 200
       :headers {"Access-Control-Allow-Origin" allowed-origin
                 "Access-Control-Allow-Headers" "Content-Type, Authorization"
                 "Access-Control-Allow-Methods" "GET, POST, PUT, DELETE, OPTIONS"}
       :body ""}
      (let [response (handler request)]
        (update response :headers merge
                {"Access-Control-Allow-Origin" allowed-origin
                 "Access-Control-Allow-Headers" "Content-Type, Authorization"
                 "Access-Control-Allow-Methods" "GET, POST, PUT, DELETE, OPTIONS"})))))

(def app
  (-> app-routes
      wrap-cors
      (wrap-json-body {:keywords? true})
      wrap-json-response))

(defn -main []
  (schema/init-db)
  (println "🚀 Mini Bank API rodando na porta 3000")
  (run-jetty app {:port 3000 :join? false}))