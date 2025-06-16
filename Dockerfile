FROM node:20-alpine
WORKDIR /opt/app
ADD *.json .
RUN npm install
ADD . .
CMD [ "node", "./index.js" ]