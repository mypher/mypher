#!/bin/bash 
# Copyright (C) 2018 The Mypher Authors
#
# SPDX-License-Identifier: LGPL-3.0+
#
echo "nodeos"
ps ax | grep "nodeos" | grep -v grep | awk '{print $1}' | xargs kill
echo "mongod"
ps ax | grep "mongod" | grep -v grep | awk '{print $1}' | xargs kill
echo "node"
ps ax | grep "node" | grep -v grep | awk '{print $1}' | xargs kill
echo "ipfs"
ps ax | grep "ipfs" | grep -v grep | awk '{print $1}' | xargs kill
