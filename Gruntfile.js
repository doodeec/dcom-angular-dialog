// Generated on 2013-11-07 using generator-angular 0.4.0
'use strict';

module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);
  require('time-grunt')(grunt);

  // configurable paths
  var yeomanConfig = {
    app: 'app',
    dist: 'dist'
  };

  try {
    yeomanConfig.app = require('./bower.json').appPath || yeomanConfig.app;
  } catch (e) {}

  grunt.initConfig({
    yeoman: yeomanConfig,
    clean: {
      dist: {
        files: [{
          dot: true,
          src: [
            '.tmp',
            '<%= yeoman.dist %>/*',
            '!<%= yeoman.dist %>/.git*'
          ]
        }]
      },
      server: '.tmp'
    },
    rev: {
      dist: {
        files: {
          src: [
            '<%= yeoman.dist %>/scripts/{,*/}*.js',
            '<%= yeoman.dist %>/styles/{,*/}*.css',
            '<%= yeoman.dist %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
            '<%= yeoman.dist %>/styles/fonts/*'
          ]
        }
      }
    },
    // Put files not handled in other tasks here
    copy: {
      dist: {
        files: [{
          expand: true,
          dot: true,
          dest: 'demo',
          src: 'src/*.*'
        }]
      }
    },
    uglify: {
      dist: {
          files: {
              'src/dcomDialog.min.js':
                  ['src/dcomDialog.js']
          }
      }
    }
  });

  grunt.registerTask('test', [
    'clean:server'
  ]);

  grunt.registerTask('build', [
    'clean:dist',
    'concat',
    'copy:dist',
    'cdnify',
    'ngmin',
    'uglify',
    'rev'
  ]);

  grunt.registerTask('minify', [
    'uglify',
    'copy'
  ]);

  grunt.registerTask('default', [
    'build'
  ]);
};
