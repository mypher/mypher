// Copyright (C) 2018-2019 The Mypher Authors
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
		'uint32_t' : 'uint32',
		'uint16_t' : 'uint16',
		'uint8_t' : 'uint8',
		'double_t' : 'float64',
		'string' : 'string',
		'account_name' : 'name',
		'name' : 'name',
		'eosio::name' : 'name',
		'bool' : 'bool',
		'vector<uint64_t>' : 'uint64[]',
		'vector<uint32_t>' : 'uint32[]',
		'vector<uint16_t>' : 'uint16[]',
		'vector<uint8_t>' : 'uint8[]',
		'vector<string>' : 'string[]',
		'vector<account_name>' : 'name[]',
		'vector<name>' : 'name[]',
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
					if (v.indexOf('(')!=-1) {
						type = undefined;
						return;
					}
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
			if (v==='secondary_key') {
				table.key = true;
			}
		}
		if (action) {
			if (v==='void') return;
			if (action.name===undefined) {
				v = v.split('(');
				action = {
					name : v[0],
					base : '',
					fields : []
				};
				if (v.length>1) {
					v.shift();
					v = v.join('(');
				} else {
					return;
				}
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
		if (process.argv.length<4) {
			console.log('invalid arguments');
			return;
		}
		const path = process.argv[2];
		const list = fs.readdirSync(path);
		list.forEach( l => {
			if (/\.hpp/.exec(l)!=null) {
				const txt = fs.readFileSync(path + '/' + l, 'utf8');
				parse(txt);
			}
		});
		output(process.argv[3]);
	} catch (e) {
		console.log(e);
	}
})();

function output(fn) {
	let output = {
		version: 'eosio::abi/1.0',
		types : [],
		actions : [],
		tables : []
	};
	output.structs = [].concat(tables, actions);

	let idx_table = [];
	let idx_action = [];
	tables.forEach(t => {
		output.tables.push({
			name : t.name,
			type : t.name,
			key_names : t.key ? ['secondary_key'] : [],
			key_types : t.key ? ['uint64'] : [],
			index_type : 'i64'
		});
	});
	actions.forEach(a => {
		output.actions.push({
			name : a.name,
			type : a.name,
			ricardian_contract : ''
		});
	});
	fs.writeFileSync(fn, JSON.stringify(output), 'utf8');
}

