(ns mini-bank-clj.auth
  (:require [buddy.sign.jwt :as jwt]))

(def secret "mini-bank-secret")

(defn generate-token [user-data]
  (jwt/sign user-data secret))

(defn verify-token [token]
  (try
    (jwt/unsign token secret)
    (catch Exception _
      nil)))

(defn wrap-jwt-auth [handler]
  (fn [request]
    (let [auth-header (get-in request [:headers "authorization"])
          token (when auth-header
                  (second (re-find #"Bearer (.+)" auth-header)))
          decoded (when token (verify-token token))]
      (if decoded
        (handler (assoc request :identity decoded))
        {:status 401
         :body {:error "Token inválido ou ausente"}}))))