#!/bin/bash 
# Copyright (C) 2018-2019 The Mypher Authors
#
# SPDX-License-Identifier: LGPL-3.0+
#

source /mnt/dev/config/mypher_config.ini

function prepare_wallet() {
	if [ ! -e /keys/wallet.txt ]; then
		echo "### create default wallet"
		cleos wallet create -f /keys/wallet.txt
		if [ -n "${AS_EOSIO}" ]; then
			PA_PRI="5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3"
			cleos wallet import --private-key ${PA_PRI}
		fi
	else
		echo "### open default wallet"
		cleos wallet open
		WPASS=`cat /keys/wallet.txt`
		cleos wallet unlock --password ${WPASS}
	fi
}
export -f prepare_wallet

function wait2start() {
	sleep 12
	if [ $? -ne 0 ]; then
		echo "nodeos is terminated."
		terminate
	fi
}
export -f wait2start


function create_account() {
	if [ -z "`cleos -u ${GENESIS_URL} get account $1`" ]; then
		echo "###create an account for $1"
		cleos create key --file /keys/$1.owner
		cleos create key --file /keys/$1.active
		local OW_PRI=`cat /keys/$1.owner | sed -n 1P | sed "s/Private key: \(.*\)/\1/"`
		local OW_PUB=`cat /keys/$1.owner | sed -n 2P | sed "s/Public key: \(.*\)/\1/"`
		AC_PRI=`cat /keys/$1.active | sed -n 1P | sed "s/Private key: \(.*\)/\1/"`
		AC_PUB=`cat /keys/$1.active | sed -n 2P | sed "s/Public key: \(.*\)/\1/"`
        cleos wallet import --private-key ${OW_PRI}
		cleos wallet import --private-key ${AC_PRI}
		if [ -z "$2" ]; then
			cleos -u ${GENESIS_URL} create account eosio $1 ${OW_PUB} ${AC_PUB}
			if [ $? -ne 0 ]; then
				echo "failed to create an account for $1"
				terminate
			fi
		else
			local ret=`curl -H 'Content-Type:application/json' -d '{"jsonrpc":"2.0","id":1,"method":"system.reg_account","params":[{"id":"'$1'","owner":"'${OW_PUB}'", "active":"'${AC_PUB}'"}]}' ${GENESIS_APP}`
			if [ -n "`echo ${ret} | grep 'error'`" ]; then
				echo "${ret}"
				terminate
			fi
		fi
		RET_CREATE_ACCOUNT="1"
	else
		echo "the account for $1 is already created..."
		AC_PRI=`cat /keys/$1.active | sed -n 1P | sed "s/Private key: \(.*\)/\1/"`
		AC_PUB=`cat /keys/$1.active | sed -n 2P | sed "s/Public key: \(.*\)/\1/"`
		RET_CREATE_ACCOUNT="0"
	fi
}
export -f create_account

function create_contract() {
	echo "###create the contract of $1"
	local hash=`cleos -u ${GENESIS_URL} get code $1`
	if [[ ${hash:11} =~ ^[0]*$ ]]; then
		echo "deply contract:$1 to blockchain"
		cleos -u ${GENESIS_URL} set contract $1 /contracts/$1
	else
		echo "contract:$1 is already deployed....."
	fi
}
export -f create_contract

function create_contract2() {
	echo "###create the contract of $1"
	local hash=`cleos -u ${GENESIS_URL} get code $1`
	if [[ ${hash:11} =~ ^[0]*$ ]]; then
		echo "deply contract:$1 to blockchain"
		cleos -u ${GENESIS_URL} set contract $1 /contracts/$2
	else
		echo "contract:$1 is already deployed....."
	fi
}
export -f create_contract2

function import_key2wallet() {
	local pri=`cat /keys/$1 | sed -n 1P | sed "s/Private key: \(.*\)/\1/"`
	local pub=`cat /keys/$1 | sed -n 2P | sed "s/Public key: \(.*\)/\1/"`
	cleos wallet import --private-key ${pri}
}

export -f import_key2wallet

function terminate() {
	echo "###execute the process for preparing termination..."
	ps ax | grep "nodeos" | grep -v grep | awk '{print $1}' | xargs kill
	#ps ax | grep "mongod" | grep -v grep | awk '{print $1}' | xargs kill
	ps ax | grep "node" | grep -v grep | awk '{print $1}' | xargs kill
	sleep 10
	exit 1
}
export -f terminate

function infinite_loop() {
	while :
	do
		sleep 10000
	done
}
export -f infinite_loop
