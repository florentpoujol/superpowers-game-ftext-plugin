var gulp = require("gulp");
var tasks = [ "jade", "stylus" ];

// Jade
var jade = require("gulp-jade");
gulp.task("jade", function() {
  return gulp.src("./editors/**/index.jade").pipe(jade()).pipe(gulp.dest("./public/editors"));
});

// Stylus
var stylus = require("gulp-stylus");
var nib = require("nib");
var cssimport = require("gulp-cssimport");
gulp.task("stylus", function() {
  return gulp.src("./editors/**/index.styl").pipe(stylus({use: [ nib() ], errors: true})).pipe(cssimport()).pipe(gulp.dest("./public/editors"));
});

// Browserify
var browserify = require("browserify");
var vinylSourceStream = require("vinyl-source-stream");
function makeBrowserify(source, destination, output, compileTs) {
  gulp.task(output + "-browserify", function() {
    var bundler = browserify(source);
    bundler.transform("brfs");
    function bundle() { return bundler.bundle().pipe(vinylSourceStream(output + ".js")).pipe(gulp.dest(destination)); }
    return bundle();
  });
  tasks.push(output + "-browserify");
}

makeBrowserify("./api/index.js", "./public", "api");
makeBrowserify("./data/index.js", "./public", "data", true);
makeBrowserify("./runtime/index.js", "./public", "runtime");
makeBrowserify("./editors/ftext/index.js", "./public/editors", "ftext/index", true);

// watch
gulp.task("watch", function() {
  gulp.watch("./**/index.jade", ["jade"]);
  gulp.watch("./**/index.styl", ["stylus"]);
  gulp.watch("./api/*", ["api-browserify"]);
  gulp.watch("./data/*", ["data-browserify"]);
  gulp.watch("./runtime/*", ["runtime-browserify"]);
  gulp.watch("./editors/ftext/*.coffee", ["ftext/index-browserify"]);
});

// All
gulp.task("default", tasks);
