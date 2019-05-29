#!/bin/bash 
# Copyright (C) 2018-2019 The Mypher Authors
#
# SPDX-License-Identifier: LGPL-3.0+
#

docker start -a mypher_eosio &
sleep 10
docker start -a mypher_myphersystem &
sleep 10
docker start -a mypher_user &
