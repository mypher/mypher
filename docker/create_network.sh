#!/bin/bash 
# Copyright (C) 2018-2019 The Mypher Authors
#
# SPDX-License-Identifier: LGPL-3.0+
#

docker network create \
		-d bridge \
		--subnet 192.168.1.0/24 \
		--gateway 192.168.1.254 \
		-o 'com.docker.network.bridge.enable_icc=true' \
		-o 'com.docker.network.bridge.enable_ip_masquerade=false' \
		-o 'com.docker.network.bridge.host_binding_ipv4=0.0.0.0' \
		-o 'com.docker.network.bridge.name=br0' \
		-o 'com.docker.network.driver.mtu=1500' \
		myphernetwork

