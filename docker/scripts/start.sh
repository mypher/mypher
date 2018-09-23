#!/bin/bash 
# Copyright (C) 2018 The Mypher Authors
#
# SPDX-License-Identifier: LGPL-3.0+
#

sleep 1
mongod &
sleep 15

function prepare_account_key() {
	local PA_PRI=`cat /keys/$1.user | sed -n 1P | sed "s/Private key: \(.*\)/\1/"`
	PA_PUB=`cat /keys/$1.user | sed -n 2P | sed "s/Public key: \(.*\)/\1/"`
	cleos wallet keys
	if [ `cleos wallet keys | grep ${PA_PUB} | wc -l` -eq 0 ]; then
		cleos wallet import --private-key ${PA_PRI}
	fi
}

function terminate() {
	ps ax | grep "nodeos" | grep -v grep | awk '{print $1}' | xargs kill
	ps ax | grep "mongod" | grep -v grep | awk '{print $1}' | xargs kill
	sleep 10
	exit 1
}


echo "###############################"
echo "# prepare wallet"
echo "###############################"
if [ ! -e /keys/wallet.txt ]; then
	cleos wallet create -f /keys/wallet.txt
else
	cleos wallet open
	WPASS=`cat /keys/wallet.txt`
	cleos wallet unlock --password ${WPASS:1:53}
fi

echo "###############################"
echo "# check environments"
echo "###############################"
echo "UNAME:${UNAME}"
if [ -z "${UNAME}" ]; then
	echo "name must be set"
	terminate
fi
if [ ! -e /keys/eosio.user ]; then
	echo "eosio.io is not exists"
	terminate
fi

echo "###############################"
echo "# prepare eosio account"
echo "###############################"
prepare_account_key eosio

echo "###############################"
echo "# start node"
echo "###############################"
if [ -n "$GENESIS" ]; then
	nodeos --enable-stale-production \
		   --producer-name eosio \
		   --plugin eosio::chain_api_plugin \
		   --plugin eosio::net_api_plugin \
		   --plugin eosio::mongo_db_plugin \
		   --plugin eosio::producer_plugin \
		   --plugin eosio::history_plugin \
		   --plugin eosio::history_api_plugin \
		   --plugin eosio::http_plugin \
		   -d /mnt/dev/data \
		   --config-dir /mnt/dev/config \
		   --http-server-address=0.0.0.0:8888 \
		   --access-control-allow-origin=* \
		   --http-validate-host=false \
		   --mongodb-uri=mongodb://127.0.0.1:27017/mypher \
		   --contracts-console &
	sleep 10
	# prepare eosio.bios contract
	if [ -n "${INIT}" ]; then
		cleos set contract eosio /contracts/eosio.bios 
	fi
else
	if [ ! -e /keys/${UNAME}.user ]; then
		cleos create key --file /keys/${UNAME}.user
		prepare_account_key ${UNAME}
		cleos -u ${CONNECT_TO} create account eosio ${UNAME} ${PA_PUB} ${PA_PUB}
		if [ $? -ne 0 ]; then
			echo "failed to create acount : ${UNAME}"
			terminate
		fi
	else
		prepare_account_key ${UNAME}
	fi 
	nodeos --producer-name ${UNAME} \
		   --plugin eosio::chain_api_plugin \
		   --plugin eosio::net_api_plugin \
		   --plugin eosio::mongo_db_plugin \
		   --plugin eosio::producer_plugin \
		   --plugin eosio::history_plugin \
		   --plugin eosio::history_api_plugin \
		   --plugin eosio::http_plugin \
		   -d /mnt/dev/data \
		   --config-dir /mnt/dev/config \
		   --http-server-address=0.0.0.0:8888 \
		   --access-control-allow-origin=* \
		   --http-validate-host=false \
		   --p2p-peer-address ${CONNECT_P2P_TO} \
		   --mongodb-uri=mongodb://127.0.0.1:27017/mypher \
		   --contracts-console &
	sleep 10
	# set producer
	if [ -n "${INIT}" ]; then
		cleos push action eosio setprods \
			"{ \"schedule\": [{\"producer_name\": \"${UNAME}\",\"block_signing_key\": \"${PA_PUB}\"}]}" \
			-p eosio@active
	fi
fi 
if [ $? -ne 0 ]; then
	echo "nodeos is terminated."
	terminate
fi

while :
do
	sleep 10000
done
