// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#ifndef CONTRACT_HPP
#define CONTRACT_HPP

#include <eosiolib/eosio.hpp>
#include "person.hpp"
#include "cipher.hpp"
#include "token.hpp"

using namespace eosio;
using namespace std;


class Mypher : public contract, public mypher::Person, public mypher::Cipher, public mypher::Token {

public:
	Mypher(account_name self) 
	: contract(self), mypher::Person(self), mypher::Cipher(self), mypher::Token(self)
	{}  
};

#endif // CIPHER_HPP