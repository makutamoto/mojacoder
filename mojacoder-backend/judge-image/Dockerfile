FROM ubuntu:22.04

SHELL ["/bin/bash", "-c"]

RUN apt update -y

WORKDIR /tmp

# golang 1.21
RUN apt install -y software-properties-common && \
    add-apt-repository ppa:longsleep/golang-backports && \
    apt update && \
    apt install -y golang-1.21-go
ENV PATH $PATH:/usr/lib/go-1.21/bin

# C/C++ GCC12 Boost(1.84.0) Eigen(3.4.0) GMP(6.3.0) AC-Library(1.5.1)
RUN apt install -y g++-12 gcc-12 build-essential m4 wget unzip && \
    wget https://boostorg.jfrog.io/artifactory/main/release/1.84.0/source/boost_1_84_0.tar.gz && \
    tar -zxf boost_1_84_0.tar.gz && \
    cd boost_1_84_0 && \
    ./bootstrap.sh --without-libraries=mpi,graph_parallel && \
    ./b2 -j4 toolset=gcc variant=release link=static runtime-link=static cxxflags="-std=gnu++23" stage && \
    ./b2 -j4 toolset=gcc variant=release link=static runtime-link=static cxxflags="-std=gnu++23" install && \
    cd /tmp && \
    wget https://github.com/atcoder/ac-library/releases/download/v1.5.1/ac-library.zip && \ 
    mkdir ac-library && \
    unzip ./ac-library.zip -d ./ac-library && \
    mv ./ac-library/atcoder /usr/local/include/ && \
    wget https://gmplib.org/download/gmp/gmp-6.3.0.tar.xz && \
    tar -xf gmp-6.3.0.tar.xz && \
    cd gmp-6.3.0 && \
    ./configure && \
    make && \
    make install && \
    cd /tmp && \
    wget https://gitlab.com/libeigen/eigen/-/archive/3.4.0/eigen-3.4.0.tar.gz && \
    tar -zxf eigen-3.4.0.tar.gz && \
    mv ./eigen-3.4.0/Eigen /usr/local/include/ && \
    rm -rf /tmp/*

# Python 3.11
COPY python_requirements.txt .
RUN apt install -y build-essential libbz2-dev libdb-dev git \
    libreadline-dev libffi-dev libgdbm-dev liblzma-dev \
    libncursesw5-dev libsqlite3-dev libssl-dev \
    zlib1g-dev uuid-dev && \
    wget https://www.python.org/ftp/python/3.11.6/Python-3.11.6.tar.xz && \
    tar -xf Python-3.11.6.tar.xz && \
    cd Python-3.11.6 && \
    ./configure --enable-optimizations --with-lto && \
    make -j4 && \
    make altinstall && \
    cd /tmp && \
    python3.11 -m pip install -r python_requirements.txt && \
    rm -rf /tmp/*

# PyPy 3.10-v7.3.13
COPY pypy_requirements.txt .
RUN apt install libgeos-dev -y && \
    wget https://downloads.python.org/pypy/pypy3.10-v7.3.13-linux64.tar.bz2 && \
    tar -xf pypy3.10-v7.3.13-linux64.tar.bz2 -C /usr/local && \
    /usr/local/pypy3.10-v7.3.13-linux64/bin/pypy3 -m ensurepip && \
    /usr/local/pypy3.10-v7.3.13-linux64/bin/pypy3 -m pip install -U pip wheel && \
    /usr/local/pypy3.10-v7.3.13-linux64/bin/pypy3 -m pip install -r pypy_requirements.txt && \
    rm -rf /tmp/*
ENV PATH $PATH:/usr/local/pypy3.10-v7.3.13-linux64/bin

# java openjdk-21 ac-library-java-1.0.0
RUN wget https://download.java.net/java/GA/jdk21.0.1/415e3f918a1f4062a0074a2794853d0d/12/GPL/openjdk-21.0.1_linux-x64_bin.tar.gz && \
    mkdir -p /usr/local/java && \
    tar -xzf openjdk-21.0.1_linux-x64_bin.tar.gz -C /usr/local/java && \ 
    export JAVA_HOME=/usr/local/java/jdk-21.0.1 && \
    export PATH=$JAVA_HOME/bin:$PATH && \
    mkdir -p /usr/local/ac-library-java && \
    wget https://github.com/ocha98/ac-library-java/archive/refs/tags/1.0.0.tar.gz && \
    tar -xzf 1.0.0.tar.gz && \
    cd ac-library-java-1.0.0 && \
    chmod +x builder.sh && ./builder.sh && \
    cp ./src/bin/ac_library.jar /usr/local/ac-library-java/ac_library.jar && \
    cd /tmp && \
    rm -rf /tmp/*
ENV JAVA_HOME /usr/local/java/jdk-21.0.1
ENV PATH $PATH:$JAVA_HOME/bin

# Kotlin 1.9.21
RUN apt install -y curl zip && \
    curl -s https://get.sdkman.io | bash && \
    source ~/.sdkman/bin/sdkman-init.sh && \
    sdk install kotlin 1.9.21 && \
    rm -rf /tmp/*

# bf 20041219
RUN apt install -y bf

# Nim 1.6.16 
RUN curl https://nim-lang.org/choosenim/init.sh -sSf -o init.sh && \
    sh init.sh -y && \
    export PATH=/root/.nimble/bin:$PATH && \
    choosenim 1.6.16 && \
    nimble install neo -y && \
    apt install -y libopenblas-base -y && \
    nimble install https://github.com/zer0-star/Nim-ACL && \
    nimble install bignum -y && \
    rm -rf /tmp/*
ENV PATH $PATH:/root/.nimble/bin

# Rust 1.75.0
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y  && \
    /root/.cargo/bin/rustup default 1.75.0 && \
    export PATH=$PATH:/root/.cargo/bin && \
    cargo install --git https://github.com/rust-lang-ja/atcoder-rustc-dep-option-generator.git && \
    rm -rf /tmp/*
ENV PATH $PATH:/root/.cargo/bin

# Ruby 3.2.2
RUN apt install -y bison libreadline6-dev libncurses5-dev build-essential libssl-dev libyaml-dev zlib1g-dev libffi-dev libgmp-dev libreadline-dev && \
    wget https://cache.ruby-lang.org/pub/ruby/3.2/ruby-3.2.2.tar.gz && \
    tar -xzf ruby-3.2.2.tar.gz && \
    cd ruby-3.2.2 && \
    ./configure && \
    make install && \
    gem install rbtree ac-library-rb faster_prime sorted_set numo-narray && \
    cd /tmp && \
    rm -rf /tmp/*

# Common Lisp 2.1.11
RUN apt install -y sbcl

# C# mono6.12.0
RUN apt install -y gnupg ca-certificates && \
    gpg --homedir /tmp --no-default-keyring --keyring /usr/share/keyrings/mono-official-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 3FA7E0328081BFF6A14DA29AA6A19B38D3D831EF && \
    echo "deb [signed-by=/usr/share/keyrings/mono-official-archive-keyring.gpg] https://download.mono-project.com/repo/ubuntu stable-focal/snapshots/6.12.0 main" | tee /etc/apt/sources.list.d/mono-official-stable.list && \
    apt update && \
    apt install -y mono-devel

RUN groupadd -r -g 400 code && useradd -r -u 400 -g 400 code

WORKDIR /usr/src/app
COPY . .
RUN go build .

WORKDIR /usr/src/app/rust
RUN cargo build --release

RUN apt install -y curl

WORKDIR /usr/src/app
ENTRYPOINT ./judge
