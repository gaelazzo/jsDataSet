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
                    paths: ['./src' ],
                    exclude: './src/bower_components' ,
                    //themedir: 'path/to/custom/theme/',
                    outdir: 'doc'
                }
            }
        },




      watch: {

        js: {
          files: ['src/{,*/}*.js'],
          tasks: ['newer:jshint:all'],
          options: {
            livereload: true
          }
        },
        jsTest: {
          files: [
            'src/{,*/}*.js',
            'test/spec/{,*/}*.js'
          ],
          tasks: ['newer:jshint:test', 'karma']
        },
        gruntfile: {
          files: ['Gruntfile.js']
        },

        livereload: {
          files: [
            '{.tmp,src/{,*//*}*.js',
          ],

          options: {
            livereload: true //was true
          }
        },



        serverTests: {
          files: [
            'server.js',
            '<%= yeoman.app %>/src/*.js',
            'test/spec/**/*.js'
          ],
          tasks: ['test:server']

        }

      },





      // Test settings
      karma: {
        unit: {
          configFile: 'test/karma.conf.js',
          autoWatch: false,
          singleRun: true
        },
        unit_auto: {
          configFile: 'test/karma.conf.js',
          autoWatch: true,
          singleRun: false
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


  //installation-related
  grunt.registerTask('install', ['update']);

  grunt.registerTask('update', ['shell:npm_install']);

  grunt.registerTask('default', [
    'test:unit'
  ]);
};
