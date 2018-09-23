#!/bin/bash 
# Copyright (C) 2018 The Mypher Authors
#
# SPDX-License-Identifier: LGPL-3.0+
#
docker exec -it mypher$1 /bin/bash -c "/scripts/stop.sh"
docker stop mypher$1 -t 30
