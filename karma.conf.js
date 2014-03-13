module.exports = function (config) {
    config.set({
        basePath: '',
        frameworks: ['jasmine'],

        files: [
            'demo/bower_components/angular/angular.js',
            'demo/bower_components/angular-mocks/angular-mocks.js',
            'demo/src/*.js',
            'test/spec/*.js'
        ],

        exclude: [],
        port: 8080,
        logLevel: config.LOG_INFO,
        autoWatch: false,

        browsers: ['Chrome'],
//        browsers: ['Chrome', 'ChromeCanary', 'Firefox'],

        singleRun: false
    });
};
