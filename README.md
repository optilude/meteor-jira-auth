# Attempt 1

Pieces of the puzzle:

* Jira uses OAuth 1 (?)
* Example NodeJS app: https://bitbucket.org/atlassian_tutorial/atlassian-oauth-examples/raw/d625161454d1ca97b4515c6147b093fac9a68f7e/nodejs/app.js
* Signature method should be RSA-SHA1
* Signature hash should be `crypto.createSign("RSA-SHA1").update(signatureBase).sign(key, 'base64')` where `key` is the private key

* Request token path is /plugins/servlet/oauth/request-token
* Authorise URL is /plugins/servlet/oauth/authorize?oauth_token={request_token}"
* Access token path is /plugins/servlet/oauth/access-token"

* `OAuth.registerService` takes a `urls` parameter like:

    {
        requestToken: "https://example.jira.com/plugins/servlet/oauth/request-token",
        authorize: "https://example.jira.com/plugins/servlet/oauth/authorize",
        accessToken: "https://example.jira.com/plugins/servlet/oauth/access-token",
        authenticate: "https://example.jira.com/oauth/authenticate"
    };
* URLs can also be functions, called with `OAuth1Binding` as `this`
* Callback for `OAuth.registerService` is passed `OAuth1Binding`

Questions:

* TODO: What is the `authenticate` URL?
* How do we make the urls dynamic?
* How do we access basic user profile data?

* How do we pass `consumerKey` and `secret`? Passed as `config` to `OAuth1Binding`
* This comes from service configuration: `var config = ServiceConfiguration.configurations.findOne({service: service.serviceName});`

Problems:

* It looks like `oauth1` has this code, which implies we can't use our keys:
* Could monkey patch to read from `self._config`
* Likely `_getSignature` also bogus

# Attempt 2

* Store in Mongo/server:
    * Against Meteor install: `private_key`
    * Against JIRA instance: `consumer_key` and `url`
    * Against user: `token_secret` and `access_token`
* New client-side function `loginWithJira`:
    * Call `getAuthorizeURL`
    * Temporarily store `request_token`, `token_secret` in session (?) (Q: Where does Meteor's OAuth store it?)
    * Launch popup or redirect to `url`
* Client-side ping-back to receive `requet_token` and `oauth_verifier`: (Q: How does Meteor's OAuth register this?)
    * Call `swapRequestTokenWithAccessToken` with `request_token`, `token_secret` and `oauth_verifier`
    * Create user in database and store `access_token`, `token_secret`
    * Call `Accounts.callLoginMethod` with unique options
* Server side handler registered with `Accounts.registerLoginHandler()`
    * Check for valid token
    * Return user id

Questions/unknowns:

* How to temporarily store tokens during redirect flow
    * `OAuth._storePendingCredential()` and `OAuth.retrievePendingCredential()`
* Routing for callback URL
* How to re-login after restart (client startup function?)
* How to extract key from popup
    * `oauth_browser.js`
* What does OAuth store in the database?

* Investigate:
    * `oauth_client.js`
    * `OAuth.retrieveCredential(token, secret)`
    * `OAuth.getDataAfterRedirect()` -- called from client-side Meteor.startup()
    * `OAuth._retrieveCredentialSecret()`
    * `Accounts.registerLoginHandler` in `oauth_server.js`
    * `Accounts.updateOrCreateUserFromExternalService()`

# Attempt 3

* Consumer key and private key stored in `ServiceConfiguration`
* `Meteor.loginWithJira()` function called from client

* `OAuth._storeRequestToken` can be used on the server to store the request token (from `oauth1` package)
* The custom request handler listens for the callback URL
    * Q: How do we keep hold of the key that lets us call `OAuth._retrieveRequestToken()`?
