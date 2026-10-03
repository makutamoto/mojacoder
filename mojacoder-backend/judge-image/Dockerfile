FROM ubuntu:22.04

SHELL ["/bin/bash", "-c"]

# The judge, language toolchains and seccomp launcher must all be native ARM64.
RUN test "$(dpkg --print-architecture)" = arm64 && apt update -y

WORKDIR /tmp

# golang 1.21
RUN apt install -y software-properties-common && \
    add-apt-repository ppa:longsleep/golang-backports && \
    apt update && \
    apt install -y golang-1.21-go
ENV PATH $PATH:/usr/lib/go-1.21/bin

# C/C++ GCC12 Boost(1.84.0) Eigen(3.4.0) GMP(6.2.0) AC-Library(1.5.1)
RUN apt install -y g++-12 gcc-12 build-essential m4 wget unzip libgmp-dev  && \
    wget https://github.com/boostorg/boost/releases/download/boost-1.84.0/boost-1.84.0.tar.gz && \
    wget https://github.com/atcoder/ac-library/releases/download/v1.5.1/ac-library.zip && \ 
    wget https://gitlab.com/libeigen/eigen/-/archive/3.4.0/eigen-3.4.0.tar.gz && \
    tar -zxf boost-1.84.0.tar.gz && \
    cd boost-1.84.0 && \
    ./bootstrap.sh --without-libraries=mpi,graph_parallel && \
    ./b2 -j4 toolset=gcc variant=release link=static runtime-link=static cxxflags="-std=gnu++23" stage && \
    ./b2 -j4 toolset=gcc variant=release link=static runtime-link=static cxxflags="-std=gnu++23" install && \
    cd /tmp && \
    mkdir ac-library && \
    unzip ./ac-library.zip -d ./ac-library && \
    mv ./ac-library/atcoder /usr/local/include/ && \
    cd /tmp && \
    tar -zxf eigen-3.4.0.tar.gz && \
    mv ./eigen-3.4.0/Eigen /usr/local/include/ && \
    rm -rf /tmp/*

# Python 3.11
COPY python_requirements.txt python_build_constraints.txt ./
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/Tokyo
RUN apt update && apt install -y tzdata
RUN add-apt-repository ppa:deadsnakes/ppa && \
    apt update && \
    apt install -y python3.11 python3.11-dev git cmake pkg-config libopenblas-dev && \
    wget https://bootstrap.pypa.io/get-pip.py && \
    python3.11 get-pip.py && \
    python3.11 -m pip install --upgrade pip==26.2.1 wheel==0.48.0 && \
    MAKE_NPROCS=2 python3.11 -m pip install --build-constraint python_build_constraints.txt -r python_requirements.txt && \
    rm -rf /tmp/*

# PyPy 3.10-v7.3.13
# Reuse CPython's interpreter-independent cppyy-cling wheel instead of rebuilding LLVM.
COPY pypy_requirements.txt python_build_constraints.txt ./
RUN apt install libgeos-dev -y && \
    wget https://downloads.python.org/pypy/pypy3.10-v7.3.13-aarch64.tar.bz2 && \
    tar -xf pypy3.10-v7.3.13-aarch64.tar.bz2 -C /usr/local && \
    /usr/local/pypy3.10-v7.3.13-aarch64/bin/pypy3 -m ensurepip && \
    /usr/local/pypy3.10-v7.3.13-aarch64/bin/pypy3 -m pip install --upgrade pip==26.2.1 wheel==0.48.0 && \
    mkdir -p /tmp/cppyy-wheels && \
    find /root/.cache/pip/wheels -name 'cppyy_cling-*.whl' -exec cp {} /tmp/cppyy-wheels \; && \
    PIP_FIND_LINKS=/tmp/cppyy-wheels MAKE_NPROCS=2 /usr/local/pypy3.10-v7.3.13-aarch64/bin/pypy3 -m pip install --build-constraint python_build_constraints.txt -r pypy_requirements.txt && \
    rm -rf /tmp/*
ENV PATH $PATH:/usr/local/pypy3.10-v7.3.13-aarch64/bin

# java openjdk-21 ac-library-java-1.0.0
RUN wget https://download.java.net/java/GA/jdk21.0.1/415e3f918a1f4062a0074a2794853d0d/12/GPL/openjdk-21.0.1_linux-aarch64_bin.tar.gz && \
    mkdir -p /usr/local/java && \
    tar -xzf openjdk-21.0.1_linux-aarch64_bin.tar.gz -C /usr/local/java && \
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

# Nim 1.6.16 (choosenim has no Linux ARM64 binary; bootstrap the same release)
RUN wget https://nim-lang.org/download/nim-1.6.16.tar.xz && \
    mkdir -p /root/.choosenim/toolchains && \
    tar -xf nim-1.6.16.tar.xz -C /root/.choosenim/toolchains && \
    cd /root/.choosenim/toolchains/nim-1.6.16 && \
    sh build.sh && \
    bin/nim c -d:release koch && \
    ./koch nimble && \
    export PATH=/root/.choosenim/toolchains/nim-1.6.16/bin:$PATH && \
    nimble install neo -y && \
    apt install -y libopenblas-base -y && \
    nimble install https://github.com/zer0-star/Nim-ACL && \
    nimble install bignum -y && \
    cd /tmp && \
    rm -rf /tmp/*
ENV NIMBLE_DIR /root/.nimble
# Use the pinned compiler directly with the isolated HOME used for compilation.
ENV PATH /root/.choosenim/toolchains/nim-1.6.16/bin:$PATH:/root/.nimble/bin

# Rust 1.75.0
RUN apt install -y  libssl-dev && \
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y  && \
    /root/.cargo/bin/rustup default 1.75.0 && \
    rm -rf /tmp/*
ENV CARGO_HOME /root/.cargo
ENV RUSTUP_HOME /root/.rustup
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
RUN cargo build --release && \
    python3.11 rustc_dep_options.py --manifest-path Cargo.toml > rustc-options

RUN chmod 0711 /root && \
    chmod -R a+rX /root/.cargo /root/.choosenim /root/.nimble /root/.rustup /root/.sdkman /usr/src/app/rust

RUN apt install -y curl libseccomp-dev

WORKDIR /usr/src/app
RUN gcc -O2 -Wall -Wextra -Werror sandbox/sandbox.c -lseccomp -o /usr/local/bin/mojacoder-sandbox && \
    /usr/local/bin/mojacoder-sandbox --self-test && \
    env -i PATH="$PATH" HOME=/tmp/mojacoder-nim-home NIMBLE_DIR="$NIMBLE_DIR" nim --version | \
    grep -F "Nim Compiler Version 1.6.16"
ENTRYPOINT ./judge
