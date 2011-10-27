Ti.include('/libs/oauth/sha1.js','/libs/oauth/oauth.js');

//
// Local namespace
var local = {
	dir: Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory,'App'),
	file: null,
	methods: {},
	tokens: null,
	accessor: null,
	consumer: null,
	events: {}
}, UI = {
	web: null
};


//
// Private Methods
UI.loadWeb = function( web){
	if(UI.web){
		UI.window.remove(UI.web);
	}
	UI.web = null;
	UI.web = undefined;
	UI.web = web;
	UI.window.add(UI.web);
};
	
local.methods.getFile = function(create){
	if(local.dir.exists() !== true){
		local.dir.createDirectory();
	}
	local.file = Ti.Filesystem.getFile(local.dir.nativePath,'oauth.dat');
		
	if(local.file.exists() !== true && create){
		local.file.createFile();
	}
	return local.file.exists();
};
	
local.methods.save_tokens_as = function(tok, type){
	if(type !== undefined){
		local.tokens = local.methods.read_tokens(true);
		local.tokens[type] = tok;
	}else{
		local.tokens = tok;
		local.methods.getFile(true);
	}
		
	local.file.write(JSON.stringify(local.tokens));
};
	
local.methods.read_tokens = function(create){
	return local.methods.getFile(create) && JSON.parse(local.file.read()) || {error: 'File not exist!'};
};
	
local.methods.delete_tokens = function(){
	local.tokens = {};
	Ti.Filesystem.getFile(local.dir.nativePath,'oauth.dat').deleteFile();
};
	
local.methods.has_tokens = function(type){
	local.tokens = local.methods.read_tokens();
	return local.tokens && local.tokens.error === undefined && local.tokens[type] !== undefined;
};
	
local.methods.get_tokes = function(type){
	return local.methods.has_tokens(type) && local.tokens[type] || {error: 'No tokens found'};
};
	
local.methods.print_tokens = function(title, callback){
	callback((title || 'List of OAuth tokens') + ':\n');
	var Types = local.methods.read_tokens(),Type,Token, Tokens;
		
	for(Type in Types){
		if(Types.hasOwnProperty(Type)){
			if(typeof Types[Type] === 'object'){
				callback(' ' + Type + ': ');
				Tokens = Types[Type];
				for(Token in Tokens){
					if(Tokens.hasOwnProperty(Token)){
						callback('  ' + Token + ': ' + Tokens[Token] + ';');
					}
				}
			}else{
				callbackt(' ' + Type + ': ' + Types[Type] + ';');
			}
		}
	}
		
	callback('\n');
};
	
local.methods.getPIN = function(e){/* Not yet done */};
	
local.methods.getVerifier = function(e){
	if(e.url && e.url.match(/oauth_verifier=([^&]+)/) !== null){
		local.methods.accessToken(function(){},['verifier', e.url.match(/oauth_verifier=([^&]+)/)[1]]);
		if(UI.window !== null || UI.window !== undefined) {
			UI.window.close();
			return;
		}
	}
};
	
local.methods.validateMethod = function(method){
	method = {
		"string": method && method.length > 0 && method.toUpperCase(),
		"undefined": local.consumer.method || "GET"
	}[typeof method] || (local.consumer.method || "GET");
		
	return {
		"GET": "GET",
		"POST": "POST"
	}[method] || (local.consumer.method || "GET");
};

local.methods.requestToken = function(callback){
	if(exports.hasConsumer() !== true){
		return;
	}
		
	if (exports.loggedIn()) {
		exports.callEvent('login');

		callback(0);

		return;

	}
	
	exports.request(local.consumer.serviceProvider.requestToken, function( data){
		if (!data.match(/oauth_token=([^&]+)&/) || data.error !== undefined){
			exports.logout();
		}
			
		local.methods.save_tokens_as({
			oauth: {
				token: decodeURIComponent(data.match(/oauth_token=([^&]+)/)[1].toString()),
				secret: decodeURIComponent(data.match(/oauth_token_secret=([^&]+)/)[1].toString())
			}
		});
		
		local.accessor.tokenSecret = local.tokens.oauth.secret;
		
		if (!exports.loggedIn() && local.consumer.serviceProvider.userAuthorization && local.consumer.serviceProvider.userAuthorization.url.length > 0) {
			local.methods.authorize_user({
				url: local.consumer.serviceProvider.userAuthorization.url.replace(/oauth_token=<oauth_token>/g, data.match(/oauth_token=([^&]+)/)[0]).replace(/oauth_token_secret=<oauth_token_secret>/, data.match(/oauth_token_secret=([^&]+)/)[0]) 
			});
		} else {
			callback(1);
		}
	}, true);
};
	
local.methods.accessToken = function(callback, verifier){
	if(exports.hasConsumer() !== true || arguments.length <= 0 || !local.accessor.tokenSecret || local.accessor.tokenSecret === 'null'){
		return;
	}
	var message = local.consumer.serviceProvider.accessToken;
	
	if(verifier !== undefined){
		message.parameters = message.parameters && message.parameters.push(['oauth_' + verifier[0], verifier[1]]) || [['oauth_' + verifier[0], verifier[1]]];
	}
		
	exports.request(message, function( data){
	   	if (!data.match(/oauth_token=([^&]+)&/) || data.error !== undefined){
			exports.logout();
			return;
		}
			
		local.methods.save_tokens_as({
			token: decodeURIComponent(data.match(/oauth_token=([^&]+)&/)[1].toString()),
			secret: decodeURIComponent(data.match(/oauth_token_secret=([^&]+)/)[1].toString())
		}, 'access');
			
		if(typeof callback === 'function'){
			callback(1);
		}
		exports.callEvent('login');
	});
};
	
local.methods.authorize_user = function(params){
	if(exports.hasConsumer() !== true){
		return;
	}

	UI.loadWeb(Ti.UI.createWebView({
		top: 20,
		opacity: 1,
		zIndex: 2,
		url: params.url
	}));
		
	var c = 0;
		
	UI.web.addEventListener('beforeload', function(e){
		c += decodeURIComponent(e.url) === params.url;
		if(c === 4){
			UI.web.opacity = 0;
		}
	});
		
	UI.web.addEventListener('load', local.methods[local.consumer.usePin && 'getPIN' || 'getVerifier']);
	UI.window.open({ modal: true, fullscreen: false });
};

//
// Public methods

exports.print_tokens = local.methods.print_tokens;

exports.initialize = function(args){
	UI.window = Ti.UI.createWindow(args && args.window || {
		title: 'User authorization',
		backgroundColor: 'white',
		barColor: 'black',
		height:460,
		width: 320
	});
	
	UI.spinner = Ti.UI.createActivityIndicator({
		zIndex: 1,
		top: 20,
		height:440,
		width: 320,
		style: Ti.UI.iPhone.ActivityIndicatorStyle[args && args.length > 0 && args.spinner_style] || Ti.UI.iPhone.ActivityIndicatorStyle.DARK
	});
	
	UI.close = Ti.UI.createButton(args && args.button || {
		title: 'Close'
	});
	
	UI.window.add(UI.spinner);
	UI.spinner.show();
	
	UI.window.rightNavButton = UI.close;
	
	UI.close.addEventListener('click', function(){
		UI.window.close();
	});
	
	exports.changeConsumer(args && args.consumer);
	
};
	
exports.hasConsumer = function(){
	return local.consumer !== undefined;
};
	
exports.changeConsumer = function(newConsumer){
	if(newConsumer !== 'self'){
		local.consumer = newConsumer;
	}
	local.accessor = {
		consumerSecret: local.consumer && local.consumer.consumerSecret || '',
		tokenSecret: ''
	};
};

exports.GetConsumer = function(){
	return local.consumer;
};
	
exports.loggedIn = function() {
	return local.methods.has_tokens('access');
};
	
exports.request = function(options, callback, allow) {
	
	if(exports.hasConsumer() !== true){
		return;
	}
	if(exports.loggedIn() !== true && !allow && allow !== undefined){
		callback('error: ' + exports.loggedIn() + ' !== true && !' + allow);
		return;
	}
	var message = {
		method: local.methods.validateMethod(options.method),
		action: options.url,
		parameters: [
			['oauth_signature_method',  local.consumer.serviceProvider.signatureMethod],
			['oauth_consumer_key', local.consumer.consumerKey]
		//	['oauth_version', consumer.serviceProvider.oauthVersion],
		]
	};
		
	var has = local.methods.get_tokes(local.methods.has_tokens('access') && 'access' || 'oauth');
			
	if((!allow || allow === undefined) && has.error === undefined){
		message.parameters.push(['oauth_token', has.token]);
		local.accessor.tokenSecret = has.secret;
	}
	
	if(options.parameters && options.parameters.length > 0){
		for (var param in options.parameters) {
			message.parameters.push(options.parameters[param]);
		}
	}
		
	OAuth.setTimestampAndNonce(message);
	OAuth.setParameter(message, "oauth_timestamp", OAuth.timestamp());
	OAuth.SignatureMethod.sign(message, local.accessor);
	
	var HTTPClient = Ti.Network.createHTTPClient();
		
	HTTPClient.onload = function(){
		callback(this.responseText);
	};
		
	HTTPClient.onerror = function(e) {
		Ti.UI.createAlertDialog({
			title: 'Service Unavailable',
			message: 'Service unavailable please try again later.'
		}).show();
            
		callback(e);
		exports.logout();
	};
		
	HTTPClient.open(options.method , message.method === "POST" && message.action || OAuth.addToURL(message.action, message.parameters));
		
	if (message.method === 'POST') {
		HTTPClient.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	}
		
	HTTPClient.send(message.method === "POST" && OAuth.getParameterMap(message.parameters) || null);
};
	
exports.login = function(callbacks){
	local.methods.requestToken(function(a) {
		try{
			callbacks.request(a);
			local.methods.accessToken(callbacks.access);
		}
		catch(msg){
			local.methods.accessToken();
		}
	});
};
	
exports.logout = function() {
	local.methods.delete_tokens();
	exports.callEvent('logout');
};

exports.catchEvent = function(event, callback){
	local.events[event] = local.events[event] || [];
	if ( local.events[event] ) {
		local.events[event].push(callback);
	}
};

exports.removeEvent = function(event, callback){
	if ( local.events[event] ) {
		var listeners = local.events[event];
		for ( var i = listeners.length-1; i>=0; --i ){
			if ( listeners[i] === callback ) {
				listeners.splice( i, 1 );
				return true;
			}
		}
	}
	return false;
};

exports.callEvent = function(event){
	if ( local.events[event] ) {
		var listeners = local.events[event], len = listeners.length;
		while ( len--) {
			listeners[len]();
		}		
	}
	
};
