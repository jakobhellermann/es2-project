FROM node:20.12.2-alpine as frontend

WORKDIR /build

COPY frontend/package.json frontend/yarn.lock /build/

RUN yarn install --frozen-lockfile

COPY frontend /build

RUN yarn build

FROM python:3.12 as app

USER root

RUN apt update && apt install -y ffmpeg

RUN pip install --upgrade pip

WORKDIR /app

COPY backend/requirements.txt requirements.txt

RUN pip install -r requirements.txt

COPY backend /app

COPY --from=frontend /build/dist/frontend/browser /app/frontend

RUN mkdir /app/data

ENTRYPOINT /app/entrypoint.sh
