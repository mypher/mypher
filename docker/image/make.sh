#!/bin/bash 
# Copyright (C) 2018 The Mypher Authors
#
# SPDX-License-Identifier: LGPL-3.0+
#

#docker build . --no-cache -t mypher --network=host --build-arg EOS_VER=v1.2.2
docker build . -t mypher --network=host --build-arg EOS_VER=v1.3.0
