#!/bin/bash 
# Copyright (C) 2018-2019 The Mypher Authors
#
# SPDX-License-Identifier: LGPL-3.0+
#

source /mnt/dev/config/mypher_config.ini

function onstart() {
	while :
	do
		sleep 10000
	done
}
export -f onstart
bash -c /scripts/main.sh

