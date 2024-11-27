# Usar uma imagem base oficial do Node.js
FROM node:18

# Definir o diretório de trabalho no contêiner
WORKDIR /app

# Copiar o arquivo package.json e package-lock.json (se existir)
COPY package*.json ./

# Instalar as dependências do projeto
RUN npm ci

# Copiar o restante do código do projeto
COPY . .

# Construir o aplicativo
RUN npm run build

# Expôr a porta que o aplicativo vai usar
EXPOSE 3000

# Comando para rodar o aplicativo
CMD ["npm", "run", "start"]