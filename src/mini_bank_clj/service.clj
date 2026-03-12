(ns mini-bank-clj.service
  (:require [clojure.java.jdbc :as jdbc]
            [mini-bank-clj.db.connection :refer [db-spec]]
            [mini-bank-clj.auth :refer [generate-token]]))

(defn find-user-by-email [email]
  (first
   (jdbc/query
    (db-spec)
    ["SELECT * FROM users WHERE email = ?" email])))

(defn list-users []
  (jdbc/query
   (db-spec)
   ["SELECT id, name, email, role FROM users ORDER BY id ASC"]))

(defn register-user [name email password]
  (if (find-user-by-email email)
    {:status 400
     :body {:error "Usuário já existe"}}
    (do
      (jdbc/insert!
       (db-spec)
       :users
       {:name name
        :email email
        :password password
        :role "USER"})
      {:status 201
       :body {:message "Usuário cadastrado com sucesso"}})))

(defn login-user [email password]
  (let [user (find-user-by-email email)]
    (println "DEBUG LOGIN USER => " user)
    (if (and user (= password (:password user)))
      (let [token (generate-token {:id (:id user)
                                   :name (:name user)
                                   :email (:email user)
                                   :role (:role user)})]
        {:status 200
         :body {:message "Login realizado com sucesso"
                :token token
                :user {:id (:id user)
                       :name (:name user)
                       :email (:email user)
                       :role (:role user)}}})
      {:status 401
       :body {:error "Email ou senha inválidos"}})))

(defn get-dashboard-data [user-id]
  (let [accounts
        (jdbc/query
         (db-spec)
         ["SELECT * FROM accounts"])]
    {:status 200
     :body {:accounts accounts
            :user-id user-id}}))

(defn get-admin-users [request]
  (let [user (:identity request)]
    (println "DEBUG ADMIN USER => " user)
    (if (= "ADMIN" (:role user))
      {:status 200
       :body {:users (list-users)}}
      {:status 403
       :body {:error "Acesso negado. Apenas ADMIN pode acessar."}})))