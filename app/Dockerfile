FROM node:16
WORKDIR app
COPY package.json .
COPY tsconfig.json .
RUN npm install
CMD npm run start