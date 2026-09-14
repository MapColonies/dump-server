FROM node:24

WORKDIR /usr/app

COPY ./package*.json ./
COPY .husky/ .husky/
RUN npm install
COPY . .

ENTRYPOINT ["node", "-r", "tsconfig-paths/register", "-r", "ts-node/register", "./node_modules/typeorm/cli.js"]
CMD ["migration:run"]
