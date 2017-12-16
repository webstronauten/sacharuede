require('es6-promise').polyfill();

/* ****************************************************************************************************
*  Variables                                                                                          *
**************************************************************************************************** */

var confGlobal = require('./gulp/config/gulp-global.json');
var confPlugins = require('./gulp/config/gulp-plugins.json');

var gulp = require('gulp');
var plugins = require("gulp-load-plugins")({
  pattern: ['gulp-*', 'gulp.*'],
  replaceString: /\bgulp[\-.]/
});
var runSequence = require('run-sequence');
var del = require('del');
var babelify = require('babelify');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var pngquant = require('pngquant');
var envify = require('envify/custom');

/* ****************************************************************************************************
*                                                                                                     *
*  MAIN TASKS                                                                                         *
*                                                                                                     *
**************************************************************************************************** */

gulp.task('default', function() {
  gulp.run(['dev']);
});

gulp.task('dev', function() {
  confGlobal.isDevelop = true;
  runSequence(['css','svg'], 'watch');
});

gulp.task('prod', function() {
    confGlobal.isDevelop = false;
	runSequence('clean', ['css','svg']);
});

/* ****************************************************************************************************
*                                                                                                     *
*  SUBTASKS                                                                                           *
*                                                                                                     *
**************************************************************************************************** */

gulp.task('css', function() {
    var autoprefixer = require('autoprefixer');
    var pseudoelements = require('postcss-pseudoelements');
	var cssnano = require('cssnano');
	
    var processors = [
      autoprefixer(confPlugins.autoprefixer),
      pseudoelements
    ];

	if (!confGlobal.isDevelop) {
	    console.log('PLATFORM = PROD');

		processors = [
		  autoprefixer(confPlugins.autoprefixer),
		  pseudoelements,
		  cssnano
		 ];
    }
	
	return gulp.src('./source/css/style.scss')
      .pipe(plugins.plumber({ handleError: function(err) { console.log(err); this.emit('end'); } }))
      //.pipe(plugins.scssLint(confPlugins.scssLint))
      .pipe(plugins.sass())
      .pipe(plugins.if(!confGlobal.isDevelop, plugins.postcss(processors)))
      .pipe(plugins.if(!confGlobal.isDevelop && confGlobal.enableGZIP, plugins.gzip(confPlugins.gzipOptions)))
      .pipe(plugins.rename('settings.css.lens'))
      .pipe(gulp.dest('./dist/css/'));
});

gulp.task('svg', function () {
    return gulp.src('./source/img/icon/*.svg')
        .pipe(plugins.svgSymbols({
            title: '%f icon',
            svgClassname: 'svg-hidden',
            templates: ['default-svg']
        }))
        .pipe(plugins.rename('icons.svg'))
        .pipe(gulp.dest('./dist/img'));
});

gulp.task('watch', function(){
	plugins.watch('./source/css/**/*.scss', function() {
	  console.log('SCSS file changed, processing css...');
      gulp.run(['css']);
    });
	
    plugins.watch('./source/img/icon/*.svg', function() {
        console.log('SVG icon changed, processing svg sprite...');
        gulp.run(['svg']);
    });
});