FROM node:20-alpine

RUN mkdir -p /opt/fua
WORKDIR /opt/fua

ENV NODE_ENV="production"
RUN npm install @fua/app.rc

ENV PATH="$PATH:/opt/fua/node_modules/.bin"
EXPOSE 3000

HEALTHCHECK CMD fua.app.rc.healthcheck
ENTRYPOINT fua.app.rc