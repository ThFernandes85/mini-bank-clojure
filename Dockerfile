FROM clojure:temurin-17-lein

WORKDIR /app

COPY project.clj ./
RUN lein deps

COPY . .

EXPOSE 10000

CMD ["sh", "-c", "lein run"]