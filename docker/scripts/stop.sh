#!/bin/bash 
# Copyright (C) 2018 The Mypher Authors
#
# SPDX-License-Identifier: LGPL-3.0+
#
ps ax | grep "nodeos" | grep -v grep | awk '{print $1}' | xargs kill
ps ax | grep "mongod" | grep -v grep | awk '{print $1}' | xargs kill
ps ax | grep "node" | grep -v grep | awk '{print $1}' | xargs kill
