#!/bin/bash 
# Copyright (C) 2018-2019 The Mypher Authors
#
# SPDX-License-Identifier: LGPL-3.0+
#

source /mnt/dev/config/mypher_config.ini

sleep 1
mongod &
sleep 12
pushd /app/source
node main.js &
popd

function terminate() {
	ps ax | grep "nodeos" | grep -v grep | awk '{print $1}' | xargs kill
	ps ax | grep "mongod" | grep -v grep | awk '{print $1}' | xargs kill
	ps ax | grep "node" | grep -v grep | awk '{print $1}' | xargs kill
	sleep 10
	exit 1
}

echo "###############################"
echo "# prepare default wallet"
echo "###############################"
if [ ! -e /keys/wallet.txt ]; then
	cleos wallet create -f /keys/wallet.txt
else
	cleos wallet open
	WPASS=`cat /keys/wallet.txt`
	cleos wallet unlock --password ${WPASS}
fi

echo "###############################"
echo "# check environments"
echo "###############################"
echo "UNAME:${UNAME}"
if [ -z "${UNAME}" ]; then
	echo "name must be set"
	terminate
fi

echo "###############################"
echo "# start ipfs"
echo "###############################"
if [ ! -e ${IPFS_PATH}/config ]; then
	ipfs init
	cp /ipfs/swarm.key_ /ipfs/swarm.key
	ipfs bootstrap rm --all
	if [ -z "$GENESIS" ]; then
		node /scripts/bootstrap.js ${GENESIS_APP}
		if [ $? -ne 0 ]; then
			echo "failed to set bootstrap lists to ipfs"
			exit 1
		fi
	fi
fi
ipfs config Addresses.Gateway /ip4/0.0.0.0/tcp/7000
ipfs config Addresses.API /ip4/0.0.0.0/tcp/7100
ipfs daemon &

echo "###############################"
echo "# start node"
echo "###############################"

nodeos --producer-name eosio \
	   --config-dir /mnt/dev/config \
	   --max-transaction-time=1000 \
	   --verbose-http-errors \
	   -d /mnt/dev/data &
sleep 8

if [ $? -ne 0 ]; then
	echo "nodeos is terminated."
	terminate
fi

if [ -z $1 ]; then
	# wait for running of nodeos
	for i in {1..10}
	do
		result=`cleos set contract myphersystem /contracts/eosio.system`
		if [ -z $result ];
		then
			sleep 1
		else
			break
		fi
	done
	cleos set contract myphersystem /contracts/myphersystem
	while :
	do
		sleep 10000
	done
fi
