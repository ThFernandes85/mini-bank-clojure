(ns mini-bank-clj.routes
  (:require [compojure.core :refer [defroutes GET POST DELETE PUT OPTIONS]]
            [compojure.route :as route]
            [ring.util.response :refer [response status]]
            [ring.middleware.json :refer [wrap-json-body wrap-json-response]]
            [ring.middleware.params :refer [wrap-params]]
            [ring.middleware.keyword-params :refer [wrap-keyword-params]]
            [ring.middleware.cors :refer [wrap-cors]]
            [clojure.string :as str]
            [mini-bank-clj.service :as service]
            [mini-bank-clj.auth :refer [wrap-jwt-auth]]))

(defn admin-only [request handler]
  (if (= "admin" (get-in request [:identity :role]))
    (handler)
    (-> (response {:success false
                   :message "Acesso restrito a administradores"})
        (status 403))))

(defn allowed-origin-patterns []
  (let [frontend-url (System/getenv "FRONTEND_URL")
        trimmed-url (some-> frontend-url str/trim not-empty)
        escaped-url (when trimmed-url
                      (java.util.regex.Pattern/quote trimmed-url))]
    (vec
     (remove nil?
             [#"http://localhost:5173"
              (when escaped-url
                (re-pattern escaped-url))]))))

(defroutes public-routes
  (OPTIONS "*" []
    (response {:success true :message "Preflight OK"}))

  (GET "/" []
    (response {:message "Mini Bank API rodando com Clojure"}))

  (GET "/public/bank-summary" []
    (response (service/get-public-bank-summary)))

  (POST "/login" request
    (let [{:keys [email password]} (:body request)]
      (response (service/login-user email password)))))

(defroutes protected-routes
  (GET "/dashboard" request
    (response
     (service/get-dashboard-data (get-in request [:identity :id]))))

  (GET "/admin/bank-summary" request
    (admin-only
     request
     #(response (service/get-bank-summary))))

  (POST "/deposit" request
    (let [{:keys [account_id amount]} (:body request)]
      (response (service/deposit! account_id amount))))

  (POST "/transfer" request
    (let [{:keys [from_account_id to_account_id amount]} (:body request)]
      (response (service/transfer! from_account_id to_account_id amount))))

  (GET "/extract/:account-id" [account-id]
    (response (service/get-extract (Integer/parseInt account-id))))

  (POST "/admin/register" request
    (admin-only
     request
     #(response (service/register-user! (:body request)))))

  (PUT "/admin/account/:account-id/close" [account-id :as request]
    (admin-only
     request
     #(response (service/close-account! (Integer/parseInt account-id)))))

  (DELETE "/admin/account/:account-id" [account-id :as request]
    (admin-only
     request
     #(response (service/delete-account! (Integer/parseInt account-id)))))

  (DELETE "/admin/client/by-account/:account-id" [account-id :as request]
    (admin-only
     request
     #(response (service/delete-client-by-account-id! (Integer/parseInt account-id)))))

  (POST "/admin/delete-user-by-email" request
    (admin-only
     request
     #(let [{:keys [email]} (:body request)]
        (response (service/delete-user-by-email! email))))))

(defroutes app-routes
  public-routes
  (wrap-jwt-auth protected-routes)
  (route/not-found (response {:success false
                              :message "Rota não encontrada"})))

(def app
  (-> app-routes
      wrap-keyword-params
      wrap-params
      (wrap-json-body {:keywords? true})
      wrap-json-response
      (wrap-cors
       :access-control-allow-origin [#".*"]
       :access-control-allow-methods [:get :post :put :delete :options]
       :access-control-allow-headers ["Content-Type" "Authorization"])))