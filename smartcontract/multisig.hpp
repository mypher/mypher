// Copyright (C) 2018-2019 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#ifndef MULTISIG_HPP
#define MULTISIG_HPP

#include <eosiolib/eosio.hpp>
#include "common/messageid.h"

using namespace std;
using namespace eosio;

namespace mypher {

/**
 * @defgroup mypher
 * @class MultiSig
 * @brief some functions to help handling the MultiSigs
 */
class MultiSig {

public:

	static void sendProposeAction(const eosio::name& multisig, const name& proposal_name,
		const eosio::name& recipient, const uint64_t& amount, const string& memo, const vector<eosio::name>& approvals);

	static void exec(const eosio::name& proposer, const name& proposal_name);
};

} // mypher

#endif // MULTISIG_HPP