#!/bin/bash 
# Copyright (C) 2018-2019 The Mypher Authors
#
# SPDX-License-Identifier: LGPL-3.0+
#

function create_account() {
	cleos create key --file /keys/$1.active
	local OW_PRI=`cat /keys/$1.active | sed -n 1P | sed "s/Private key: \(.*\)/\1/"`
	local OW_PUB=`cat /keys/$1.active | sed -n 2P | sed "s/Public key: \(.*\)/\1/"`
	cleos wallet import --private-key ${OW_PRI}
	cleos system newaccount eosio --transfer $1 ${OW_PUB} --stake-net "4.0000 SYS" --stake-cpu "5.0000 SYS" --buy-ram-kbytes 8
}

function vote() {
	cleos system voteproducer approve $1 testuser
}

create_account testa
create_account testb
create_account testc
create_account testd
create_account teste
create_account testf
create_account testg
create_account testh
create_account testi
create_account testj
create_account testk
create_account testl
create_account testm
create_account testn
create_account testv
create_account testw
create_account testx
create_account testy
create_account testz
sleep 1
vote testa
vote testb
vote testc
vote testd
vote teste
vote testf
vote testg
vote testh
vote testi
vote testj
vote testk
vote testl
vote testm
vote testn
vote testv
vote testw
vote testx
vote testy
vote testz
