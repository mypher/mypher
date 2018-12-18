#!/bin/bash 
# Copyright (C) 2018 The Mypher Authors
#
# SPDX-License-Identifier: LGPL-3.0+
#

source /mnt/dev/config/mypher_config.ini

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

cleos wallet create -f /keys/wallet.txt

echo "###############################"
echo "# prepare config.ini"
echo "###############################"
cp -f /mnt/dev/config/base_config.ini /mnt/dev/config/config.ini

prepare_account_key eosio

NODE_URL="http://127.0.0.1:8888"
echo "signature-provider = ${PA_PUB}=KEY:${PA_PRI}" >> /mnt/dev/config/config.ini

bash -c /scripts/run.sh 1

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

while :
do
	sleep 10000
done
