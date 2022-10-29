FROM node:16

WORKDIR /app
COPY . .
RUN npm i sqlite3
RUN npm install

EXPOSE 3001
CMD ["npm", "run", "start"]
