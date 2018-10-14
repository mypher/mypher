#!/bin/bash 
# Copyright (C) 2018 The Mypher Authors
#
# SPDX-License-Identifier: LGPL-3.0+
#

BASE=tmp/$1

if [ $# -ne 1 ]; then
	echo "bash inittmp.sh [username]"
	exit
fi
rm -Rf ${BASE} 2>/dev/null
mkdir ${BASE}
mkdir ${BASE}/data
mkdir ${BASE}/wallet
mkdir ${BASE}/data/config
mkdir ${BASE}/data/db
mkdir ${BASE}/data/eosdata
mkdir ${BASE}/data/keys
mkdir ${BASE}/data/work
mkdir ${BASE}/data/ipfs
cp envfile/swarm.key ${BASE}/data/ipfs/swarm.key_
cp nodeenv/base_config.ini ${BASE}/data/config/
cp nodeenv/mypher_config.ini ${BASE}/data/config/
if [ "$1" = "eosio" ]; then
	cp nodeenv/eosio.user ${BASE}/data/keys/
	echo "export GENESIS=true" >> ${BASE}/data/config/mypher_config.ini
	echo "enable-stale-production = true" >> ${BASE}/data/config/base_config.ini
else
	cp nodeenv/p2plist.ini ${BASE}/data/config/
	echo "enable-stale-production = false" >> ${BASE}/data/config/base_config.ini
fi
