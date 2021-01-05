FROM ubuntu:20.04

ENV DEBIAN_FRONTEND noninteractive
RUN apt update -y
RUN apt install -y gnupg ca-certificates
RUN sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 3FA7E0328081BFF6A14DA29AA6A19B38D3D831EF
RUN echo "deb https://download.mono-project.com/repo/ubuntu stable-focal main" | sudo tee /etc/apt/sources.list.d/mono-official-stable.list
RUN apt update

RUN apt install -y golang-1.14
ENV PATH $PATH:/usr/lib/go-1.14/bin/
RUN apt install -y python3.8 build-essential mono-devel

RUN groupadd -r -g 400 code && useradd -r -u 400 -g 400 code

WORKDIR /usr/src/app
COPY . .
RUN go build .

ENTRYPOINT ./judge
