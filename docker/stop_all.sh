#!/bin/bash 
# Copyright (C) 2018-2019 The Mypher Authors
#
# SPDX-License-Identifier: LGPL-3.0+
#

function stop_container() {
	docker exec mypher_$1 /bin/bash -c "/scripts/stop.sh"
	docker stop mypher_$1 -t 15
}

stop_container eosio &
stop_container myphersystem &
stop_container user &
