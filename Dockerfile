FROM node:20

WORKDIR /app

COPY package*.json yarn.lock ./
RUN yarn install

COPY . .
COPY .env.example .env

RUN yarn build

RUN yarn global add serve

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]