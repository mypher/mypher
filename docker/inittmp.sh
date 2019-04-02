#!/bin/bash 
# Copyright (C) 2018-2019 The Mypher Authors
#
# SPDX-License-Identifier: LGPL-3.0+
#

# generating the blockchain network settings for development


BASE=tmp

function make_dir() {
	local root="${BASE}/$1"
	mkdir ${root}
	mkdir ${root}/data
	mkdir ${root}/wallet
	mkdir ${root}/data/config
	mkdir ${root}/data/db
	mkdir ${root}/data/eosdata
	mkdir ${root}/data/keys
	mkdir ${root}/data/work
	mkdir ${root}/data/ipfs
	cp envfile/swarm.key ${root}/data/ipfs/swarm.key_
	cp nodeenv/base_config.ini ${root}/data/config/
	cp nodeenv/mypher_config.ini ${root}/data/config/
	echo "enable-stale-production = $2" >> ${root}/data/config/base_config.ini
	cp nodeenv/p2plist.ini ${root}/data/config/
}

function copy_key() {
	cp nodeenv/keys/$1.owner ${BASE}/$2/data/keys/
	cp nodeenv/keys/$1.active ${BASE}/$2/data/keys/
}

rm -Rf ${BASE} 2>/dev/null
mkdir ${BASE}

make_dir eosio true
make_dir myphersystem false
make_dir user false

cp nodeenv/keys/eosio.owner ${BASE}/eosio/data/keys/
copy_key myphersystem eosio
copy_key testuser1111 eosio
copy_key testuser2222 eosio
copy_key testuser3333 eosio
copy_key testuser4444 eosio
copy_key myphersystem myphersystem


