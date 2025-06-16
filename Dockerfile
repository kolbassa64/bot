FROM node:20
WORKDIR /opt/app
ADD . .
RUN npm install
CMD [ "node", "./index.js" ]