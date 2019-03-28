#!/bin/bash 
# Copyright (C) 2018-2019 The Mypher Authors
#
# SPDX-License-Identifier: LGPL-3.0+
#

#cleos system newaccount eosio --transfer $1 $2 --stake-net "4.0000 SYS" --stake-cpu "5.0000 SYS" --buy-ram-kbytes 8
cleos system newaccount eosio --transfer $1 $2 --stake-net "4.0000 EOS" --stake-cpu "5.0000 EOS" --buy-ram-kbytes 8
