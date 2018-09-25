#!/bin/bash 
# Copyright (C) 2018 The Mypher Authors
#
# SPDX-License-Identifier: LGPL-3.0+
#

source /mnt/dev/config/mypher_config.ini

sleep 1
mongod &
sleep 15

function prepare_account_key() {
	PA_PRI=`cat /keys/$1.user | sed -n 1P | sed "s/Private key: \(.*\)/\1/"`
	PA_PUB=`cat /keys/$1.user | sed -n 2P | sed "s/Public key: \(.*\)/\1/"`
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
echo "# prepare default wallet"
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

echo "###############################"
echo "# prepare accounts"
echo "###############################"
if [ -n "$GENESIS" ]; then
	# TODO : make below process manually
	echo " - eosio"
	prepare_account_key eosio
	KEY_PR_PRI=${PA_PRI}
	KEY_PR_PUB=${PA_PUB}
	echo " - mypher@owner"
	prepare_account_key mypher_owner
	KEY_MYPHER_OWNER=${PA_PUB}
	echo " - mypher@active"
	prepare_account_key mypher_active
	KEY_MYPHER_ACTIVE=${PA_PUB}
fi

echo "###############################"
echo "# prepare config.ini"
echo "###############################"
cp -f /mnt/dev/config/base_config.ini /mnt/dev/config/config.ini

echo "###############################"
echo "# start node"
echo "###############################"
if [ -n "$GENESIS" ]; then
	echo "signature-provider = ${KEY_PR_PUB}=KEY:${KEY_PR_PRI}" >> /mnt/dev/config/config.ini
	nodeos --producer-name eosio \
		   --config-dir /mnt/dev/config \
		   -d /mnt/dev/data &
	sleep 10
	# prepare eosio.bios contract
	eosiohash=`cleos get code eosio`
	if [[ ${eosiohash:11} =~ ^[0]*$ ]]; then
		echo "###############################"
		echo "# deply eosio.bios to blockchain"
		echo "###############################"
		cleos set contract eosio /contracts/eosio.bios
	else
		echo "eosio.bios is already deployed....."
	fi
	#prepare mypher account
	if [ -z "`cleos get account mypher`" ]; then
		echo "account mypher is not found..."
		cleos create account eosio mypher ${KEY_MYPHER_OWNER} ${KEY_MYPHER_ACTIVE}
	else
		echo "account mypher is found..."
	fi
else
	echo "###############################"
	echo "# prepare ${UNAME} account"
	echo "###############################"
	if [ ! -e /keys/${UNAME}.user ]; then
		echo "key pair for ${UNAME} not found.."
		terminate
	fi 
	echo " - ${UNAME}"
	prepare_account_key ${UNAME}
	KEY_PR_PRI=${PA_PRI}
	KEY_PR_PUB=${PA_PUB}
	
	# TODO:check and register account if not found with genesis node
	
	echo "###############################"
	echo "# get p2p list from genesis node"
	echo "###############################"
	# TODO: get lists from genesis node
	cat /mnt/dev/config/p2plist.ini >> /mnt/dev/config/config.ini

	echo "signature-provider = ${KEY_PR_PUB}=KEY:${KEY_PR_PRI}" >> /mnt/dev/config/config.ini
	nodeos --producer-name ${UNAME} \
		   --config-dir /mnt/dev/config \
		   -d /mnt/dev/data &
fi 
if [ $? -ne 0 ]; then
	echo "nodeos is terminated."
	terminate
fi

while :
do
	sleep 10000
done
