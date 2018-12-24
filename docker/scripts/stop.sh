#!/bin/bash 
# Copyright (C) 2018 The Mypher Authors
#
# SPDX-License-Identifier: LGPL-3.0+
#
function term() {
	if [ ! -z $1 ]; then
		kill $1
	fi
}

echo "nodeos"
#ps ax | grep "nodeos" | grep -v grep | awk '{print $1}' | xargs kill
term `ps ax | grep "nodeos" | grep -v grep | awk '{print $1}'`
echo "mongod"
#ps ax | grep "mongod" | grep -v grep | awk '{print $1}' | xargs kill
term `ps ax | grep "mongod" | grep -v grep | awk '{print $1}'`
echo "node"
#ps ax | grep "node" | grep -v grep | awk '{print $1}' | xargs kill
term `ps ax | grep "node" | grep -v grep | awk '{print $1}'` 
echo "ipfs"
#ps ax | grep "ipfs" | grep -v grep | awk '{print $1}' | xargs kill
term `ps ax | grep "ipfs" | grep -v grep | awk '{print $1}'` 
