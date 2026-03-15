(ns mini-bank-clj.utils.response)

(defn ok [data]
  {:status 200
   :body {:success true
          :data data}})

(defn created [data]
  {:status 201
   :body {:success true
          :data data}})

(defn bad-request [message]
  {:status 400
   :body {:success false
          :error message}})

(defn unauthorized [message]
  {:status 401
   :body {:success false
          :error message}})

(defn not-found [message]
  {:status 404
   :body {:success false
          :error message}})