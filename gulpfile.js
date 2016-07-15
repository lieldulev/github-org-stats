var path = require('path');
var gulp = require('gulp');
var plumber = require('gulp-plumber');
var browserify = require('gulp-browserify');
var handlebars = require('gulp-handlebars');
var wrap = require('gulp-wrap');
var merge = require('merge-stream');
var declare = require('gulp-declare');
var concat = require('gulp-concat');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var sass = require('gulp-sass');

gulp.task('sass', function () {
  return gulp.src('app/styles/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(concat('main.css'))
    .pipe(gulp.dest('dist/css/'));
});

// watch files for changes, run the build
gulp.task('serve', ['default'], function() {
  browserSync({
    server: {
      baseDir: 'dist'
    }
  });

  gulp.watch('app/*', ['default']);
  gulp.watch('app/**/*', ['default']);
  gulp.watch('client.js', ['default']);
  gulp.watch('dist/*').on('change', browserSync.reload);
});

// Minify the app for the browser
gulp.task('javascript', function () {
	gulp.src('app/client.js')
    .pipe(plumber())
    .pipe(browserify({
      insertGlobals : true,
      debug : false
    }))
    .pipe(gulp.dest('dist/js/'));

	//gulp.src('app/scripts/github.js')
    //.pipe(browserify({
      //insertGlobals : true,
      //debug : false
    //}))
    //.pipe(gulp.dest('dist/js/'));

});

gulp.task('copy-static-files', function() {
    // index.html, error pages, robot.txt, etc.
    gulp.src('app/*.{html,txt}').pipe(gulp.dest('dist/'));
    // javascript libraries
    gulp.src('app/assets/js/*.js').pipe(gulp.dest('dist/js/'));
    gulp.src('app/assets/images/*').pipe(gulp.dest('dist/images/'));
    gulp.src('app/assets/css/*.css').pipe(gulp.dest('dist/css/'));
});

gulp.task('templates', function(){

  var partials = gulp.src('app/templates/partials/*.hbs')
    .pipe(handlebars())
    .pipe(wrap('Handlebars.registerPartial(<%= processPartialName(file.relative) %>, Handlebars.template(<%= contents %>));', {}, {
      imports: {
        processPartialName: function(fileName) {
          console.log(fileName);
          return JSON.stringify(path.basename(fileName, '.js'));
        }
      }
    }));

  var templates = gulp.src('app/templates/**/*.hbs')
    // Compile each Handlebars template source file to a template function
    .pipe(handlebars())
    // Wrap each template function in a call to Handlebars.template
    .pipe(wrap('Handlebars.template(<%= contents %>)'))
    // Declare template functions as properties and sub-properties of MyApp.templates
    .pipe(declare({
      namespace: 'MyApp.templates',
      noRedeclare: true, // Avoid duplicate declarations
      processName: function(filePath) {
        // Allow nesting based on path using gulp-declare's processNameByPath()
        // You can remove this option completely if you aren't using nested folders
        // Drop the client/templates/ folder from the namespace path by removing it from the filePath
        return declare.processNameByPath(filePath.replace('app/templates/', ''));
      }
    }));

  merge(partials, templates)
    .pipe(concat('templates.js'))
    .pipe(gulp.dest('dist/js/'));
});

gulp.task('default', function (callback) {
  runSequence(
    'copy-static-files',
    'templates',
    'sass',
    'javascript',
    function (error) {
      if (error) {
        console.log(error.message);
      } else {
        console.log('RELEASE FINISHED SUCCESSFULLY');
      }
      callback(error);
    });
});
