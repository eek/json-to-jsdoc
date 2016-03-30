module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt); // npm install --save-dev load-grunt-tasks

  grunt.initConfig({
    babel: {
      options: {
        sourceMap: true,
        presets: ['es2015']
      },
      dist: {
        files: [{
          expand: true,
          cwd: 'src/',
          src: ['**/*.js'],
          dest: 'dist/',
          ext: '.js'
        }]
      }
    },
    watch: {
      files: ['src/scss/**/*.scss', 'src/*.js'],
      tasks: ['sass', 'babel']
    },
    sass: {
      dev: {
        files: {
          'dist/css/main.css': 'src/scss/main.scss'
        }
      },
      options: {
        style: 'compressed'
      }
    },
    browserSync: {
      dev: {
        bsFiles: {
          src: [
            'dust/app.js',
            'dist/css/*.css',
            'index.html'
          ]
        },
        options: {
          watchTask: true,
          server: './'
        }
      }
    }
  });

  // load npm tasks
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-browser-sync');

  // define default task
  grunt.registerTask('default', ['browserSync', 'watch', 'babel']);
};
