(ns mini-bank-clj.routes
  (:require [compojure.core :refer [defroutes GET POST routes]]
            [compojure.route :as route]
            [mini-bank-clj.service :as service]
            [mini-bank-clj.auth :refer [wrap-jwt-auth]]))

(defroutes public-routes
  (GET "/" []
    {:status 200
     :body {:message "Mini Bank API rodando com Clojure"}})

  (POST "/register" request
    (let [{:keys [name email password]} (:body request)]
      (service/register-user name email password)))

  (POST "/login" request
    (let [{:keys [email password]} (:body request)]
      (service/login-user email password))))

(defroutes protected-routes
  (GET "/dashboard" request
    (let [user (:identity request)]
      (service/get-dashboard-data (:id user))))

  (GET "/admin/users" request
    (service/get-admin-users request)))

(def app-routes
  (routes
   public-routes
   (wrap-jwt-auth protected-routes)
   (route/not-found {:status 404
                     :body {:error "Rota não encontrada"}})))