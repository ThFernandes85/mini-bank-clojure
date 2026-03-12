(defproject mini-bank-clj "0.1.0-SNAPSHOT"
  :description "Mini banco em Clojure inspirado em APIs funcionais"
  :url "https://mini-bank-clojure.vercel.app"

  :dependencies [[org.clojure/clojure "1.11.1"]
                 [org.clojure/java.jdbc "0.7.12"]
                 [ring/ring-core "1.9.6"]
                 [ring/ring-jetty-adapter "1.9.6"]
                 [ring/ring-json "0.5.1"]
                 [ring-cors "0.1.13"]
                 [compojure "1.7.0"]
                 [org.xerial/sqlite-jdbc "3.42.0.0"]
                 [buddy/buddy-auth "3.0.323"]
                 [buddy/buddy-hashers "2.0.167"]
                 [buddy/buddy-sign "3.5.351"]]

  :main mini-bank-clj.core)