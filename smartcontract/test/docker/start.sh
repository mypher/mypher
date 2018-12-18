#!/bin/bash 
# Copyright (C) 2018 The Mypher Authors
#
# SPDX-License-Identifier: LGPL-3.0+
#

# load enviroment valiable
ENVFILE=envfile/test.env
export $(grep -v '^#' ${ENVFILE} | xargs)

PWD=$(cd $(dirname $0) && pwd)

# start docker
docker run \
	--rm \
	--name mypher_test \
	-p ${PUBLISH_PORT_HTTP}:8888 \
	-p ${PUBLISH_PORT_APP}:8800 \
	-p ${PUBLISH_PORT_P2P}:9876 \
	-p ${PUBLISH_PORT_IPFS_GATEWAY}:7000 \
	-p ${PUBLISH_PORT_IPFS_API}:7100 \
	--env-file ${ENVFILE} \
	-v ${PWD}/../../../docker/contracts:/contracts \
	-v ${PWD}/../../../docker/scripts:/scripts \
	-v ${PWD}/../../../app:/app \
	-v ${PWD}/scripts:/testscripts \
	mypher \
	/bin/bash -c "/testscripts/init.sh"

