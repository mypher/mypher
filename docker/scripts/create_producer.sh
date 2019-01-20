#!/bin/bash 
# Copyright (C) 2018-2019 The Mypher Authors
#
# SPDX-License-Identifier: LGPL-3.0+
#

#cleos create account eosio $1 $2
cleos push action eosio setprods \
	"{ \"schedule\": [{\"producer_name\": \"$1\",\"block_signing_key\": \"$2\"}]}" \
	-p eosio@active
