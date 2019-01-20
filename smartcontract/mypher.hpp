// Copyright (C) 2018-2019 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#ifndef MYPHER_HPP
#define MYPHER_HPP

#include <eosiolib/eosio.hpp>
#include "mypherbase.hpp"
#include "person.hpp"
#include "cipher.hpp"
#include "token.hpp"
#include "task.hpp"

using namespace eosio;
using namespace std;

class Mypher : public contract, 
			   public mypher::Person, 
			   public mypher::Cipher, 
			   public mypher::Token,
			   public mypher::Task {

public:
	Mypher(account_name _self) 
	: contract(_self)
	{self = _self;}  
};

#endif // MYPHER_HPP
