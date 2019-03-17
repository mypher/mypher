// Copyright (C) 2018-2019 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#ifndef MYPHERBASE_HPP
#define MYPHERBASE_HPP

#include <eosiolib/eosio.hpp>

namespace mypher {

#define NUMBER_NULL 0xffffffff

#define SELF N(myphersystem)

class MypherBase {
protected:
	eosio::name self;

};

}


#endif // MYPHERBASE_HPP
