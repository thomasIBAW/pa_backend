FROM node:20.9.0-alpine3.18
RUN addgroup app && adduser -S -G app app
USER app

COPY --chown=app:app package*.json /app/
WORKDIR /app

RUN npm install

COPY --chown=app:app . .

# Set build arguments as environment variables
ARG BACKEND
ARG DEVSTATE

ENV BACKEND=$BACKEND
ENV DEVSTATE=$DEVSTATE



EXPOSE 3005

CMD ["node", "index.js"]