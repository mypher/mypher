#!/bin/bash 
# Copyright (C) 2018 The Mypher Authors
#
# SPDX-License-Identifier: LGPL-3.0+
#

cleos wallet open -n $1
TXT=`cat /keys/$1.txt`
cleos wallet unlock -n $1 --password ${TXT:1:53}

