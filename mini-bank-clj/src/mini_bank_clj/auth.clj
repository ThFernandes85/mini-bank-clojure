(ns mini-bank-clj.auth
  (:require [buddy.sign.jwt :as jwt]
            [ring.util.response :refer [response status]]))

(def secret-key "mini-bank-secret")

(defn extract-token [request]
  (let [auth-header (get-in request [:headers "authorization"])]
    (when (and auth-header (.startsWith auth-header "Bearer "))
      (subs auth-header 7))))

(defn wrap-jwt-auth [handler]
  (fn [request]
    (try
      (if-let [token (extract-token request)]
        (let [decoded (jwt/unsign token secret-key)]
          (handler (assoc request :identity decoded)))
        (-> (response {:success false
                       :message "Token não enviado"})
            (status 401)))
      (catch Exception _
        (-> (response {:success false
                       :message "Token inválido ou expirado"})
            (status 401))))))