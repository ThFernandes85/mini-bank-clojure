(defproject mini-bank-clj "0.1.0-SNAPSHOT"
  :description "Mini banco em Clojure inspirado em APIs funcionais"
  :url "http://example.com"

  :dependencies [[org.clojure/clojure "1.11.1"]
                 [ring/ring-core "1.12.1"]
                 [ring/ring-jetty-adapter "1.12.1"]
                 [ring/ring-json "0.5.1"]
                 [compojure "1.7.1"]
                 [org.clojure/java.jdbc "0.7.12"]
                 [org.xerial/sqlite-jdbc "3.46.0.0"]
                 [org.postgresql/postgresql "42.7.3"]
                 [buddy/buddy-hashers "2.0.167"]
                 [buddy/buddy-sign "3.5.351"]]

  :main mini-bank-clj.core)