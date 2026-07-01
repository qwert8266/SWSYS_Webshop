FROM node:24.16-alpine

WORKDIR SWSYS_Webshop/frontend

COPY package.json .

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]