// Copyright (C) 2018-2019 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#include "mypher.hpp"
#include "multisig.hpp"
//#include <sstream>
#include <eosiolib/print.hpp>
#include <eosiolib/transaction.hpp>

using namespace eosio;

namespace mypher {

void MultiSig::makeProposeAction(action& out, const account_name& multisig, const account_name& proposal_name,
		const account_name& recipient, const uint64_t& amount, const string& memo) {

	transaction trans;
	sprintf(Mypher::buf, "%.4f SYS", ((double_t)amount/10000)); // TODO:
	eosio::print_f("###!!! ", string{Mypher::buf});
	trans.actions.push_back(action(
		permission_level{multisig, N(active)},
		N(eosio.token),              
  		N(transfer),
   		std::make_tuple(multisig, recipient, string{Mypher::buf}, memo)
	));
	out.authorization.push_back(permission_level{recipient , N(active)});
	out.account = N(eosio.msig);
	out.name = N(propose);
	out.data = pack(
   		std::make_tuple(recipient, proposal_name, permission_level{multisig, N(active)}, trans)
	);
}

} // mypher