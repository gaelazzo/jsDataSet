// Generated on 2014-03-27 using generator-angular-fullstack 1.2.7
'use strict';

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'
/*globals initConfig, appPath */
/*jshint camelcase: false */


module.exports = function (grunt) {

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  // Define the configuration for all the tasks
  grunt.initConfig(
    {

      pkg: grunt.file.readJSON('package.json'),
      yuidoc: {
        compile: {
          name: '<%= pkg.name %>',
          description: '<%= pkg.description %>',
          version: '<%= pkg.version %>',
          //url: '<%= pkg.homepage %>',
          options: {
            paths: ['./app/scripts/', './lib/controllers/' ],
            //themedir: 'path/to/custom/theme/',
            outdir: 'doc'
          }
        }
      },

      shell: {
        options: {
          stdout: true
        },
        npm_install: {
          command: 'npm install'
        },
        bower_install: {
          command: './node_modules/.bin/bower install'
        },

      },


      // Project settings
      yeoman: {
        // configurable paths
        app: require('./bower.json').appPath || 'app',
        dist: 'dist'
      },




      watch: {

        js: {
          files: ['<%= yeoman.app %>/src/{,*/}*.js'],
          tasks: ['newer:jshint:all'],
          options: {
            livereload: true
          }
        },
        jsTest: {
          files: [
            '<%= yeoman.app %>/src/{,*/}*.js',
            'test/spec/{,*/}*.js'
          ],
          tasks: ['newer:jshint:test', 'karma']
        },
        gruntfile: {
          files: ['Gruntfile.js']
        },

        livereload: {
          files: [
            '{.tmp,<%= yeoman.app %>}/src/{,*//*}*.js',
          ],

          options: {
            livereload: true //was true
          }
        },



        serverTests: {
          files: [
            'server.js',
            '<%= yeoman.app %>/src/*.js',
            'lib/controllers/dataAccess/*.{js,json}',
            'lib/controllers/metaData/*.{js,json}',
            'lib/controllers/helpDeskData/*.{js,json}',
            'lib/controllers/*.{js,json}',
            'test/spec/**/*.js'
          ],
          tasks: ['test:server']

        }

      },

      // Make sure code styles are up to par and there are no obvious mistakes
      jshint: {
        options: {
          jshintrc: '.jshintrc',
          reporter: require('jshint-stylish')
        },
        server: {
          options: {
            jshintrc: 'lib/.jshintrc'
          },
          src: [ 'lib/{,*/}*.js']
        },
        all: [
          '<%= yeoman.app %>/scripts/{,*/}*.js'
        ],
        test: {
          options: {
            jshintrc: 'test/.jshintrc'
          },
          src: ['test/**/{,*/}*.js']  //src: ['test/spec/{,*/}*.js']
        }
      },



      // Test settings
      karma: {
        unit: {
          configFile: './test/karma.conf.js',
          autoWatch: false,
          singleRun: true
        },
        unit_auto: {
          configFile: './test/karma.conf.js',
          autoWatch: true,
          singleRun: false
        }
      },



      selenium_webdriver_phantom: {
        chrome: {

        },
        phantom: {
          options: {
            phantom: {
              path: './node_modules/protractor/selenium/phantomjs.exe',
              args: ['--webdriver', '9999']
            }
          }
        },
        others: {
          path: './node_modules/protractor/selenium/selenium-server-standalone-2.44.0.jar',
          args: ['-port', '8888']
        }

      }

    }
  );

  // Used for delaying livereload until after server has restarted
  grunt.registerTask('wait', function () {
    grunt.log.ok('Waiting for server reload...');

    var done = this.async();

    setTimeout(function () {
      grunt.log.writeln('Done waiting!');
      done();
    }, 500);
  });





  grunt.registerTask('test', ['karma:unit']);
  grunt.registerTask('test:unit', ['karma:unit']);

  //keeping these around for legacy use
  grunt.registerTask('autotest', [ 'autotest:unit']);
  grunt.registerTask('autotest:unit', [ 'karma:unit_auto']);

  //coverage testing
  grunt.registerTask('test:coverage', ['karma:unit_coverage']);
  grunt.registerTask('coverage', ['karma:unit_coverage', 'open:coverage', 'connect:coverage']);

  //installation-related
  grunt.registerTask('install', ['update']);

  grunt.registerTask('update', ['shell:npm_install']);

  grunt.registerTask('default', [
    'test:unit'
  ]);
};
