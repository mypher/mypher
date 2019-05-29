#!/bin/bash 
# Copyright (C) 2018 The Mypher Authors
#
# SPDX-License-Identifier: LGPL-3.0+
#
. ../ver.properties

echo ${IMAGEVER}
docker build . -t mypher/mypher:${IMAGEVER} --network=host -f Dockerfile
