FROM ubuntu:20.04

ENV DEBIAN_FRONTEND noninteractive
RUN apt update -y
RUN apt install -y ca-certificates

RUN apt install -y golang-1.14
ENV PATH $PATH:/usr/lib/go-1.14/bin/
RUN apt install -y python3.8
RUN apt install -y build-essential

RUN groupadd -r -g 400 code && useradd -r -u 400 -g 400 code

WORKDIR /usr/src/app
COPY . .
RUN go build .

ENTRYPOINT ./judge
