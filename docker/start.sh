#!/bin/bash 
# Copyright (C) 2018-2019 The Mypher Authors
#
# SPDX-License-Identifier: LGPL-3.0+
#

# 1 : envfile name

# check parameters
if [ $# -ne 1 ]; then
	echo "bash start.sh [envfile name] "
	exit
fi

# load enviroment valiable
ENVFILE=envfile/$1.env
export $(grep -v '^#' ${ENVFILE} | xargs)

PWD=$(cd $(dirname $0) && pwd)
SETTING=${PWD}/tmp/${UNAME}

# start docker
docker run \
	--rm \
	--name mypher_${UNAME} \
    --net host \
	-p ${PUBLISH_PORT_HTTP}:8888 \
	-p ${PUBLISH_PORT_APP}:8800 \
	-p ${PUBLISH_PORT_P2P}:9876 \
	-p ${PUBLISH_PORT_IPFS_GATEWAY}:7000 \
	-p ${PUBLISH_PORT_IPFS_API}:7100 \
	-p 4001:4001 \
	-p 5001:5001 \
	--env-file ${ENVFILE} \
	-v ${SETTING}/wallet:/root/eosio-wallet \
	-v ${PWD}/contracts:/contracts \
	-v ${PWD}/scripts:/scripts \
	-v ${PWD}/../app:/app \
	-v ${SETTING}/data/db:/data/db \
	-v ${SETTING}/data/work:/work \
	-v ${SETTING}/data/eosdata:/mnt/dev/data \
	-v ${SETTING}/data/config:/mnt/dev/config \
	-v ${SETTING}/data/keys:/keys \
	-v ${SETTING}/data/ipfs:/ipfs \
	mypher \
	/bin/bash -c "/scripts/start.sh"
#	/bin/bash -c "sleep 10000"

#	-d \
#	/bin/bash -c "sleep 10000"
