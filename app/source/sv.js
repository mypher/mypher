// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//
'use_strict';

let http = require('http');
let fs = require('fs');
let allconf = require('config');
let api = require('./api/list');
let log = require('./cmn/logger')('sv.sv');

module.exports = {
	run : function() {
		http.createServer()
		.on('request', request)
		.listen(
			allconf.WebEnv.port, 
			allconf.WebEnv.url
		);
	}
}

const cont_type = {
	'html': ['text/html', false ],
	'htm': ['text/html', false ],
	'css':  ['text/css', false ],
	'map':  ['application/json map', false ],
	'js':   ['application/x-javascript', false ],
	'json': ['application/json', false ],
	'jpg':  ['image/jpeg', true ],
	'jpeg': ['image/jpeg', true ],
	'png':  ['image/png', true ],
	'gif':  ['image/gif', true ],
	'svg':  ['image/svg+xml', true ]
}

function getType(url) {
	let typ = url.split('.');
	typ = typ[typ.length-1];
	return cont_type[typ] ? typ : '';
}

function conttype(typ) {
	typ = cont_type[typ];
	return (typ||[''])[0];
}

function isbin(typ) {
	typ = cont_type[typ];
	return (typ||[null,false])[1];
}


function request(req, res) {
	let url = req.url.split('?');
	let typ = getType(url[0]);
	if (req.headers['content-type']==='application/json') {
		return callApi(req, res);
	}
	let write = (err ,data) => {
		if (err) {
			return return404(res);
		}
		res.writeHead(200, {'Content-Type' : conttype(typ)});　
		res.end(data);
	}
	if (isbin(typ) === true) {
		fs.readFile(__dirname + '/static' + url[0], write);
	} else {
		fs.readFile(__dirname + '/static' + url[0], 'utf-8', write);
	}
}

function return404(res, e) {
	res.writeHead(404, {'Content-Type': 'text/plain'});
	if (e===undefined) {
		e = 'Not Found';
	}
	let info = JSON.stringify(e);
	log.error(info);
	res.write(info);
	return res.end();　
}

function callApi(req, res) {
	new Promise((resolve, reject) => {
		setTimeout(() => {
			reject();
		}, 2000);
		req.on('readable', function() {
			var data = req.read();
			if (data !== null) {
				resolve(new Buffer(data).toString('utf-8'));
			}
		});
	}).then((data)=> {
		let o = JSON.parse(data);
		let method = o.method.split('.');
		if (method.length!==2) {
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.write(JSON.stringify(
				{
					'jsonrpc': '2.0', 
  					'error': {
      					'code': -32601,
      					'message': 'method not found'
  					}, 
  					'id': o.id
				}
			));
			res.end();
			return;
		}
		api.call(method[0], method[1], o.params, o.auth).then(rslt =>  {
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.write(JSON.stringify(
				{
					'jsonrpc': '2.0', 
		  			'result': rslt,
  					'id': o.id
				}
			));
			res.end();
		}).catch(e => {
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.write(JSON.stringify(
				{
					'jsonrpc': '2.0', 
  					'error': {
      					'code': -32603,
      					'message': e
  					}, 
  					'id': o.id
				}
			));
			res.end();
		});
	}).catch(e => {
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.write(JSON.stringify(
			{
				'jsonrpc': '2.0', 
				  'error': {
					  'code': -32600,
					  'message': e
				  }, 
				  'id': 0
			}
		));
		res.end();
	});
}

