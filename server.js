/* global OAuth, ServiceConfiguration, Meteor, HTTP, _, Accounts, Npm, Random */
"use strict";

var JiraClient = Npm.require('jira-connector');

var getAuthorizeURL = Meteor.wrapAsync(JiraClient.oauth_util.getAuthorizeURL, JiraClient.oauth_util),
    swapRequestTokenWithAccessToken = Meteor.wrapAsync(JiraClient.oauth_util.swapRequestTokenWithAccessToken, JiraClient.oauth_util);

OAuth.registerService("jira", "1.0-jira", {}, function handleOauthRequest(oauthInfo, options) {
    var jiraClient = new JiraClient({
        host: oauthInfo.host,
        oauth: {
            consumer_key: oauthInfo.consumerKey,
            private_key: oauthInfo.privateKey,
            token: oauthInfo.accessToken,
            token_secret: oauthInfo.accessTokenSecret
        }
    });

    var myself = Meteor.wrapAsync(jiraClient.myself.getMyself, jiraClient.myself)({});

    var serviceData = {
        id: myself.name,
        accessToken: OAuth.sealSecret(oauthInfo.accessToken),
        accessTokenSecret: OAuth.sealSecret(oauthInfo.accessTokenSecret)
    };

    return {
        serviceData: serviceData,
        options: {
            profile: {
                name: myself.displayName,
                email: myself.emailAddress
            }
        }
    };
});


OAuth._requestHandlers['1.0-jira'] = function(service, query, res) {
    var config = ServiceConfiguration.configurations.findOne({service: service.serviceName});
    if (!config) {
        throw new ServiceConfiguration.ConfigError(service.serviceName);
    }

    var credentialSecret, oauthResponse;

    if (query.requestTokenAndRedirect) {
        // step 1 - get and store a request token

        var callbackUrl = OAuth._redirectUri(service.serviceName, config, {
            state: query.state,
            jiraHost: query.jiraHost || config.jiraHost,
            cordova: (query.cordova === "true"),
            android: (query.android === "true")
        });

        try {
            oauthResponse = getAuthorizeURL({
                host: query.jiraHost || config.jiraHost,
                oauth: {
                    consumer_key: config.consumerKey,
                    private_key: config.privateKey,
                    callback_url: callbackUrl
                }
            });
        } catch(err) {
            throw err.data;
        }

        // Keep track of request token so we can verify it on the next step
        OAuth._storeRequestToken(
            OAuth._credentialTokenFromQuery(query),
            oauthResponse.token,
            oauthResponse.token_secret
        );

        res.writeHead(302, {'Location': oauthResponse.url});
        res.end();
    } else {
        // step 2, redirected from provider login - store the result
        // and close the window to allow the login handler to proceed

        // Get the user's request token so we can verify it and clear it
        var requestTokenInfo = OAuth._retrieveRequestToken(OAuth._credentialTokenFromQuery(query));

        if (! requestTokenInfo) {
            throw new Error("Unable to retrieve request token");
        }

        // Verify user authorized access and the oauth_token matches
        // the requestToken from previous step
        if (query.oauth_token && query.oauth_token === requestTokenInfo.requestToken) {

            // Prepare the login results before returning.  This way the
            // subsequent call to the `login` method will be immediate.

            // Get the access token for signing requests

            var accessToken = swapRequestTokenWithAccessToken({
                host: query.jiraHost || config.jiraHost,
                oauth: {
                    consumer_key: config.consumerKey,
                    private_key: config.privateKey,
                    token: requestTokenInfo.requestToken,
                    token_secret: requestTokenInfo.requestTokenSecret,
                    oauth_verifier: query.oauth_verifier
                }
            });

            // Run service-specific handler.
            var oauthResult = service.handleOauthRequest({
                host: query.jiraHost || config.jiraHost,
                consumerKey: config.consumerKey,
                privateKey: config.privateKey,
                accessToken: accessToken,
                accessTokenSecret: requestTokenInfo.requestTokenSecret
            }, { query: query });

            var credentialToken = OAuth._credentialTokenFromQuery(query);
            credentialSecret = Random.secret();

            // Store the login result so it can be retrieved in another
            // browser tab by the result handler
            OAuth._storePendingCredential(credentialToken, {
                serviceName: service.serviceName,
                serviceData: oauthResult.serviceData,
                options: oauthResult.options
            }, credentialSecret);
        }

        // Either close the window, redirect, or render nothing
        // if all else fails
        OAuth._renderOauthResults(res, query, credentialSecret);
    }

};
