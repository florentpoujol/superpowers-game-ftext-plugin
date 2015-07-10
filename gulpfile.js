var gulp = require("gulp");
var tasks = [ "jade", "stylus" ];

// Jade
var jade = require("gulp-jade");
gulp.task("jade", function() {
  gulp.src("./editors/**/index.jade").pipe(jade()).pipe(gulp.dest("./public/editors"));
});

// Stylus
var stylus = require("gulp-stylus");
var nib = require("nib");
var cssimport = require("gulp-cssimport");
gulp.task("stylus", function() {
  gulp.src("./editors/**/index.styl").pipe(stylus({use: [ nib() ], errors: true})).pipe(cssimport()).pipe(gulp.dest("./public/editors"));
  gulp.src("./textEditorWidget/index.styl").pipe(stylus({use: [ nib() ], errors: true})).pipe(cssimport()).pipe(gulp.dest("./public/textEditorWidget"));
});

// TypeScript
var ts = require("gulp-typescript");
var tsProject = ts.createProject({
  typescript: require("typescript"),
  noImplicitAny: true,
  declarationFiles: false,
  module: "commonjs",
  target: "ES5"
});

gulp.task("typescript", function() {
  var js = gulp.src([ "**/*.ts", "!node_modules/**", "!api/**", "!gitignore/**" ]).
  pipe(ts(tsProject)).js.
  pipe(gulp.dest("./"));
});
tasks.push("typescript");

// Browserify
var browserify = require("browserify");
var vinylSourceStream = require("vinyl-source-stream");
function makeBrowserify(sourcePath, destPath, outputName, fn) {
  gulp.task(outputName + "-browserify", function() {   
    browserify(sourcePath+"index.js", { standalone: "fTextEditorWidget" }).
    transform("brfs").
    bundle().
    pipe(vinylSourceStream(outputName + ".js")).
    pipe(gulp.dest(destPath));
  });
  tasks.push(outputName + "-browserify");
}

makeBrowserify("./api/", "./public", "api");
makeBrowserify("./data/", "./public", "data");
makeBrowserify("./editors/fText/", "./public/editors", "fText/index");
makeBrowserify("./runtime/", "./public", "runtime");
makeBrowserify("./settingsEditors/", "./public", "settingsEditors");
makeBrowserify("./textEditorWidget/", "./public", "textEditorWidget/index");

// watch
gulp.task("watch", function() {
  gulp.watch("./**/*.jade", ["jade"]);
  gulp.watch("./**/*.styl", ["stylus"]);

  gulp.watch(["./api/*.js", "./api/*.ts"], ["api-browserify"]);
  gulp.watch("./data/*.js", ["data-browserify"]);
  gulp.watch("./editors/fText/*.js", ["fText/index-browserify"]); 
  gulp.watch("./runtime/*.js", ["runtime-browserify"]);
  gulp.watch(["./settingsEditors/*.js", "./settingsEditors/*.html"], ["settingsEditors-browserify"]);
  gulp.watch(["./textEditorWidget/*.js"], ["textEditorWidget-browserify"]);
  
  gulp.watch(["./**/*.ts", "!./api/*.ts"], ["typescript"]);
});

// All
gulp.task("default", tasks);
