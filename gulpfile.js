var gulp = require("gulp");
var tasks = [ "jade", "stylus" ];

// Jade
var jade = require("gulp-jade");
gulp.task("jade", function() {
  gulp.src("./editors/**/index.jade").pipe(jade()).pipe(gulp.dest("./public/editors"));
  gulp.src("./settingsEditors/*.jade").pipe(jade()).pipe(gulp.dest("./public"));
});

// Stylus
var stylus = require("gulp-stylus");
var nib = require("nib");
var cssimport = require("gulp-cssimport");
gulp.task("stylus", function() {
  gulp.src("./editors/**/index.styl").pipe(stylus({use: [ nib() ], errors: true})).pipe(cssimport()).pipe(gulp.dest("./public/editors"));
});

// TypeScript
var ts = require("gulp-typescript");
gulp.task("typescript", function() {
  gulp.src([ "**/*.ts", "!node_modules/**", "!api/**", "!gitignore/**" ]).
  pipe(ts({
    typescript: require("typescript"),
    declarationFiles: false,
    module: "commonjs",
    target: "ES5",
    noImplicitAny: true
  }))
  .js.pipe(gulp.dest("./"));
});

// Browserify
var browserify = require("browserify");
var vinylSourceStream = require("vinyl-source-stream");
function makeBrowserify(sourcePath, destinationPath, outputName) {
  gulp.task(outputName + "-browserify", function() {
    gulp.src(sourcePath).
    transform("brfs"). // for reading the code and defs .ts files in api folder and the html in settingsEditors
    bundle().
    pipe(vinylSourceStream(outputName + ".js")).
    pipe(gulp.dest(destinationPath));
  });
  tasks.push(outputName + "-browserify");
}

makeBrowserify("./api/index.js", "./public", "api");
makeBrowserify("./data/index.js", "./public", "data");
makeBrowserify("./runtime/index.js", "./public", "runtime");
makeBrowserify("./editors/ftext/index.js", "./public/editors", "ftext/index");
makeBrowserify("./settingsEditors/index.js", "./public", "settingsEditors");

// settings Editor

// watch
gulp.task("watch", function() {
  gulp.watch("./**/*.jade", ["jade"]);
  gulp.watch("./**/*.styl", ["stylus"]);
  gulp.watch("./api/*.js", ["api-browserify"]);
  gulp.watch("./data/*.js", ["data-browserify"]);
  gulp.watch("./runtime/*.js", ["runtime-browserify"]);
  gulp.watch("./editors/ftext/*.js", ["ftext/index-browserify"]);
  gulp.watch("./settingsEditors/*.js", ["settingsEditors-browserify"]);
  gulp.watch("./**/*.ts", ["typescript"]);
});

// All
gulp.task("default", tasks);
