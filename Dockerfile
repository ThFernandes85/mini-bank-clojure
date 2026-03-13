FROM clojure:temurin-17-lein

WORKDIR /app

COPY mini-bank-clj/project.clj .

RUN lein deps

COPY mini-bank-clj .

EXPOSE 10000

CMD ["lein", "run"]