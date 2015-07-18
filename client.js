/* global JiraAuth: true, OAuth, ServiceConfiguration, Random, Meteor, Accounts */
"use strict";

JiraAuth = {};
var serviceName = 'jira';

Meteor.loginWithJira = function(options, callback) {
    // support a callback without options
    if (! callback && typeof options === "function") {
        callback = options;
        options = null;
    }

    var credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(callback);
    JiraAuth.requestCredential(options, credentialRequestCompleteCallback);
};

JiraAuth.requestCredential = function(options, credentialRequestCompleteCallback) {
    // support both (options, callback) and (callback).
    if (!credentialRequestCompleteCallback && typeof options === 'function') {
        credentialRequestCompleteCallback = options;
        options = {};
    }
  
    var config = ServiceConfiguration.configurations.findOne({service: serviceName});
    if (!config) {
        if(credentialRequestCompleteCallback) {
            credentialRequestCompleteCallback(new ServiceConfiguration.ConfigError());
        }
        return;
    }

    var credentialToken = Random.secret();
    var loginStyle = OAuth._loginStyle(serviceName, config, options);
    var stateParam = OAuth._stateParam(loginStyle, credentialToken);

    // url to app, caught in `server.js`
    var loginPath = '_oauth/' + serviceName + '/?requestTokenAndRedirect=true' +
                    '&state=' + stateParam +
                    '&jiraHost=' + options.jiraHost;

    if (Meteor.isCordova) {
        loginPath = loginPath + "&cordova=true";
        if (/Android/i.test(navigator.userAgent)) {
            loginPath = loginPath + "&android=true";
        }
    }

    var loginUrl = Meteor.absoluteUrl(loginPath);

    OAuth.launchLogin({
        loginService: serviceName,
        loginStyle: loginStyle,
        loginUrl: loginUrl,
        credentialRequestCompleteCallback: credentialRequestCompleteCallback,
        credentialToken: credentialToken
    });
};
