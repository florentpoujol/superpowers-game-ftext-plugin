var gulp = require("gulp");
var tasks = ["stylus"];

// Stylus
var stylus = require("gulp-stylus");
var cssimport = require("gulp-cssimport");
gulp.task("stylus", function() {
  gulp.src("./textEditorWidget/index.styl").pipe(stylus()).pipe(cssimport()).pipe(gulp.dest("./public/textEditorWidget"));
});

// Browserify
var browserify = require("browserify");
var vinylSourceStream = require("vinyl-source-stream");
function makeBrowserify(sourcePath, destPath, outputName, standalone, taskName) {
  gulp.task((taskName || outputName) + "-browserify", function() {   
    var options = {};
    if (standalone === true)
      options = { standalone: "fTextEditorWidget" };
    browserify(sourcePath+"index.js", options).
    transform("brfs").
    bundle().
    pipe(vinylSourceStream(outputName + ".js")).
    pipe(gulp.dest(destPath));
  });
  tasks.push((taskName || outputName) + "-browserify");
}

makeBrowserify("./textEditorWidget/", "./public", "textEditorWidget/index", true, "textEditorWidget");

// All
gulp.task("default", tasks);
