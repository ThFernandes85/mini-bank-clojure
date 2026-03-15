FROM clojure:temurin-17-lein

WORKDIR /app

COPY project.clj ./

RUN lein deps

COPY . .

EXPOSE 3000

CMD ["lein", "run"]