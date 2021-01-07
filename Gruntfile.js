'use strict';

var autoprefixer = require('autoprefixer');
var cssnano = require('cssnano');
var _ = require('lodash/core');
var serveStatic = require('serve-static');

module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);
  require('time-grunt')(grunt);

  var project = _.defaults(_.clone(require('./project.settings.json')), {
    src: 'app',
    dist: 'dist',
    temp: '.tmp'
  });

  var vivoomChapsVersion = '';
  var bower = _.clone(require('./bower.json'));
  var vivoomChapsDependency = bower.dependencies['vivoom-chaps'];
  if (vivoomChapsDependency) { //not defined only on the core library source
    var lastIndex = vivoomChapsDependency.lastIndexOf('#');
    if (lastIndex >= 0) {
      // get version by naming convention
      // since the dependency should look like: "git@bitbucket.org:vivoom/vivoom-chaps.git#v1.0.53"
      // where the pound sign is the tag, commit hash, or branch name delimiter.
      vivoomChapsVersion = vivoomChapsDependency.substr(lastIndex + 1);
    }
  }

  let indexHtml = 'bower_components/vivoom-chaps/app/index.html';
  if (grunt.file.exists(project.src + '/index.html')) {
    console.warn('\nWarning: Using custom declared index.html file.\n');
    indexHtml = '<%= project.src %>/index.html';
  }

  grunt.initConfig({
    project: project,

    // Watches files for changes and runs tasks based on the changed files
    watch: {
      js: {
        files: ['<%= project.src %>/{,*/}*.js'],
        tasks: ['newer:jshint:all'],
        options: {
          livereload: '<%= connect.options.livereload %>'
        }
      },
      jsTest: {
        files: ['test/spec/{,*/}*.js'],
        tasks: ['newer:jshint:test', 'karma']
      },
      sass: {
        files: ['<%= project.src %>/{,*/}*.{scss,sass}'],
        tasks: ['sass', 'postcss:serve']
      },
      gruntfile: {
        files: ['Gruntfile.js']
      },
      modernizr: {
        files: ['<%= project.temp %>/modernizr.js']
      },
      livereload: {
        options: {
          livereload: '<%= connect.options.livereload %>'
        },
        files: [
          '<%= project.src %>/**.html',
          '<%= project.temp %>/**.css',
          '<%= project.src %>/**.{png,jpg,jpeg,gif,webp,svg}'
        ]
      }
    },

    // The actual grunt server settings
    connect: {
      options: {
        port: 9010,
        hostname: 'chaps.local', // Change this to '0.0.0.0' to access the server from outside.
        livereload: 35728
      },
      livereload: {
        options: {
          open: true,
          middleware: function (connect) {
            return [
              serveStatic(project.temp),
              connect().use(
                  '/bower_components',
                  serveStatic('./bower_components')
              ),
              connect().use(
                  '/fonts',
                  serveStatic('./bower_components/bootstrap-sass-official/assets/fonts/bootstrap')
              ),
              connect().use(
                  '/fonts',
                  serveStatic('./bower_components/font-awesome/fonts')
              ),
              connect().use(
                  '/fonts',
                  serveStatic('./bower_components/ionic/fonts')
              ),
              serveStatic(project.src),
              serveStatic('./bower_components/vivoom-chaps/campaign'),
              serveStatic('./bower_components/vivoom-chaps/app')
            ];
          }
        }
      },
      dist: {
        options: {
          open: true,
          livereload: false,
          middleware: function(connect) {
            return [
              serveStatic(project.dist),
              connect().use('/config.json', serveStatic('./bower_components/vivoom-chaps/campaign'))
            ];
          }
        }
      }
    },

    // Make sure code styles are up to par and there are no obvious mistakes
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      },
      all: {
        src: [
          'Gruntfile.js',
          '<%= project.src %>/**.js'
        ]
      },
      test: {
        options: {
          jshintrc: 'test/.jshintrc'
        },
        src: ['test/spec/**.js']
      }
    },

    // Empties folders to start fresh
    clean: {
      dist: {
        files: [{
          dot: true,
          src: [
            '<%= project.temp %>',
            '<%= project.dist %>'
          ]
        }]
      },
      server: '<%= project.temp %>',
      package: 'chaps-<%= project.name %>-*.tgz'
    },

    postcss: {
      serve: {
        options: {
          map: true,
          processors: [
            autoprefixer({
              browsers: ['last 5 versions']
            })
          ]
        },
        src: '<%= project.temp %>/**.css'
      },
      dist: {
        options: {
          map: false,
          processors: [
            autoprefixer({
              browsers: ['last 5 versions']
            }),
            cssnano()
          ]
        },
        src: '<%= project.dist %>/**.css'
      }
    },

    // Compiles Sass to CSS and generates necessary files if requested
    sass: {
      options: {
        sourceMap: true
      },
      app: {
        files: [{
          expand: true,
          cwd: '<%= project.src %>',
          src: ['*.{scss,sass}'],
          dest: '<%= project.temp %>',
          ext: '.css'
        }]
      }
    },

    // Renames files for browser caching purposes
    filerev: {
      dist: {
        src: [
          '<%= project.dist %>/app.{js,css}'
        ]
      }
    },

    // Reads HTML for usemin blocks to enable smart builds that automatically
    // concat, minify and revision files. Creates configurations in memory so
    // additional tasks can operate on them
    useminPrepare: {
      html: '<%= project.temp %>/index.html',
      options: {
        dest: '<%= project.dist %>',
        flow: {
          html: {
            steps: {
              js: ['concat', 'uglify']
            },
            post: {}
          }
        }
      }
    },

    // Performs rewrites based on filerev and the useminPrepare configuration
    usemin: {
      html: '<%= project.dist %>/index.html',
      options: {
        assetsDirs: [ '<%= project.dist %>']
      }
    },

    imagemin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= project.dist %>',
          src: '**.{png,jpg,jpeg,gif}',
          dest: '<%= project.dist %>'
        }]
      }
    },

    svgmin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= project.src %>',
          src: '**.svg',
          dest: '<%= project.dist %>'
        }]
      }
    },

    template: {
      index: {
        options: {
          data: {
            meta: {
              title: '<%= project.title %>',
              description: '<%= project.description %>',
              image: '<%= project.image %>',
              url: '<%= project.url %>',
              index: project.index || 'index,follow',
              experienceVersion: project.version || '',
              chapsVersion: vivoomChapsVersion
            },
            scripts: '../bower_components/vivoom-chaps/app'
          }
        },
        files: {
          '<%= project.temp %>/index.html': indexHtml
        }
      }
    },

    ngtemplates: {
      app: {
        cwd: '<%= project.temp %>/templates',
        src: '**.view.html',
        dest: '<%= project.temp %>/concat/app.js',
        options:  {
          append: true,
          module: 'vivoom-chaps',
          htmlmin: '<%= htmlmin.templates %>',
          usemin: 'app.js'
        }
      }
    },

    htmlmin: {
      options: {
        collapseWhitespace: true,
        conservativeCollapse: true,
        collapseBooleanAttributes: true,
        removeCommentsFromCDATA: true,
        removeOptionalTags: true
      },
      templates: {
        files: [{
          expand: true,
          cwd: 'bower_components/vivoom-chaps/app',
          src: ['*.view.html'],
          dest: '<%= project.temp %>/templates'
        }, {
          expand: true,
          cwd: '<%= project.src %>',
          src: ['*.view.html'],
          dest: '<%= project.temp %>/templates'
        }]
      },
      dist: {
        files: [{
          expand: true,
          cwd: '<%= project.dist %>',
          src: ['*.html'],
          dest: '<%= project.dist %>'
        }]
      }
    },

    // Copies remaining files to places other tasks can use
    copy: {
      dist: {
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= project.src %>',
          dest: '<%= project.dist %>',
          src: [
            '*.{ico,png,txt,jpg,jpeg}',
            'fonts/**.*',
            'campaign.json'
          ]
        }, {
          expand: true,
          cwd: '<%= project.temp %>',
          dest: '<%= project.dist %>',
          src: ['**app.{js,css}']
        }, {
          expand: true,
          cwd: 'bower_components/font-awesome/fonts',
          src: '**/*',
          dest: '<%= project.dist %>/fonts/'
        }, {
          expand: true,
          cwd: 'bower_components/ionic/fonts',
          src: '**/*',
          dest: '<%= project.dist %>/fonts/'
        }, {
          expand: true,
          cwd: '<%= project.temp %>',
          src: 'index.html',
          dest: '<%= project.dist %>'
        }, {
          expand: true,
          cwd: 'bower_components/vivoom-chaps/app',
          src: [
            'facebook.login.html',
            'facebook.share.html',
            'logout.html',
            '*.{ico,gif,png,txt,jpg,jpeg}',
            'jplayer/*.js'
          ],
          dest: '<%= project.dist %>'
        }]
      },
      config: {
        expand: true,
        cwd: '<%= project.src %>',
        dest: '<%= project.dist %>',
        src: '{config|campaign}.json'
      }
    },

    modernizr: {
      build: {
        cache: true,
        crawl: false,
        customTests: [],
        dest: '<%= project.temp %>/modernizr.js',
        tests: [ 'backgroundcliptext' ],
        options: [ 'setClasses' ],
        uglify: false
      }
    },

    // Run some tasks in parallel to speed up the build process
    concurrent: {
      minify: [
        'postcss:dist',
        'imagemin:dist',
        'svgmin:dist'
      ]
    },

    // Test settings
    karma: {
      unit: {
        configFile: 'test/karma.conf.js',
        singleRun: true
      }
    },

    maven: {
      options: {
        groupId: 'com.vivoom.chaps',
        artifactId: '<%= project.name %>',
        packaging: 'tgz'
      },
      release: {
        options: {
          url: 'https://nexus.vivoom.co/content/repositories/releases/',
          repositoryId: 'vivoom-releases',
          goal: '<%= grunt.option("goal") || "release" %>'
        },
        files: [{expand: true, cwd: 'dist/', src: ['**'], dest: ''}]
      },
      deploy: {
        options: {
          url: 'https://nexus.vivoom.co/content/repositories/snapshots/',
          repositoryId: 'vivoom-snapshots'
        },
        files: [{expand: true, cwd: 'dist/', src: ['**'], dest: ''}]
      },
      install: {
        files: [{expand: true, cwd: 'dist/', src: ['**'], dest: ''}]
      },
      package: {
        files: [{expand: true, cwd: 'dist/', src: ['**'], dest: ''}]
      }
    },

    shell: {
      pushDevelopment: {
        command: 'ssh docker-builder \'' + [
          'cd docker',
          'git pull',
          'cd vivoom-chaps/development',
          '../gradlew clean push'
        ].join('&&') + '\''
      },
      pushStaging: {
        command: 'ssh docker-builder \'' + [
          'cd docker',
          'git pull',
          'cd vivoom-chaps/staging',
          '../gradlew clean push'
        ].join('&&') + '\''
      },
      pushProduction: {
        command: 'ssh docker-builder \'' + [
          'cd docker',
          'git pull',
          'cd vivoom-chaps/production',
          '../gradlew clean push'
        ].join('&&') + '\''
      },
      updateDevelopment: {
        command: 'ssh platform-dev \'sudo ./check-for-updates.sh\''
      },
      updateStaging: {
        command: 'ssh platform-staging \'sudo ./check-for-updates.sh\''
      },
      updateProduction: {
        command: 'parallel ssh {} \'sudo ./check-for-updates.sh\' ::: platform-prod chaps-prod'
      }
    }
  });

  var staging = grunt.option('staging') || false;
  var production = grunt.option('production') || false;
  var development = grunt.option('development') || !(staging || production);

  grunt.registerTask('serve', 'Compile then start a connect web server', function (target) {
    if (target === 'dist') {
      return grunt.task.run(['build', 'copy:config', 'connect:dist:keepalive']);
    }

    grunt.task.run([
      'clean:server',
      'modernizr',
      'template:index',
      'sass',
      'postcss:serve',
      'connect:livereload',
      'watch'
    ]);
  });

  grunt.registerTask('build', [
    'clean:dist',
    'template:index',
    'modernizr',
    'sass',
    'useminPrepare',
    'concat:generated',
    'htmlmin:templates',
    'ngtemplates',
    'uglify:generated',
    'copy:dist',
    'concurrent:minify',
    'filerev',
    'usemin',
    'htmlmin:dist'
  ]);

  grunt.registerTask('default', [
    'newer:jshint',
    'build'
  ]);

  grunt.registerTask('preDeploy', ['clean:package', 'build']);
  grunt.registerTask('deploy', ['preDeploy', 'maven:deploy']);
  grunt.registerTask('release', ['preDeploy', 'maven:release']);
  grunt.registerTask('install', ['preDeploy', 'maven:install']);

  grunt.registerTask('push', function(target) {
    var tasks = ['deploy'];
    if((development && !target) || target === 'development') {
      tasks.push('shell:pushDevelopment');
    }
    if((staging && !target) || target === 'staging') {
      tasks.push('shell:pushStaging');
    }
    if((production && !target) || target === 'production') {
      tasks.push('shell:pushProduction');
    }
    if(tasks.length === 1) {
      grunt.fail.warn('No environment specified to push.');
    } else {
      grunt.task.run(tasks);
    }
  });

  grunt.registerTask('update', function(target) {
    var tasks = [];
    if((development && !target) || target === 'development') {
      tasks.push('push' + (target ? ':' + target : ''));
      tasks.push('shell:updateDevelopment');
    }
    if((staging && !target) || target === 'staging') {
      tasks.push('push' + (target ? ':' + target : ''));
      tasks.push('shell:updateStaging');
    }
    if((production && !target) || target === 'production') {
      tasks.push('push' + (target ? ':' + target : ''));
      tasks.push('shell:updateProduction');
    }
    if(tasks.length === 0) {
      grunt.fail.warn('No environment specified to push.' + JSON.stringify(tasks));
    } else {
      grunt.task.run(tasks);
    }
  });
};
