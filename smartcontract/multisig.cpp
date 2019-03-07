// Copyright (C) 2018-2019 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#include "mypher.hpp"
#include "multisig.hpp"
#include "common/prim.hpp"
#include <eosiolib/print.hpp>
#include <eosiolib/transaction.hpp>

using namespace eosio;

namespace mypher {

void MultiSig::makeProposeAction(action& out, const account_name& multisig, const account_name& proposal_name,
		const account_name& recipient, const uint64_t& amount, const string& memo) {

	transaction trans;
	char tmp[16];
	Prim::itoad(tmp, amount);
	string amt(tmp);
	permission_level perm[1] = {permission_level{multisig, N(active)}};
	amt.append(" SYS");
	trans.actions.push_back(action(
		permission_level{multisig, N(active)},
		N(eosio.token),              
  		N(transfer),
   		std::make_tuple(multisig, recipient, amt, memo)
	));
	out.authorization.push_back(permission_level{recipient , N(active)});
	//out.authorization.push_back(permission_level{N(myphersystem) , N(eosio.code)});
	out.account = N(eosio.msig);
	out.name = N(propose);
	out.data = pack(
   		std::make_tuple(recipient, proposal_name, perm, trans)
	);
}

void MultiSig::sendProposeAction(const account_name& multisig, const account_name& proposal_name,
		const account_name& recipient, const uint64_t& amount, const string& memo) {

	transaction trans;
	char tmp[16];
	Prim::itoad(tmp, amount);
	string amt(tmp);
	permission_level perm[1] = {permission_level{multisig, N(active)}};
	amt.append(" SYS");
	trans.actions.push_back(action(
		permission_level{multisig, N(active)},
		N(eosio.token),              
  		N(transfer),
   		std::make_tuple(multisig, recipient, amt, memo)
	));
	action(
		permission_level{recipient, N(active)},
		N(eosio.msig), N(propose), 
		std::make_tuple(recipient, proposal_name, perm, trans)
	).send();
}


} // mypher