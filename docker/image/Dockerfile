# Copyright (C) 2019 The Mypher Authors
#
# SPDX-License-Identifier: LGPL-3.0+
#

FROM eosio/builder as builder
ARG branch=release/1.7.x
ARG symbol=EOS

RUN apt-get update 
RUN apt-get -y install libcurl4 libcurl4-openssl-dev libusb-1.0
#RUN echo "deb http://archive.ubuntu.com/ubuntu precise main universe" > /etc/apt/sources.list
#RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 40976EAF437D05B5
#RUN apt-get update
# RUN apt-key adv --keyserver keyserver.ubuntu.com --keyserver-options http-proxy=http://localhost:3128 --recv-keys BBEBDCB318AD50EC6865090613B00F1FD2C19886
RUN apt-get -y install gpgv gpgsm gnupg-l10n gnupg dirmngr
RUN git clone -b $branch https://github.com/EOSIO/eos.git --recursive \
    && cd eos && echo "$branch:$(git rev-parse HEAD)" > /etc/eosio-version \
    && cmake -H. -B"/tmp/build" -GNinja -DCMAKE_BUILD_TYPE=Release -DWASM_ROOT=/opt/wasm -DCMAKE_CXX_COMPILER=clang++ \
       -DCMAKE_C_COMPILER=clang -DCMAKE_INSTALL_PREFIX=/tmp/build -DCORE_SYMBOL_NAME=$symbol \
    && cmake --build /tmp/build --target install

# mypher
RUN apt install -y aptitude
RUN aptitude -y install npm
RUN apt-get install -y nodejs npm
RUN npm cache clean
RUN npm install n -g
RUN apt-get install -y curl
RUN n stable
#RUN ln -sf /usr/local/bin/node /usr/bin/node
#RUN apt-get purge -y nodejs npm
RUN cd ~ && \
    curl -O https://dist.ipfs.io/go-ipfs/v0.4.17/go-ipfs_v0.4.17_linux-386.tar.gz && \
	tar xvfz go-ipfs_v0.4.17_linux-386.tar.gz && \
    cd go-ipfs && \
    ./install.sh
RUN apt-get install -y libkeyutils-dev

FROM ubuntu:18.04

RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get -y install openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /usr/local/lib/* /usr/local/lib/
COPY --from=builder /usr/lib/* /usr/lib/
COPY --from=builder /usr/bin/node /usr/bin/
COPY --from=builder /usr/local/bin/ipfs /usr/local/bin/ipfs
COPY --from=builder /lib/x86_64-linux-gnu/libusb-1.0.* /usr/local/lib/
COPY --from=builder /lib/x86_64-linux-gnu/libkeyutils.* /usr/local/lib/
COPY --from=builder /usr/lib/x86_64-linux-gnu/libcurl.* /usr/local/lib/
COPY --from=builder /tmp/build/bin /opt/eosio/bin
COPY --from=builder /eos/Docker/config.ini /
COPY --from=builder /etc/eosio-version /etc
COPY --from=builder /eos/Docker/nodeosd.sh /opt/eosio/bin/nodeosd.sh
ENV EOSIO_ROOT=/opt/eosio
RUN chmod +x /opt/eosio/bin/nodeosd.sh
ENV LD_LIBRARY_PATH /usr/local/lib:/usr/lib
ENV PATH /opt/eosio/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

