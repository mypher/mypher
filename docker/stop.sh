#!/bin/bash 
# Copyright (C) 2018-2019 The Mypher Authors
#
# SPDX-License-Identifier: LGPL-3.0+
#

# check parameters
if [ $# -ne 1 ]; then
	echo "bash stop.sh [container name]"
	exit
fi

docker exec -it mypher_$1 /bin/bash -c "/scripts/stop.sh"
docker stop mypher_$1 -t 15
