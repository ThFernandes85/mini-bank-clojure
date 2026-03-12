FROM clojure:temurin-17-lein

WORKDIR /app

# copiar primeiro apenas o project.clj
COPY project.clj .

# baixar dependências
RUN lein deps

# agora copiar o restante do projeto
COPY . .

EXPOSE 10000

CMD ["lein", "run"]