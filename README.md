# JIRA OAuth support for Meteor

This Meteor package implements OAuth authentication against an Atlassian
JIRA installation.

It uses `jira-connector` (https://www.npmjs.com/package/jira-connector) to
authenticate.

## Installation

Add the package to your Meteor application:

    $ meteor add optilude:jira-auth

## Usage

To use JIRA authentication, you must first configure the remote JIRA instance
to accept your app as an inbound authentication link.

### Generating a public/private key pair

JIRA uses public/private key authentication with OAuth. If you don't have a key
pair already, you generate one with the OpenSSL toolchain:

    $ openssl genrsa -out myapp.pem 1024
    $ openssl rsa -in myapp.pem -pubout -out myapp.pub

Replace `myapp` with something meaningful. The private key (the `.pem` file)
should be kept secret. Try to avoid doing things like checking it into source
control, unless it's only a test file, and if you put it with your app,
make sure it lives in the `private/` folder so that it doesn't get picked up
by Meteor for any purpose.

In the example below, we'll assume the keys live in `private/keys/myapp.pem`
and `private/keys/myapp.pub`.

### Registering an Application Link in JIRA

To configure JIRA, log in as an administrator and go to Administration and
then find "Application Links" under "Add-ons".

Create a new application link. Here, you are asked various questions, not all
of which are terribly relevant. The most important things are:

* You only need to configure "incoming" authentication
* You have to pick a "consumer key". This is just a string, but it has to be
  the same string that is configured in Meteor (see below, where we have picked
  "MyApp").
* You need to paste in the public key corresponding to the private key you are
  configuring in Meteor, e.g. the contents of the `myapp.pub` file in the
  example above.
* The callback URL doesn't matter. Meteor overrides this anyway.
* The application URL also doesn't matter. You can test JIRA authentication
  whilst the app is running on localhost.

### Configuring Meteor

You then need to configure Meteor to authenticate with this particular JIRA
host, using the consumer key and corresponding private key.

First, add `service-configuration to Meteor`:

    $ meteor add service-configuration

Then something like the following to, for example a `server/config.js` file in
your Meteor project that runs server-side:

    ServiceConfiguration.configurations.upsert(
        { service: "jira" },
        {
            $set: {
                jiraHost: "my.atlassian.com", // can also be passed to `loginWithJira()`
                loginStyle: 'popup', // or 'redirect'
                consumerKey: "MyApp", // configured with JIRA
                privateKey: Assets.getText("keys/myapp.pem") // as per above
            }
        }
    );

The `Assets.getText()` line is reading the private key file from
`private/keys/myapp.pem` in your Meteor application directory. You could of
course read it from somewhere else, e.g. a settings file.

### Logging in

On the client, call the `Meteor.loginWithJira()`` function to start the login
flow. See the Meteor documentation
(https://docs.meteor.com/#/full/meteor_loginwithexternalservice) for details of
the parameters.

For example:

    Meteor.loginWithJira(function(err) {
        if(err) {
            // handle error, e.g. alert(err);
        } else {
            // do something, e.g. Router.go('home');
        }
    });

You can pass an options object to `loginWithJira()` to override things like
`loginStyle` (set to `"popup"` or `"redirect"``) or the `jiraHost` name.
