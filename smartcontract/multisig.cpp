// Copyright (C) 2018-2019 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#include "mypher.hpp"
#include "multisig.hpp"
#include "common/prim.hpp"
#include <eosiolib/print.hpp>
#include <eosiolib/transaction.hpp>
#include <eosiolib/asset.hpp>

using namespace eosio;

namespace mypher {

void MultiSig::sendProposeAction(const account_name& multisig, const account_name& proposal_name,
		const account_name& recipient, const uint64_t& amount, const string& memo) {

	transaction trans(time_point_sec(now() + 1000));
	vector<permission_level> perm;
	perm.push_back(permission_level{multisig, N(active)});
	asset ast(amount);
	trans.actions.push_back(action(
		permission_level{multisig, N(active)},
		N(eosio.token),              
  		N(transfer),
   		std::make_tuple(multisig, recipient, ast, memo)
	));
	action(
		permission_level{recipient, N(active)},
		N(eosio.msig), N(propose), 
		std::make_tuple(recipient, eosio::name{proposal_name}, perm, trans)
	).send();
}


} // mypher