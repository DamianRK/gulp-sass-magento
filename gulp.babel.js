'use strict';

import gulp from 'gulp';
import browserSync from 'browser-sync';
import gulpLoadPlugins from 'gulp-load-plugins';
import gutil from 'gulp-util';
import imagemin from 'gulp-imagemin';

let runSequence = require('run-sequence').use(gulp);
let $ = gulpLoadPlugins();

let isEmail = require('yargs').argv.email || false;    // check if email styles are included

// ----------------------------------------------------------------------------
// CONFIG
// ----------------------------------------------------------------------------
const HOST_URL = 'http://project-name.dev';
const root = './skin/frontend/package/theme';
const appRoot = './app/design/frontend/package/theme';
const PATHS = {
  dist: `${root}`,
  tmp: '.tmp/',
  scripts: [`${root}/src/js/**/*.js`, `!${root}/src/js/**/*.spec.js`],
  vendor: [`${root}/src/js_vendor/**/*.js`, `!${root}/src/js_vendor/**/*.spec.js`],
  tests: `${root}/src/js/**/*.spec.js`,
  styles: `${root}/src/scss/**/*.scss`,
  emailStyles: `${root}/src/scss/email*.scss`,
  images: `${root}/src/images/**/*`,
  templates: `${appRoot}/template/**/*.phtml`,
  layouts: `${appRoot}/layout/**/*.xml`,
  modules: [],
  static: [
    // `${root}/index.html`,
    // `${root}/fonts/**/*`,
  ],
  fonts: `${root}/src/fonts/*`,
};

// ----------------------------------------------------------------------------
// Tasks
// ----------------------------------------------------------------------------
gulp.task('default', ['build']);

gulp.task('build', () => runSequence('styles', 'scripts', 'fonts', 'images'));

gulp.task('fonts', () => {
  return gulp
    .src(PATHS.fonts)
    .pipe(gulp.dest(`${PATHS.dist}/fonts/`));
});

gulp.task('styles', () => {
  let sassOptions = {
    style: 'expanded',
    outputStyle: 'compressed',
    precision: 10
  };

  return gulp
    .src(isEmail ? PATHS.styles : [PATHS.styles, `!${PATHS.emailStyles}`])
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.sass.sync(sassOptions).on('error', $.sass.logError))
    .pipe($.autoprefixer({browsers: ['last 5 version']})).on('error', errorHandler('Autoprefixer'))
    .pipe($.csso())
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest(`${PATHS.dist}/css`))
    .pipe($.size({showFiles: true}))
    .pipe(browserSync.stream());
});

gulp.task('scripts', ['script:custom', 'script:vendor']);

gulp.task('script:custom', () => {

  let _task = gulp
    .src(PATHS.scripts)
    .pipe($.sourcemaps.init())
    .pipe($.plumber())
    .pipe($.babel())

    // original -- app.js
    .pipe($.concat('custom.js'))
    .pipe($.sourcemaps.write('.'))
    .pipe($.uglify())
    .pipe(gulp.dest(`${PATHS.dist}/js/`))
    .pipe($.size({showFiles: true}));

  _task.pipe(browserSync.stream());

  return _task;
});

gulp.task('script:vendor', () => {

  return gulp
    .src(PATHS.vendor)
    .pipe($.plumber())
    .pipe($.concat('vendors.js'))
    .pipe($.uglify())
    .pipe(gulp.dest(`${PATHS.dist}/js/`))
    .pipe($.size({showFiles: true}));
});

gulp.task('watch', () => {

  gulp.watch(PATHS.styles, ['styles']);

  gulp.watch([PATHS.vendor, PATHS.scripts], ['scripts']);

  gulp.watch([PATHS.templates, PATHS.layouts]).on('change', browserSync.reload);
});

gulp.task('serve', ['watch'], () => browserSyncInit());

gulp.task('images', () =>
  gulp.src(PATHS.images)
    .pipe(imagemin())
    .pipe(gulp.dest(`${PATHS.dist}/images`))
);


// Private
// ----------------------------------------------------------------------------

function browserSyncInit(browser) {
  browser = browser || 'default';

  let options = {
    port: 3000,
    proxy: {
      target: HOST_URL
    },
    ghostMode: {
      clicks: false,
      location: false,
      forms: false,
      scroll: true
    },
    injectChanges: true,
    logFileChanges: true,
    logLevel: 'debug',
    logPrefix: 'gulp-kp',
    notify: true,
    reloadDelay: 0, //1000,
    online: true,
    browser: browser
  };

  browserSync.instance = browserSync.init(options);
}

/**
 *  Common implementation for an error handler of a Gulp plugin
 */
function errorHandler(title) {
  'use strict';

  return (err) => {
    gutil.log(gutil.colors.red('[' + title + ']'), err.toString());
  };
};