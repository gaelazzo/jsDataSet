// Karma configuration
// http://karma-runner.github.io/0.12/config/configuration-file.html
// Generated on 2015-02-06 using
// generator-karma 0.9.0

module.exports = function(config) {
    'use strict';

    config.set({
        // enable / disable watching file and executing tests whenever any file changes
        //autoWatch: true,

        usePolling: true,

        //dots  progress  junit  growl  coverage
        reporters: ['dots'],


        // base path, that will be used to resolve files and exclude
        basePath: '../',

        // testing framework to use (jasmine/mocha/qunit/...)
        frameworks: ['jasmine'],


        // list of files / patterns to load in the browser
        files: [
            'node_modules/jasmine-collection-matchers/index.js',
            'bower_components/lodash/lodash.js',
            'bower_components/observe-js/src/observe.js',
            'bower_components/jsDataQuery/src/jsDataQuery.js',
            'src/jsDataSet.js',
            'test/spec/*.js'
        ],

        // list of files / patterns to exclude
        exclude: [],

        // web server port
        port: 8081,

        // Start these browsers, currently available:
        // - Chrome
        // - ChromeCanary
        // - Firefox
        // - Opera
        // - Safari (only Mac)
        // - PhantomJS
        // - IE (only Windows)
        browsers: [
            'ChromeHeadless'
        ],

        // Which plugins to enable
        plugins: [
            //'karma-phantomjs-launcher',
            'karma-jasmine', 'karma-chrome-launcher','karma-jasmine-html-reporter','karma-spec-reporter'
        ],

        // Continuous Integration mode
        // if true, it capture browsers, run tests and exit
        //singleRun: false,
        client: {
            jasmine: {
                random:false,
                failFast: false,
                timeoutInterval: 5000
            }
        },

        colors: true,

        // level of logging
        // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
        logLevel: config.LOG_DEBUG

        // Uncomment the following lines if you are using grunt's server to run the tests
        // proxies: {
        //   '/': 'http://localhost:9000/'
        // },
        // URL root prevent conflicts with the site root
        // urlRoot: '_karma_'
    });
};
