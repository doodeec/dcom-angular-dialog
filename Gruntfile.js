'use strict';

module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);
    require('time-grunt')(grunt);
    require('grunt-devtools')(grunt);

    // configurable paths
    var yeomanConfig = {
        app: 'app',
        dist: 'dist'
    };

    try {
        yeomanConfig.app = require('./bower.json').appPath || 'demo';
        yeomanConfig.appName = require('./bower.json').name;
        yeomanConfig.appVersion = require('./package.json').version;
    } catch (e) {
    }

    grunt.initConfig({
        yeoman: yeomanConfig,
        copy: {
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: 'demo/src/',
                        dest: 'src',
                        src: '*.{css,js}'
                    }
                ]
            }
        },
        uglify: {
            dist: {
                files: {
                    'src/<%= yeoman.appName %>-<%= yeoman.appVersion %>.min.js': ['src/dcModal.js']
                }
            }
        },
        cssmin: {
            minify: {
                files: {
                    'src/<%= yeoman.appName %>-<%= yeoman.appVersion %>.min.css': ['src/dcModal.css']
                }
            }
        },
        autoprefixer: {
            options: {
                browsers: ['last 2 version']
            },
            dist: {
                files: [
                    {
                        expand: true,
                        src: 'demo/src/*.css',
                        dest: ''
                    }
                ]
            }
        }
    });

    grunt.registerTask('minify', [
        'copy',
        'uglify',
        'cssmin'
    ]);

    grunt.registerTask('default', [
        'autoprefixer',
        'minify'
    ]);
};
