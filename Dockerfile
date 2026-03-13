FROM clojure:temurin-17-lein

WORKDIR /app

COPY . .

RUN lein deps

EXPOSE 10000

CMD ["lein", "run"]