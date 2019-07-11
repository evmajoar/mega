'use strict';

const gulp = require( 'gulp' ),
  posthtml = require( 'gulp-posthtml' ),
  include = require( 'posthtml-include' ),
  scss = require( 'gulp-sass' ),
  autoprefixer = require( 'gulp-autoprefixer' ),
  csscomb = require( 'gulp-csscomb' ),
  csso = require( 'gulp-csso' ),
  imagemin = require( 'gulp-imagemin' ),
  imageminMozjpeg = require( 'imagemin-mozjpeg' ),
  webp = require( 'imagemin-webp' ),
  svgSprite = require( 'gulp-svg-sprite' ),
  svgMinify = require( 'gulp-svgmin' ),
  ttf2woff = require( 'gulp-ttf2woff' ),
  ttf2woff2 = require( 'gulp-ttf2woff2' ),
  plumber = require( 'gulp-plumber' ),
  notify = require( 'gulp-notify' ),
  rename = require( 'gulp-rename' ),
  newer = require( 'gulp-newer' ),
  uglify = require( 'gulp-uglify' ),
  concat = require( 'gulp-concat' ),
  gulpIf = require( 'gulp-if' ),
  cheerio = require ( 'gulp-cheerio' ),
  replace = require ( 'gulp-replace' ),
  del = require( 'del' ),
  browserSync = require( 'browser-sync' ).create();

const root = {
  src: 'src/',
  build: 'build/'
};

const path = {
  src: {
    html: root.src + '*.html',
    css: root.src + '*.scss',
    js: root.src + 'scripts/**/*.js',
    img: root.src + 'images/',
    font: root.src + 'fonts/**/*.ttf',
    ico: root.src + 'icons/**/*.svg',
    theme: root.src + 'theme/*.*',
  },
  build: {
    html: root.build,
    css: root.build + 'styles/',
    js: root.build + 'scripts/',
    font: root.build + 'fonts/',
    img: root.build + 'images/'
  },
  watch: {
    html: [
      root.src + 'markup/**/*.html',
      root.src + '*.html'
    ],
    css: [
      root.src + 'styles/blocks/**/*.scss',
      root.src + 'styles/common/**/*.scss',
      root.src + 'styles/helpers/**/*.scss'
    ],
    js: root.src + 'scripts/**/*.js',
    font: root.src + 'fonts/**/*.ttf',
    img: root.src + 'images/',
    ico: root.src + 'icons/**/*.svg'
  }
};


/* CLEAN DIRECTORY */
function cleanDirectory() {
  return del(['build']);
}


/* COMPILE HTML */
function compileHTML() {
  return gulp.src( path.src.html )
    .pipe( plumber( {
      errorHandler: notify.onError( {
        title: "Ошибка в HTML",
        message: "Error: <%= error.message %>"
      } )
    } ) )
    .pipe( posthtml([
      include()
    ]) )
    .pipe( gulp.dest( path.build.html ) )
    .pipe( browserSync.stream() );
}


/* COMPILE CSS */
function compileCSS() {
  return gulp.src( path.src.css )
    .pipe( plumber( {
      errorHandler: notify.onError( {
        title: "Ошибка в CSS",
        message: "Error: <%= error.message %>"
      } )
    } ) )
    .pipe( scss() )
    .pipe( autoprefixer({
      cascade: false
    } ) )
    .pipe( csscomb() )
    .pipe( csso({
      comments: false
    } ) )
    .pipe( rename({
      suffix: '.min'
    } ) )
    .pipe( gulp.dest( path.build.css ) )
    .pipe( browserSync.stream() );
}


/* COMPILE JAVASCRIPT */
function compileJS() {
  return gulp.src( path.src.js )
    .pipe( plumber( {
      errorHandler: notify.onError( {
        title: "Ошибка в JS",
        message: "Error: <%= error.message %>"
      } )
    } ) )
    .pipe( concat('script.js') )
    .pipe( uglify() )
    .pipe( rename({
      suffix: '.min'
    }) )
    .pipe( gulp.dest( path.build.js ) )
    .pipe( browserSync.stream() );
}


/* CONVERT FONTS */
function convertTTFtoWOFF() {
  return gulp.src( path.src.font )
    .pipe(newer( path.build.font ) )
    .pipe( ttf2woff() )
    .pipe( gulp.dest(path.build.font) )
    .pipe( browserSync.stream() );
}

function convertTTFtoWOFF2() {
  return gulp.src( path.src.font )
    .pipe( newer( path.build.font ) )
    .pipe( ttf2woff2() )
    .pipe( gulp.dest( path.build.font ) )
    .pipe( browserSync.stream() );
}


/* OPTIMIZE IMAGES AND CONVERT TO WEBP */
function optimizeImages() {
  return gulp.src( path.src.img + '**/*.{jpg,png,svg}' )
    .pipe( newer( path.build.img ) )
    .pipe( imagemin([
      imagemin.optipng(),
      imagemin.svgo( {
        plugins: [
          {removeViewBox: false},
          {removeTitle: true},
          {cleanupNumericValues:
            {floatPrecision: 0}
          }
        ]
      } ),
      imageminMozjpeg({
        quality: 100
      } )
    ] ) )
    .pipe( gulp.dest( path.build.img) )
    .pipe( browserSync.stream() );
}

function convertImagesToWebp() {
  return gulp.src( path.src.img + '**/*.{jpg,png}' )
    .pipe( newer( path.build.img ) )
    .pipe( imagemin([
      webp({
        quality: 80
      } )
    ] ) )
    .pipe( rename({
      extname: '.webp'
    } ) )
    .pipe( gulp.dest( path.build.img ) )
    .pipe( browserSync.stream() );
}


/* CREATE SVG SPRITE */
function assemblySvgSprites() {
  return gulp.src( path.src.ico )
    .pipe( svgMinify( {
      js2svg: {
        pretty: true
      }
    } ) )
    .pipe( cheerio({
      run: function ($) {
        $('[fill]').removeAttr('fill');
        $('[stroke]').removeAttr('stroke');
        $('[style]').removeAttr('style');
      },
      parserOptions: { xmlMode: true }
    } ) )
    .pipe( replace('&gt;', '>') )
    .pipe( svgSprite({
      mode: {
        symbol: {
          dest: '.',
          bust: false,
          sprite: "../icons/sprite.svg",
          prefix: '%-svg-',
          dimensions: true,
          render: {
            scss: {
              dest:'_sprite.scss'
            }
          }
        }
      }
    } ) )
    .pipe( gulpIf( '*.scss', gulp.dest( root.src + 'styles/helpers'), gulp.dest( path.build.img ) ) )
    .pipe( browserSync.stream() );
}


/* RUN BUILD */
exports.cleanDirectory = cleanDirectory;

const build = gulp.series(cleanDirectory, gulp.parallel(
  compileHTML,
  compileCSS,
  compileJS,
  convertTTFtoWOFF,
  convertTTFtoWOFF2,
  optimizeImages,
  convertImagesToWebp,
  assemblySvgSprites,
));

exports.build = build;


/* RUN LIVE SERVER */
function runServer() {
  browserSync.init( {
    server: root.build,
    cors: true,
    notify: false
  } );

  browserSync.watch( root.src + '**/*.*' ).on( 'change', browserSync.reload );
}


/* RUN WATCHER */
function watchFiles() {
  gulp.watch( path.watch.html, compileHTML );
  gulp.watch( path.watch.css, compileCSS );
  gulp.watch( path.watch.js, compileJS );
  gulp.watch( path.watch.font, convertTTFtoWOFF );
  gulp.watch( path.watch.font, convertTTFtoWOFF2 );
  gulp.watch( path.watch.img + '**/*.{jpg,png,svg}', optimizeImages );
  gulp.watch( path.watch.img + '**/*.{jpg,png}', convertImagesToWebp );
  gulp.watch( path.watch.ico, assemblySvgSprites );
}


/* DEVELOPMENT */
exports.development = gulp.series( build, gulp.parallel( runServer, watchFiles ) );
