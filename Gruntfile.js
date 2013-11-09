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

  grunt.registerTask('minify', [
    'uglify',
    'copy'
  ]);

  grunt.registerTask('default', [
    'minify'
  ]);
};
