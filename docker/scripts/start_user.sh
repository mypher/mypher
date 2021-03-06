#!/bin/bash 
# Copyright (C) 2018-2019 The Mypher Authors
#
# SPDX-License-Identifier: LGPL-3.0+
#

# PREMISE:
#  the account is already created

# prepare the wallet
source /scripts/common.sh

function init_ipfs() {
	echo "###init ipfs"
	ipfs init
	cp /ipfs/swarm.key_ /ipfs/swarm.key
	ipfs bootstrap rm --all
}

function start_ipfs() {
	echo "###start ipfs"
	ipfs config Addresses.Gateway /ip4/0.0.0.0/tcp/7000
	ipfs config Addresses.API /ip4/0.0.0.0/tcp/7100
	ipfs daemon &
}

# prepare the wallet
prepare_wallet

echo "### start ipfs"
if [ ! -e ${IPFS_PATH}/config ]; then
	init_ipfs
fi
start_ipfs

echo "### prepare config.ini"
cp -f /mnt/dev/config/base_config.ini /mnt/dev/config/config.ini
# TODO: get lists from genesis node
cat /mnt/dev/config/p2plist.ini >> /mnt/dev/config/config.ini

nodeos \
   --config-dir /mnt/dev/config \
   --max-transaction-time=1000 \
   --verbose-http-errors \
   -d /mnt/dev/data &

wait2start

sleep 5
echo "### start node.js"
pushd /app/source
node --inspect=0.0.0.0 main.js &
popd

# /user/bin/node
#echo "import key to wallet"
#import_key2wallet $1.active
#import_key2wallet $2.owner

infinite_loop
