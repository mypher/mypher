#!/bin/bash 
# Copyright (C) 2018-2019 The Mypher Authors
#
# SPDX-License-Identifier: LGPL-3.0+
#

# PREMISE:
#  the account is already created

# prepare the wallet
source /scripts/common.sh

# prepare the wallet
prepare_wallet

echo "### prepare config.ini"
cp -f /mnt/dev/config/base_config.ini /mnt/dev/config/config.ini
# TODO: get lists from genesis node
cat /mnt/dev/config/p2plist.ini >> /mnt/dev/config/config.ini

nodeos \
   --config-dir /mnt/dev/config \
   --max-transaction-time=1000 \
   --verbose-http-errors \
   -d /mnt/dev/data &

wait2start

echo "import key to wallet"
import_key2wallet myphersystem.active
import_key2wallet myphersystem.owner

echo "prepare the contracts of mypher system"
create_contract myphersystem
infinite_loop
