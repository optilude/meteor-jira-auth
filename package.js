/* global Package, Npm */
"use strict";

Package.describe({
    name: 'optilude:jira-auth',
    version: '0.0.4',
    summary: 'Authenticate to a remote JIRA instance',
    git: 'https://github.com/optilude/meteor-jira-auth',
    documentation: 'README.md'
});

Npm.depends({
    "jira-connector": "1.2.1"
});

Package.onUse(function(api) {
    api.versionsFrom('1.1.0.2');

    api.use([
        'oauth',
        'oauth1',
        'underscore',
        'service-configuration',
        'accounts-base',
        'accounts-oauth'
    ]);

    api.imply([
        'accounts-base'
    ]);

    api.addFiles(['server.js'], 'server');
    api.addFiles(['client.js'], 'client');

    api.export('JiraAuth');
});
