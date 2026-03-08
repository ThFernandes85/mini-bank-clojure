(ns mini-bank-clj.db)

(def accounts
  (atom
   {1 {:id 1 :name "Thiago" :balance 1000.0}
    2 {:id 2 :name "Maria"  :balance 500.0}}))

(def transactions
  (atom []))

(def transaction-seq
  (atom 0))