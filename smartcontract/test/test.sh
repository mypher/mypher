#!/bin/bash 
# Copyright (C) 2018 The Mypher Authors
#
# SPDX-License-Identifier: LGPL-3.0+
#


PWD=$(cd $(dirname $0) && pwd)

echo 'starting test container...'

docker run --rm \
--name mypher_test1 \
-p 8888:8888 \
-p 8800:8800 \
-p 9876:9876 \
-p 7000:7000 \
-p 7100:7100 \
-v ${PWD}/../../docker/contracts:/contracts \
-v ${PWD}/../../docker/scripts:/scripts \
-v ${PWD}/dummy:/app/source \
-d \
mypher_test \
/bin/bash -c "/scripts/run.sh"

sleep 40

echo 'test container started.'

./node_modules/mocha/bin/mocha

echo 'terminating test container...'

docker exec -it mypher_test1 /bin/bash -c "/scripts/stop.sh"
docker stop mypher_test1 -t 15

echo 'test container terminalted.'
