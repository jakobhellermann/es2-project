FROM node:20.12.2-alpine as frontend

WORKDIR /build

COPY frontend/package.json frontend/yarn.lock /build/

RUN yarn install --frozen-lockfile

COPY frontend /build

RUN yarn build

FROM python:3.12 as app

ARG PIPER_ARCH='x86_64'
ARG PIPER_VERSION='2023.11.14-2'

USER root

RUN apt update && apt install -y ffmpeg

RUN curl -L -s \
        "https://github.com/rhasspy/piper/releases/download/${PIPER_VERSION}/piper_linux_${PIPER_ARCH}.tar.gz" \
        | tar -zxvf - -C /usr/share \
    && ln -s /usr/share/piper/piper /usr/bin/piper

RUN pip install --upgrade pip

WORKDIR /app

COPY backend/requirements.txt requirements.txt

RUN pip install -r requirements.txt

COPY backend /app

COPY --from=frontend /build/dist/frontend/browser /app/frontend

RUN mkdir /app/data

ENV PIPER_TTS_BIN=/usr/bin/piper

EXPOSE 8080

ENTRYPOINT /app/entrypoint.sh
