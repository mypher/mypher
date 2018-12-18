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
-v ${PWD}/../../app:/app \
-d \
mypher_test \
/bin/bash -c "/scripts/run.sh"

sleep 30

echo 'test container started.'

./mocha

echo 'terminating test container...'

docker exec -it mypher_test1 /bin/bash -c "/scripts/stop.sh"
docker stop mypher_test1 -t 15

echo 'test container terminalted.'
