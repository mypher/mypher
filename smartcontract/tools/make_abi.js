// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//
'use_strict';

const fs = require('fs');

let tables = [];
let actions = [];
function parse(txt) {
	txt = txt.replace(/[\r\n]+/mg, ' ').replace(/[\t ]+/g, '\t');
	txt = txt.split('\t');
	let comment = false;
	let table = null;
	let action = null;
	const tag_table = '[[eosio::table]]';
	const tag_action = '[[eosio::action]]';
	const dict = {
		'uint64_t' : 'uint64',
		'uint16_t' : 'uint16',
		'uint8_t' : 'uint8',
		'string' : 'string',
		'account_name' : 'name',
		'bool' : 'bool',
		'vector<uint64_t>' : 'uint64[]',
		'vector<uint16_t>' : 'uint16[]',
		'vector<uint8_t>' : 'uint8[]',
		'vector<string>' : 'string[]',
		'vector<account_name>' : 'name[]',
		'vector<bool>' : 'bool[]'
	};
	let type = undefined;
	txt.forEach(v => {
		if (comment) {
			const r = v.indexOf('*/');
			if (r>-1) {
				comment = false;
				v = v.substring(r+2);
			} else {
				return;
			}
		}
		const r = v.indexOf('/*');
		if (r>-1) {
			comment = true;
			if (r===0) return;
			v = v.substring(0, r);
		}
		if (v===tag_table) {
			table = {};
			return;
		}
		if (v===tag_action) {
			action = {};
			return;
		}
		if (table) {
			if (table.name===undefined) {
				table = {
					name : v,
					base : '',
					fields : []
				};
				return;
			} else {
				if (type) {
					v = v.replace(';','');
					table.fields.push({name:v, type:type});
					type = undefined;
					return;
				}
			}
			if (v==='};') {
				tables.push(table);
				table = null;
				return;
			}
		}
		if (action) {
			if (v==='void') return;
			if (action.name===undefined) {
				action = {
					name : v,
					base : '',
					fields : []
				};
				return;
			} else {
				if (type) {
					const last = v.includes(');');
					v = v.replace(/[,\);]/g,'');
					action.fields.push({name:v, type:type});
					type = undefined;
					if (last) {
						actions.push(action);
						action = null;
					}
					return;
				}
			}
		}
		if (type===undefined) {
			v = v.replace('&', '');
			type = dict[v];
		}
	});
}



(() => {
	try {
		const path = '../';
		const list = fs.readdirSync(path);
		list.forEach( l => {
			if (/\.hpp/.exec(l)!=null) {
				const txt = fs.readFileSync(path + l, 'utf-8');
				parse(txt);
			}
		});
		output();
	} catch (e) {
		console.log(e);
	}
})();

function output() {
	let idx_table = [];
	let idx_action = [];

}

