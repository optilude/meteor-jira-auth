# JIRA OAuth support for Meteor

## Installation

## Usage

### Generating a public/private key pair



### Registering an Application Link in JIRA

### Configuring Meteor

Add `service-configuration to Meteor`:

    $ meteor add service-configuration

Then the following to, for example a `server/config.js` file in your Meteor project
that runs serv

    ServiceConfiguration.configurations.upsert(
        { service: "jira" },
        {
            $set: {
                loginStyle: 'popup', // or 'redirect'
                consumerKey: "MyApp", // configured with JIRA
                privateKey: Assets.getText("keys/myapp.pem") // as per above
            }
        }
    );

### Logging in

On the client, call the `Meteor.loginWithYammer()`` function. See the Meteor
documentation (https://docs.meteor.com/#/full/meteor_loginwithexternalservice)
for details of the parameters.
