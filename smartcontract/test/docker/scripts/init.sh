#!/bin/bash 
# Copyright (C) 2018 The Mypher Authors
#
# SPDX-License-Identifier: LGPL-3.0+
#

# the script to generate the docker image for testing

PATHES="
/root/eosio-wallet
/data
/data/db
/work
/mnt/dev
/mnt/dev/data
/mnt/dev/config
/keys
/ipfs
"

for path in ${PATHES}
do
	mkdir ${path}
done

echo "export GENESIS_URL=http://10.200.10.1:8888
export IPFS_PATH=/ipfs
export GENESIS=true
" > /mnt/dev/config/mypher_config.ini

echo "/key/swarm/psk/1.0.0/
/base16/
6503913710f1276d13e4a5e74f947dedc697031ea5e181e7234e53b6e5d104e7
" > /ipfs/swarm.key_

cp /testscripts/base_config.ini /mnt/dev/config
cp /testscripts/eosio.user /keys

bash -c /scripts/start.sh &

sleep 50

cleos system newaccount eosio --transfer test1 EOS77Ch4niaihrqUtiPVj86mJKCuZaTrH4S2BkHNDFdnrv4DFjSzz --stake-net "4.0000 SYS" --stake-cpu "5.0000 SYS" --buy-ram-kbytes 1024
cleos system newaccount eosio --transfer test2 EOS7GAyaQWeHZtTfy4MsxWrvJC6NprpjEZgfFcBcgcEH2WQ67ZJgv --stake-net "4.0000 SYS" --stake-cpu "5.0000 SYS" --buy-ram-kbytes 1024
cleos system newaccount eosio --transfer test3 EOS7fgHPo4NfMa2UtZhgbz1uUsGTepCeyfPVDZrtv7DVwrKJZ4aSp --stake-net "4.0000 SYS" --stake-cpu "5.0000 SYS" --buy-ram-kbytes 1024
cleos system newaccount eosio --transfer test4 EOS5wamfuDPQFfk3PPi8d2aDN5dLqE3uotD55QUkkh3Y8JaWHUtHR --stake-net "4.0000 SYS" --stake-cpu "5.0000 SYS" --buy-ram-kbytes 1024

cleos wallet import --private-key 5JUUfwj41YsaNjmiMEQdCyuCsXenxDdfCEuJLBng9985wfaf19V
cleos wallet import --private-key 5Hz1SxDgsKG9rA5wyoPCp9d59VEzoNhnNzzjbuJP5YgQDyvgEeQ
cleos wallet import --private-key 5JDR2gXH2fvecAzcaxK19Cqgivk8ojHNwWzAwArUHPszLgiVXSq
cleos wallet import --private-key 5J6wBifS6gy4Sx97mhudtuWfbJw6vbXdnBggdunw5i5ArbwPqev

cleos push action myphersystem pupdate '{"personid":"test1", "name":"テスト1", "tags":["test", "テスト"], "hash":"GmPjXvs59U7zoBG9LLy99r6h4YXbiaxQjL8J6coAXrcApi"}' -p test1
cleos push action myphersystem pupdate '{"personid":"test2", "name":"テスト2", "tags":["test", "テスト"], "hash":"GmPjXvs59U7zoBG9LLy99r6h4YXbiaxQjL8J6coAXrcApi"}' -p test2
cleos push action myphersystem pupdate '{"personid":"test3", "name":"テスト3", "tags":["test", "テスト"], "hash":"GmPjXvs59U7zoBG9LLy99r6h4YXbiaxQjL8J6coAXrcApi"}' -p test3
cleos push action myphersystem pupdate '{"personid":"test4", "name":"テスト4", "tags":["test", "テスト"], "hash":"GmPjXvs59U7zoBG9LLy99r6h4YXbiaxQjL8J6coAXrcApi"}' -p test4

sleep 5

bash -c /scripts/stop.sh

sleep 10m

