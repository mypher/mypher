#!/bin/bash 
# Copyright (C) 2018 The Mypher Authors
#
# SPDX-License-Identifier: LGPL-3.0+
#

cleos system newaccount eosio --transfer $1 $2 --stake-net "100000.0000 SYS" --stake-cpu "100000.0000 SYS" --buy-ram-kbytes 1
