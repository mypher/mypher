#!/bin/bash 
# Copyright (C) 2018 The Mypher Authors
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

#TODO: erase in the future
# generate key for the account
if [ ! -e ${SETTING}/data/keys/${UNAME}.user ]; then
	cleos create key -f ${SETTING}/data/keys/${UNAME}.user
	cat ${SETTING}/data/keys/${UNAME}.user
	read -p "Please register the account and enter key"
fi

# start docker
docker run \
	--rm \
	--name mypher_${UNAME} \
	-p ${PUBLISH_PORT_HTTP}:8888 \
	-p ${PUBLISH_PORT_P2P}:9876 \
	--env-file ${ENVFILE} \
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
