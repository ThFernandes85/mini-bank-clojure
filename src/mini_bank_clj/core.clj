(ns mini-bank-clj.core
  (:require
   [clojure.string :as str]
   [ring.adapter.jetty :refer [run-jetty]]
   [ring.middleware.json :refer [wrap-json-body wrap-json-response]]
   [mini-bank-clj.routes :refer [app-routes]]
   [mini-bank-clj.db.schema :as schema])
  (:gen-class))

(defn allowed-origin? [origin]
  (or (= origin "http://localhost:5173")
      (and origin (str/ends-with? origin ".vercel.app"))))

(defn cors-headers [origin]
  {"Access-Control-Allow-Origin" origin
   "Access-Control-Allow-Headers" "Content-Type, Authorization"
   "Access-Control-Allow-Methods" "GET, POST, PUT, DELETE, OPTIONS"
   "Vary" "Origin"})

(defn wrap-cors [handler]
  (fn [request]
    (let [origin (get-in request [:headers "origin"])]
      (if (allowed-origin? origin)
        (if (= :options (:request-method request))
          {:status 200
           :headers (cors-headers origin)
           :body ""}
          (let [response (handler request)]
            (update response :headers merge (cors-headers origin))))
        (handler request)))))

(def app
  (-> app-routes
      wrap-cors
      (wrap-json-body {:keywords? true})
      wrap-json-response))

(defn -main []
  (schema/init-db)
  (println "🚀 Mini Bank API rodando na porta 3000")
  (run-jetty app {:port 3000 :join? false}))