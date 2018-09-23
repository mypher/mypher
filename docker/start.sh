#!/bin/bash 
# Copyright (C) 2018 The Mypher Authors
#
# SPDX-License-Identifier: LGPL-3.0+
#

# 1 : path to envfile
# 2 : true if initialize blockchain

if [ $# -lt 1 ]; then
	echo "bash start.sh [path to envfile] [true if initialize blockchain]"
	exit
fi
export $(grep -v '^#' $1 | xargs)

PWD=$(cd $(dirname $0) && pwd)
SETTING=${PWD}/tmp/${UNAME}

docker run \
	--rm \
	--name mypher${UNAME} \
	-p ${PUBLISH_PORT_HTTP}:8888 \
	-p ${PUBLISH_PORT_P2P}:9876 \
	--env-file $1 \
	-e INIT=$2 \
	-v ${SETTING}/wallet:/root/eosio-wallet \
	-v ${PWD}/contracts:/contracts \
	-v ${PWD}/scripts:/scripts \
	-v ${SETTING}/data/db:/data/db \
	-v ${SETTING}/data/work:/work \
	-v ${SETTING}/data/eosdata:/mnt/dev/data \
	-v ${SETTING}/data/config:/mnt/dev/config \
	-v ${SETTING}/data/keys:/keys \
	mypher \
	/bin/bash -c "/scripts/start.sh"

#	-d \
#	/bin/bash -c "sleep 10000"
