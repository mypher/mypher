#!/bin/bash 
# Copyright (C) 2018-2019 The Mypher Authors
#
# SPDX-License-Identifier: LGPL-3.0+
#

# the script to generate the docker image for testing

function onstart() {
	echo "###onstart"
	cleos wallet import --private-key 5JUUfwj41YsaNjmiMEQdCyuCsXenxDdfCEuJLBng9985wfaf19V
	cleos wallet import --private-key 5Hz1SxDgsKG9rA5wyoPCp9d59VEzoNhnNzzjbuJP5YgQDyvgEeQ
	cleos wallet import --private-key 5JDR2gXH2fvecAzcaxK19Cqgivk8ojHNwWzAwArUHPszLgiVXSq
	cleos wallet import --private-key 5J6wBifS6gy4Sx97mhudtuWfbJw6vbXdnBggdunw5i5ArbwPqev
	cleos wallet import --private-key 5JXCxPod74nZxNS8S4nU81oy3A92J4LBEVWQbjW1HwzoeFABXV3
	cleos system newaccount eosio \
		--transfer mypherutest1 EOS77Ch4niaihrqUtiPVj86mJKCuZaTrH4S2BkHNDFdnrv4DFjSzz \
		--stake-net "4.0000 SYS" --stake-cpu "5.0000 SYS" --buy-ram-kbytes 1024
	cleos system newaccount eosio \
		--transfer mypherutest2 EOS7GAyaQWeHZtTfy4MsxWrvJC6NprpjEZgfFcBcgcEH2WQ67ZJgv \
		--stake-net "4.0000 SYS" --stake-cpu "5.0000 SYS" --buy-ram-kbytes 1024
	cleos system newaccount eosio \
		--transfer mypherutest3 EOS7fgHPo4NfMa2UtZhgbz1uUsGTepCeyfPVDZrtv7DVwrKJZ4aSp \
		--stake-net "4.0000 SYS" --stake-cpu "5.0000 SYS" --buy-ram-kbytes 1024
	cleos system newaccount eosio \
		--transfer mypherutest4 EOS5wamfuDPQFfk3PPi8d2aDN5dLqE3uotD55QUkkh3Y8JaWHUtHR \
		--stake-net "4.0000 SYS" --stake-cpu "5.0000 SYS" --buy-ram-kbytes 1024

	cleos transfer eosio mypherutest1 "100 SYS"
	sleep 1
	cleos system newaccount mypherutest1 \
		--transfer multisigacnt EOS7Rmpuas8KsWBtTCYJ8QkvoB6fvWxbxGQmnBAC4VgkJzjwoHasL \
		--stake-net "4.0000 SYS" --stake-cpu "5.0000 SYS" --buy-ram-kbytes 1024
	sleep 1
	cleos set account permission multisigacnt active \
		'{"threshold":2,"keys":[],"accounts":[{"permission":{"actor":"mypherutest1","permission":"active"},"weight":1},{"permission":{"actor":"mypherutest2","permission":"active"},"weight":1},{"permission":{"actor":"mypherutest3","permission":"active"},"weight":1}],"waits":[]}' \
		owner -p multisigacnt@owner
	cleos push action myphersystem pupdate '{"personid":"mypherutest1", "name":"test1", "tags":["test", "テスト"], "hash":"GmPjXvs59U7zoBG9LLy99r6h4YXbiaxQjL8J6coAXrcApi"}' -p mypherutest1
	cleos push action myphersystem pupdate '{"personid":"mypherutest2", "name":"test2", "tags":["test", "テスト"], "hash":"GmPjXvs59U7zoBG9LLy99r6h4YXbiaxQjL8J6coAXrcApi"}' -p mypherutest2
	cleos push action myphersystem pupdate '{"personid":"mypherutest3", "name":"test3", "tags":["test", "テスト"], "hash":"GmPjXvs59U7zoBG9LLy99r6h4YXbiaxQjL8J6coAXrcApi"}' -p mypherutest3
	cleos push action myphersystem pupdate '{"personid":"mypherutest4", "name":"テスト４", "tags":["test", "テスト"], "hash":"GmPjXvs59U7zoBG9LLy99r6h4YXbiaxQjL8J6coAXrcApi"}' -p mypherutest4

	sleep 5
	bash -c /scripts/stop.sh
	sleep 3
	echo "***done***"
	sleep 10000
}


for path in "/root/eosio-wallet
/data
/data/db
/work
/mnt/dev
/mnt/dev/data
/mnt/dev/config
/keys
/ipfs"
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

export -f onstart
bash -c /scripts/main.sh 
