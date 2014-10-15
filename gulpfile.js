var gulp          = require('gulp');
var sourcemaps    = require('gulp-sourcemaps');

// js
var concat        = require('gulp-concat');
var coffee        = require('gulp-coffee');
var uglify        = require('gulp-uglify');
var mainFiles     = require('main-bower-files');
var templateCache = require('gulp-angular-templatecache');

// sass
var sass          = require('gulp-sass');
var minifyCSS     = require('gulp-minify-css');

// html
var htmlMin       = require('gulp-htmlmin');

// utils
var browserSync   = require('browser-sync');
var reload        = browserSync.reload;
var gulpIf        = require('gulp-if');
var gutil         = require('gulp-util');

var dist = {
  directory: "www/"
};

gulp.task('browser-sync', function() {
  browserSync({
    open: false,
    // proxy: "localhost:8080",
    notify: false,
    server: {
      baseDir: 'www'
    }
  });
});

gulp.task('js', function() {
  return gulp.src(['src/js/**/*'])
    .pipe(sourcemaps.init())
      .pipe(gulpIf(/[.]coffee$/, coffee().on('error', function(e) {
        gutil.beep();
        gutil.log(e);
      } )))
      // .pipe(concat('app.js'))
      // .pipe(uglify().on('error', gutil.log))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(dist.directory + 'js/'))
    .pipe(reload({stream: true}));
});

gulp.task('bower', function() {
  gulp.src(mainFiles(), { base: 'bower_components'})
  // gulp.src('bower_components/**')
  .pipe(gulp.dest(dist.directory + 'lib'));
});

gulp.task('views', function() {
  gulp.src('src/index.html').pipe(gulp.dest(dist.directory))
  .pipe(reload({stream: true}));
});

gulp.task('ng-templates', function() {
  gulp.src('src/templates/**/*')
  .pipe(htmlMin({ collapseWhitespace: true }))
  .pipe(templateCache({
    module: 'youLock'
  }))
  .pipe(uglify())
  .pipe(gulp.dest(dist.directory + 'js'))
  .pipe(reload({stream: true}));
});

gulp.task('styles', function() {
  gulp.src('src/css/application.scss')
  .pipe(sass({
    onError: function(e) {console.log(e); }
  }))
  .pipe(minifyCSS({keepBreaks: true}))
  .pipe(gulp.dest(dist.directory + 'css/'))
  .pipe(reload({stream: true}));
});

gulp.task('img', function() {
  gulp.src('src/img/**.*')
    // .pipe(imageMin({
    //   optimizationLevel: 7
    // }))
    .pipe(gulp.dest(dist.directory + 'img'));
});

gulp.task('watch', function() {
  gulp.watch(['src/js/**', 'src/js/**/*.js'], ['js']);
  gulp.watch(['src/index.html'], ['views']);
  gulp.watch(['src/templates/**'], ['ng-templates']);
  gulp.watch(['src/css/**'], ['styles']);
});

gulp.task('default', ['browser-sync', 'build', 'watch']);

gulp.task('build', ['js', 'views', 'ng-templates', 'styles', 'img', 'bower']);
