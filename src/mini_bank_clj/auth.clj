(ns mini-bank-clj.auth
  (:require [buddy.sign.jwt :as jwt]))

(def jwt-secret "mini-bank-secret-key")

(defn unauthorized-response []
  {:status 401
   :body {:error "Token ausente ou inválido"}})

(defn wrap-jwt-auth [handler]
  (fn [request]
    (let [auth-header (get-in request [:headers "authorization"])]
      (if (and auth-header (.startsWith auth-header "Bearer "))
        (let [token (.substring auth-header 7)]
          (try
            (let [claims (jwt/unsign token jwt-secret)]
              (handler (assoc request :jwt-claims claims)))
            (catch Exception _
              (unauthorized-response))))
        (unauthorized-response)))))