FROM node:20.9.0-alpine3.18
RUN addgroup app && adduser -S -G app app
USER app

COPY --chown=app:app package*.json /app/
WORKDIR /app

RUN npm install

COPY --chown=app:app . .

EXPOSE 3005

CMD ["node", "index.js"]