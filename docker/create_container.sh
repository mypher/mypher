#!/bin/bash 
# Copyright (C) 2018-2019 The Mypher Authors
#
# SPDX-License-Identifier: LGPL-3.0+
#

# 1 : envfile name

# check parameters
if [ $# -ne 1 ]; then
	echo "bash create_container.sh [envfile name]"
	exit
fi

function create_container() {
	# load enviroment valiable
	local envfile=envfile/$1.env
	export $(grep -v '^#' ${envfile} | xargs)
	
	local cur=$(cd $(dirname $0) && pwd)
	local cname="mypher_$1"
	local spath=${cur}/tmp/$1
	
	docker container rm ${cname} 

	#	--privileged \
	#	-p ${PUBLISH_PORT_HTTP}:8888 \
	#	-p ${PUBLISH_PORT_APP}:8800 \
	#	-p ${PUBLISH_PORT_P2P}:9876 \
	#	-p ${PUBLISH_PORT_IPFS_GATEWAY}:7000 \
	#	-p ${PUBLISH_PORT_IPFS_API}:7100 \
	#	-p 4001:4001 \
	#	-p 5001:5001 \
	# start docker
	docker create \
		--rm \
		--name ${cname} \
		--env-file ${envfile} \
		-v ${spath}/wallet:/root/eosio-wallet \
		-v ${cur}/contracts:/contracts \
		-v ${cur}/scripts:/scripts \
		-v ${cur}/../app:/app \
		-v ${spath}/data/db:/data/db \
		-v ${spath}/data/work:/work \
		-v ${spath}/data/eosdata:/mnt/dev/data \
		-v ${spath}/data/config:/mnt/dev/config \
		-v ${spath}/data/keys:/keys \
		-v ${spath}/data/ipfs:/ipfs \
		mypher \
		/bin/bash -c ${RUN_SCRIPT}

	#docker network connect --ip 192.168.1.$2 myphernetwork ${cname}
	docker network connect --alias ${cname} myphernetwork ${cname}
	docker network connect host ${cname}
}

create_container $1
