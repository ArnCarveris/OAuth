Ti.App.Styles = {
	main: {
		window: {},
		buttos: {
			logout: {
				title: 'Log-out'
			}
		}
	},
	auth: {},
	log: {
		web: {},
		window: {
			top: 0,
			left: 0,
			height: 460,
			width: 320,
			title: 'Logs output',
			barColor: 'black',
			backgroundColor: 'black'
		},
		view: {
			top: 0,
			left: 0,
			//height: 460,
			width: 320,
			backgroundColor: 'black',
			contentWidth: 320,
			contentHeight: 'auto'
		},
		output: {
			bottom: 0,
			width: 320,
			left: 0,
			height: 'auto',
			text: '~>',
			textAlign: 'left',
			color: 'green',
			font: {
				fontSize: 12//,
				//fontWeight: 'bold'
				//fontFamily: 'Monaco'
			}
		}
	},
	list: {
		window: {
			title: 'Consumers list',
			barColor: 'black'
		},
		table: {
		}
	}
};

Ti.App.UI = (function(){
	var local = {
		UI: {
			main: {
				window: Ti.UI.createTabGroup(Ti.App.Styles.main.window)
			},
			log: {
				window: Ti.UI.createWindow(Ti.App.Styles.log.window),
				view: Ti.UI.createScrollView(Ti.App.Styles.log.view),
				output: Ti.UI.createLabel(Ti.App.Styles.log.output),
				logout: Ti.UI.createButton(Ti.App.Styles.main.buttos.logout),
				clear: Ti.UI.createButton({title: 'Clear'})
			},
			list: {
				window: Ti.UI.createWindow(Ti.App.Styles.list.window),
				table: Ti.UI.createTableView(Ti.App.Styles.list.table),
				logout: Ti.UI.createButton(Ti.App.Styles.main.buttos.logout),
				data: {
					hasDetail: false,
					selectionStyle: Titanium.UI.iPhone.TableViewCellSelectionStyle.GRAY,
					selectedColor: 'black',
					rows: [],
					consumers: [
						{
							title: 'Terme',
							consumer: {
								consumerKey: "key",
								consumerSecret: "secret",
								method: "POST",
								serviceProvider:{
									signatureMethod: "HMAC-SHA1",
									requestToken:{
										url: "http://term.ie/oauth/example/request_token.php"
									},
									userAuthorization: {
										url: ""
									},
									accessToken: {
										url: "http://term.ie/oauth/example/access_token.php"
									},
									testing: {
										url:  "http://term.ie/oauth/example/echo_api.php",
										parameters: [
											['method', 'foozee'],
											['foozee', 'method']
										]
									}
								}
							}
						},
						{
							title: 'Madgex',
							consumer: {
								consumerKey: "key",
								consumerSecret: "secret",
								method: "POST",
								serviceProvider:{
									signatureMethod: "HMAC-SHA1",
									requestToken: {
										url: "http://echo.lab.madgex.com/request-token.ashx"
									},
									userAuthorization: {
										url: ""
									},
									accessToken: {
										url: "http://echo.lab.madgex.com/access-token.ashx"
									},
									testing: {
										url: "http://echo.lab.madgex.com/echo.ashx",
										parameters: [
											['method', 'foozee'],
											['foozee', 'method']
										]
									}
								}
							}
						},
						{
							title: 'Google',
							consumer: {
								consumerKey: "anonymous",
								consumerSecret: "anonymous",
								method: "POST",
								serviceProvider:{
									signatureMethod: "HMAC-SHA1",
									requestToken: {
										url: "https://www.google.com/accounts/OAuthGetRequestToken",
										parameters: [
											['oauth_callback',""],
											['scope',"https://docs.google.com/feeds/documents"]
										]
									},
									userAuthorization: {
										url: 'https://accounts.google.com/ServiceLogin?btmpl=authsub&continue=https://accounts.google.com/OAuthAuthorizeToken?oauth_token=<oauth_token>&hd=default&continue2=https://www.google.com/a/{{domain}}/OAuthAuthorizeToken?oauth_token=<oauth_token>&spl=true&passive=true&ul=1'//"https://www.google.com/accounts/OAuthAuthorizeToken"
									},
									accessToken: {
										url: "https://www.google.com/accounts/OAuthGetAccessToken"
									},
									testing: {
										url: "https://docs.google.com/feeds/documents/private/full",
										method: "GET"
									}
								}
							}
						}
					]
				}
			}
		}
	};
	
	local.UI.log.window.rightNavButton = local.UI.log.logout;
	local.UI.log.window.leftNavButton = local.UI.log.clear;
	
	local.UI.list.window.rightNavButton = local.UI.list.logout;
	
	local.UI.log.tab = Ti.UI.createTab({
		window: local.UI.log.window,
		title: 'Logs'
	});
	local.UI.main.window.addTab(local.UI.log.tab);
	
	local.UI.list.tab = Ti.UI.createTab({
		window: local.UI.list.window,
		title: 'List'
	});
	local.UI.main.window.addTab(local.UI.list.tab);
	
	
	local.UI.log.view.add(local.UI.log.output);
	local.UI.log.window.add(local.UI.log.view);
	
	local.UI.list.window.add(local.UI.list.table);
	
	local.UI.list.data.consumers.forEach(function(item, i){
		item.selectedColor = local.UI.list.data.selectedColor;
		item.selectionStyle = local.UI.list.data.selectionStyle;
		item.hasDetail = local.UI.list.data.hasDetail;
		local.UI.list.data.rows.push(Ti.UI.createTableViewRow(item));
	});
	
	local.UI.list.table.setData(local.UI.list.data.rows);
	
	return {
		open: function(){
			Ti.App.UI[(Ti.App.API.oauth.loggedIn() && 'show' || 'hide') + 'LogoutButton']();
			
			local.UI.main.window.setActiveTab(local.UI.list.tab);
			local.UI.main.window.open({
				transition: Ti.UI.iPhone.AnimationStyle.FLIP_FROM_LEFT
			});
		},
		print: function(text){
			local.UI.log.output.text = local.UI.log.output.text.replace('~>','') + text + '\n~>';
		},
		clear_output: function(){
			local.UI.log.output.text = Ti.App.Styles.log.output.text;
		},
		catchEvent: function(callback, type, tab, element, subelement){
			if(subelement !== undefined){
				local.UI[tab][element][subelement].addEventListener(type, callback);
			}else{
				local.UI[tab][element].addEventListener(type, callback);
			}
		},
		hideLogoutButton: function(){
			local.UI.list.window.rightNavButton.hide();
			local.UI.log.window.rightNavButton.hide();
		},
		showLogoutButton: function(){
			local.UI.list.window.rightNavButton.show();
			local.UI.log.window.rightNavButton.show();
		},
		changeTab: function(tab){
			local.UI.main.window.setActiveTab(tab);
		}
	};
	
})();

Ti.App.API = (function(){
	var local = {
		oauth: require('modules/oauth')
	};
	
	local.oauth.initialize();
	
	local.echo = function(consumer){
		consumer = consumer !== null && consumer || local.oauth.GetConsumer();
		
		local.oauth.request(consumer.serviceProvider.testing, function(data){
			Ti.App.UI.print('OAuth, test request:\n ' + (data && data.length && data.indexOf('xml') > -1 && '[xml data]' || data));
			Ti.App.UI.changeTab(0);
	    },false);
	};
	
	local.oauth.catchEvent('login', function(){
	    local.oauth.print_tokens('OAuth, authorization successfully completed!', Ti.App.UI.print);
		local.echo();
	});
	
	local.oauth.catchEvent('logout', function(){
		Ti.App.UI.print('OAuth, de-authorization from \'' + Ti.App.Properties.getString('oauthConsumerName')  + '\' provider successfully completed!', Ti.App.UI.print);
	});
	
	Ti.App.UI.catchEvent(function(e){
		
		Ti.App.UI.print('\n\nOAuth, logg' + (local.oauth.loggedIn() && 'ed' || 'ing') + ' with \'' + e.rowData.title + '\' provider. ');
		local.oauth.changeConsumer(e.rowData.consumer);
		if(Ti.App.Properties.getString('oauthConsumerName') === e.rowData.title && local.oauth.loggedIn()){
			local.echo(e.rowData.consumer);
		}else{
			local.oauth.logout();
			local.oauth.login({
				request: function(data){
					local.oauth.print_tokens('OAuth, request tokens: ' + data, Ti.App.UI.print);
				},
				access: function(data){
					local.oauth.print_tokens('OAuth, access tokens: ' + data, Ti.App.UI.print);
				}
			}, true);
		}
		
		Ti.App.Properties.setString('oauthConsumerName', e.rowData.title);
	},'click', 'list', 'table');
	
	Ti.App.UI.catchEvent(local.oauth.logout,'click', 'list', 'logout');
	Ti.App.UI.catchEvent(local.oauth.logout,'click', 'log', 'logout');
	
	Ti.App.UI.catchEvent(Ti.App.UI.clear_output,'click', 'log', 'clear');

	return {
		oauth: local.oauth
	};
})();

Ti.App.UI.open();
