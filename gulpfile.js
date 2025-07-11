const gulp = require("gulp");
const sass = require("gulp-dart-sass");
const cleanCSS = require("gulp-clean-css");
const sourcemaps = require("gulp-sourcemaps");
const del = require("del");
const esbuild = require("gulp-esbuild");
const merge = require("merge-stream");

// Paths
const paths = {
  scss: "src/styles/*.scss",
  mainTs: "src/main.ts",
  settingTs: "src/settings.ts",
  html: "src/html/*.html",
  icons: "icons/*",
  manifest: "manifest.json",
  dist: "extension/",
};

// Clean
function clean() {
  return del([paths.dist]);
}

// Styles
function styles() {
  return gulp
    .src(paths.scss)
    .pipe(sourcemaps.init())
    .pipe(sass().on("error", sass.logError))
    .pipe(cleanCSS())
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest(paths.dist));
}

// Scripts
function scripts() {
  const mainBuild = gulp
    .src(paths.mainTs)
    .pipe(
      esbuild({
        outfile: "main.js",
        bundle: true,
        minify: true,
        sourcemap: true,
        target: "es2017",
        format: "iife",
        platform: "browser",
      })
    )
    .pipe(gulp.dest(paths.dist));

  const settingsBuild = gulp
    .src(paths.settingTs)
    .pipe(
      esbuild({
        outfile: "settings.js",
        bundle: true,
        minify: true,
        sourcemap: true,
        target: "es2017",
        format: "iife",
        platform: "browser",
      })
    )
    .pipe(gulp.dest(paths.dist));

  return merge(mainBuild, settingsBuild);
}

// Copy files
function copy() {
  return gulp
    .src([paths.manifest, paths.html, paths.icons], { encoding: false })
    .pipe(gulp.dest(paths.dist));
}

// Watch
function watch() {
  gulp.watch(paths.scss, styles);
  gulp.watch([paths.mainTs, paths.settingTs], scripts);
  gulp.watch([paths.manifest, paths.html], copy);
}

// Build tasks
const build = gulp.series(clean, gulp.parallel(styles, scripts, copy));
const dev = gulp.series(build, watch);

// Exports
exports.clean = clean;
exports.build = build;
exports.dev = dev;
exports.default = build;
