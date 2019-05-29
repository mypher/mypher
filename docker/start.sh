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

docker start -a mypher_$1
