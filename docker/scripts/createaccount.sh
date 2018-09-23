#!/bin/bash 
# Copyright (C) 2018 The Mypher Authors
#
# SPDX-License-Identifier: LGPL-3.0+
#

cleos create key --file /keys/ac_$1.txt
KEY1=`cat /keys/ac_$1.txt | sed -n 1P | sed "s/Private key: \(.*\)/\1/"`
KEY2=`cat /keys/ac_$1.txt | sed -n 2P | sed "s/Public key: \(.*\)/\1/"`

echo "KEY1:${KEY1}"
echo "KEY2:${KEY2}"
cleos wallet import -n $2 --private-key ${KEY1}
cleos create account eosio $1 ${KEY2}
