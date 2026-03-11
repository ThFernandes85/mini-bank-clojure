(ns mini-bank-clj.core-test
  (:require [clojure.test :refer :all]
            [mini-bank-clj.service :as service]
            [mini-bank-clj.db.connection :refer [db-spec]]
            [mini-bank-clj.db.schema :as schema]
            [clojure.java.jdbc :as jdbc]))

(defn reset-db! []
  (schema/init-db)
  (jdbc/db-do-commands
   db-spec
   "DELETE FROM transactions;"
   "DELETE FROM accounts;"))

(use-fixtures :each
  (fn [test-fn]
    (reset-db!)
    (test-fn)
    (reset-db!)))

(deftest create-account-test
  (testing "Criar uma conta com sucesso"
    (let [result (service/create-account 1 "Thiago" 1000)]
      (is (= "Conta criada com sucesso" (:message result)))
      (is (= "Thiago" (:name (:account result))))
      (is (= 1000.0 (:balance (:account result)))))))

(deftest duplicate-account-test
  (testing "Não permitir conta duplicada"
    (service/create-account 1 "Thiago" 1000)
    (let [result (service/create-account 1 "Thiago" 1000)]
      (is (= "Conta já existe" (:error result))))))

(deftest deposit-test
  (testing "Realizar depósito com sucesso"
    (service/create-account 1 "Thiago" 1000)
    (let [result (service/deposit 1 200)]
      (is (= "Depósito realizado com sucesso" (:message result)))
      (is (= 1200.0 (:balance (:account result)))))))

(deftest insufficient-balance-transfer-test
  (testing "Não permitir transferência sem saldo suficiente"
    (service/create-account 1 "Thiago" 100)
    (service/create-account 2 "Maria" 500)
    (let [result (service/transfer 1 2 300)]
      (is (= "Saldo insuficiente" (:error result))))))