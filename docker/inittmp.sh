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
mkdir ${BASE}/data/woek
cp tmp/eosio.user ${BASE}/data/keys/

