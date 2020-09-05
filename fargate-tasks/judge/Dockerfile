FROM ubuntu:20.04

ENV DEBIAN_FRONTEND noninteractive
RUN apt update -y
RUN apt install -y golang-1.14
ENV PATH $PATH:/usr/lib/go-1.14/bin/
RUN apt install -y python3.8

WORKDIR /usr/src/app
COPY . .
RUN go build .

ENTRYPOINT ./judge
