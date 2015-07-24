module.exports = function (grunt) {

  grunt.initConfig({
    jshint: {
      files: ['Gruntfile.js', 'client/**/*.js', 'server/**/*.js', 'test/**/*.js'],
      options: {
        globals: {
          jQuery: false
        },
        reporter: require('jshint-stylish'),
        reporterOutput: 'jshint-report.txt'
      }
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint']
    },
    clean: ['dist', '.tmp'],
    copy: {
      client: {
        expand: true,
        src: ['package.json', 'client/**', '!client/vendor/**', '!client/assets/css/**', 'server/**'],
        dest: 'dist'
      }
    },
    replace: {
      forAliyun: {
        src: 'dist/server/conf.js',
        overwrite: true,
        replacements: [{
          from: "nodeListenAddr: '0.0.0.0'",
          to: "nodeListenAddr: '127.0.0.1'"
        }]
      }
    },
    useminPrepare: {
      html: 'dist/client/wxindex.html'
    },
    usemin: {
      html: ['dist/client/wxindex.html']
    },
    concat: {
      dist: {
        files: [{
          dest: '.tmp/concat/js/3rd.js',
          src: [
            'client/vendor/angular-cookies/angular-cookies.js',
            'client/vendor/angular-animate/angular-animate.js',
            'client/vendor/angular-touch/angular-touch.js'
          ]
        }, {
          dest: '.tmp/concat/js/app.js',
          src: [
            //'client/app/app.js',
            'client/common/**/*.js',
            'client/wxappd/app.js',
            'client/wxappd/**/*.js'
          ]
        }]
      }
    },
    uglify: {
      dist: {
        files: [{
          dest: 'dist/client/assets/js/3rd.min.js',
          src: ['.tmp/concat/js/3rd.js']
        }, {
          dest: 'dist/client/assets/js/app.min.js',
          src: ['.tmp/concat/js/app.js']
        }]
      }
    },
    cssmin: {
      dist: {
        files: [{
          'dist/client/assets/css/app.min.css': ['client/assets/css/styles.css']
        }]
      }
    },
    rev: {
      files: {
        src: ['dist/client/assets/**/*.{js,css}']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  //grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-text-replace');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-rev');
  grunt.loadNpmTasks('grunt-usemin');

  grunt.registerTask('default', ['jshint', 'copy', 'replace:forAliyun', 'useminPrepare', 'concat:dist', 'uglify:dist', 'cssmin:dist', 'rev', 'usemin']);
  grunt.registerTask('localhost', ['jshint', 'copy', 'replace:forLocalhost', 'useminPrepare', 'concat:dist', 'uglify:dist', 'cssmin:dist', 'rev', 'usemin']);

};
