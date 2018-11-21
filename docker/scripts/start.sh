#!/bin/bash 
# Copyright (C) 2018 The Mypher Authors
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

function create_account() {
	if [ -z "`cleos -u ${NODE_URL} get account $1`" ]; then
		echo "create account:$1..."
		cleos create key --file /keys/$1.owner
		cleos create key --file /keys/$1.active
		local OW_PRI=`cat /keys/$1.owner | sed -n 1P | sed "s/Private key: \(.*\)/\1/"`
		local OW_PUB=`cat /keys/$1.owner | sed -n 2P | sed "s/Public key: \(.*\)/\1/"`
		AC_PRI=`cat /keys/$1.active | sed -n 1P | sed "s/Private key: \(.*\)/\1/"`
		AC_PUB=`cat /keys/$1.active | sed -n 2P | sed "s/Public key: \(.*\)/\1/"`
		cleos wallet import --private-key ${OW_PRI}
		cleos wallet import --private-key ${AC_PRI}
		if [ -z "$2" ]; then
			cleos -u ${NODE_URL} create account eosio $1 ${OW_PUB} ${AC_PUB}
			if [ $? -ne 0 ]; then
				echo "failed to create account $1"
				terminate
			fi
		else
			local ret=`curl -H 'Content-Type:application/json' -d '{"jsonrpc":"2.0","id":1,"method":"system.reg_account","params":[{"id":"'$1'","owner":"'${OW_PUB}'", "active":"'${AC_PUB}'"}]}' ${GENESIS_APP}`
			if [ -n "`echo ${ret} | grep 'error'`" ]; then
				echo "${ret}"
				terminate
			fi
		fi
	else
		echo "account:$1 is already created..."
		AC_PRI=`cat /keys/$1.active | sed -n 1P | sed "s/Private key: \(.*\)/\1/"`
		AC_PUB=`cat /keys/$1.active | sed -n 2P | sed "s/Public key: \(.*\)/\1/"`
	fi
}

function create_contract() {
	local hash=`cleos -u ${NODE_URL} get code $1`
	if [[ ${hash:11} =~ ^[0]*$ ]]; then
		echo "deply contract:$1 to blockchain"
		cleos -u ${NODE_URL} set contract $1 /contracts/$1
	else
		echo "contract:$1 is already deployed....."
	fi
}

function create_contract2() {
	local hash=`cleos -u ${NODE_URL} get code $1`
	if [[ ${hash:11} =~ ^[0]*$ ]]; then
		echo "deply contract:$1 to blockchain"
		cleos -u ${NODE_URL} set contract $1 /contracts/$2
	else
		echo "contract:$1 is already deployed....."
	fi
}

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
echo "# prepare config.ini"
echo "###############################"
cp -f /mnt/dev/config/base_config.ini /mnt/dev/config/config.ini

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
if [ -n "$GENESIS" ]; then
	NODE_URL="http://127.0.0.1:8888"
	prepare_account_key eosio
	echo "signature-provider = ${PA_PUB}=KEY:${PA_PRI}" >> /mnt/dev/config/config.ini
	nodeos --producer-name eosio \
		   --config-dir /mnt/dev/config \
		   --max-transaction-time=1000 \
		   --verbose-http-errors \
		   -d /mnt/dev/data &
	sleep 8
	create_account eosio.msig
	create_account eosio.sudo
	create_account eosio.token
	create_account eosio.bpay
	create_account eosio.names
	create_account eosio.ram
	create_account eosio.ramfee
	create_account eosio.saving
	create_account eosio.stake
	create_account eosio.vpay
	create_account myphersystem
	sleep 1
	create_contract eosio.msig
	create_contract eosio.sudo
	create_contract eosio.token
	cleos push action eosio.token create '[ "eosio", "10000000000.0000 SYS" ]' -p eosio.token@active
	cleos push action eosio.token issue '[ "eosio", "50000000.0000 SYS", "memo" ]' -p eosio@active
	sleep 1
	create_contract2 eosio eosio.system
	create_contract myphersystem
	sleep 1
	cleos push action eosio setpriv '["eosio.msig", 1]' -p eosio@active
else
	NODE_URL=${GENESIS_URL}
	# TODO:check and register account if not found with genesis node
	
	echo "###############################"
	echo "# get p2p list from genesis node"
	echo "###############################"
	# TODO: get lists from genesis node
	cat /mnt/dev/config/p2plist.ini >> /mnt/dev/config/config.ini

	create_account ${UNAME} 1
	sleep 1
	echo "register ${UNAME} as producer..."
	if [ -z "`cleos -u ${NODE_URL} system listproducers|grep ${AC_PUB}`" ]; then
		cleos -u ${NODE_URL} system regproducer ${UNAME} ${AC_PUB}
		sleep 1
	fi
	echo "signature-provider = ${AC_PUB}=KEY:${AC_PRI}" >> /mnt/dev/config/config.ini
	nodeos --producer-name ${UNAME} \
		   --enable-stale-production \
		   --private-key '[ "${AC_PUB}","${AC_PRI}" ]' \
		   --config-dir /mnt/dev/config \
		   --verbose-http-errors \
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
