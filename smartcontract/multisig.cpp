// Copyright (C) 2018-2019 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#include "mypher.hpp"
#include "common/prim.hpp"
#include <eosiolib/print.hpp>
#include <eosiolib/transaction.hpp>
#include <eosiolib/asset.hpp>
#include <eosiolib/symbol.hpp>

using namespace eosio;

void Mypher::sendProposeAction(const eosio::name& multisig, const name& proposal_name,
		const eosio::name& recipient, const uint64_t& amount, const string& memo, const vector<eosio::name>& approvals) {

	transaction trans(time_point_sec(now())+days(3)); // TODO:
	vector<permission_level> perm;
	for (auto it=approvals.begin(); it != approvals.end(); ++it) {
		perm.push_back(permission_level{*it, ACTIVE});
	}
	asset ast(amount, eosio::symbol("EOS",4));
	trans.actions.push_back(action(
		permission_level{multisig, ACTIVE},
		"eosio.token"_n,              
  		"transfer"_n,
   		std::make_tuple(multisig, recipient, ast, memo)
	));
	action(
		permission_level{recipient, ACTIVE},
		"eosio.msig"_n, "propose"_n, 
		std::make_tuple(recipient, proposal_name, perm, trans)
	).send();
}

void Mypher::exec_multisig(const eosio::name& proposer, const name& proposal_name){
	action(
		permission_level{proposer, ACTIVE},
		"eosio.msig"_n,              
  		"exec"_n,
   		std::make_tuple(proposer, proposal_name, proposer)
	).send();
}
