#!/bin/bash 
# Copyright (C) 2018-2019 The Mypher Authors
#
# SPDX-License-Identifier: LGPL-3.0+
#

# prepare the wallet
source /scripts/common.sh

function prepare_eosio() {
	echo "###create eosio"
	create_account eosio.msig
	local cre_msig=${RET_CREATE_ACCOUNT}
	create_account eosio.sudo
	local cre_sudo=${RET_CREATE_ACCOUNT}
	create_account eosio.token
	local cre_token=${RET_CREATE_ACCOUNT}
	create_account eosio.bpay
	create_account eosio.names
	create_account eosio.ram
	create_account eosio.ramfee
	create_account eosio.saving
	create_account eosio.stake
	create_account eosio.vpay
	sleep 1
	if [ ${cre_msig} = "1" ]; then
		create_contract eosio.msig
	fi
	if [ ${cre_sudo} = "1" ]; then
		create_contract eosio.sudo
	fi
	if [ ${cre_token} = "1" ]; then
		create_contract eosio.token
		sleep 1
	    cleos push action eosio.token create '[ "eosio", "10000000000.0000 EOS" ]' -p eosio.token@active
		cleos push action eosio.token issue '[ "eosio", "50000000.0000 EOS", "memo" ]' -p eosio@active
		sleep 1
		create_contract2 eosio eosio.system
		cleos push action eosio setpriv '["eosio.msig", 1]' -p eosio@active
    	cleos push action eosio init '[0, "4,EOS"]' -p eosio@active
		sleep 1
	fi
}

# for developing
function create_mypher_account() {
	local pubkey=`cat /keys/$1.active | sed -n 2P | sed "s/Public key: \(.*\)/\1/"`
	cleos system newaccount eosio --transfer $1 ${pubkey} --stake-net "1000000.0000 EOS" --stake-cpu "100000.0000 EOS" --buy-ram-kbytes 5000
}

# prepare the wallet
prepare_wallet

echo "### prepare config.ini"
cp -f /mnt/dev/config/base_config.ini /mnt/dev/config/config.ini

PRI=`cat /keys/eosio.owner | sed -n 1P | sed "s/Private key: \(.*\)/\1/"`
PUB=`cat /keys/eosio.owner | sed -n 2P | sed "s/Public key: \(.*\)/\1/"`
cleos wallet import --private-key ${PRI}

echo "signature-provider = ${PUB}=KEY:${PRI}" >> /mnt/dev/config/config.ini
nodeos --producer-name eosio \
   --config-dir /mnt/dev/config \
   --max-transaction-time=1000 \
   --verbose-http-errors \
   -d /mnt/dev/data &

wait2start
prepare_eosio
create_mypher_account myphersystem
create_mypher_account testuser1111
create_mypher_account testuser2222
create_mypher_account testuser3333
create_mypher_account testuser4444
infinite_loop
