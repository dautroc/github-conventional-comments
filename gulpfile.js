const gulp = require("gulp");
const sass = require("gulp-dart-sass");
const cleanCSS = require("gulp-clean-css");
const rename = require("gulp-rename");
const sourcemaps = require("gulp-sourcemaps");
const del = require("del");
const esbuild = require("gulp-esbuild");

// Paths
const paths = {
  scss: "src/styles/styles.scss",
  ts: "src/main.ts",
  dist: "extension/",
  manifest: "manifest.json",
};

// Clean dist folder
function clean() {
  return del([paths.dist]);
}

// Compile SCSS to CSS (production)
function styles() {
  return gulp
    .src(paths.scss)
    .pipe(sourcemaps.init())
    .pipe(sass().on("error", sass.logError))
    .pipe(cleanCSS())
    .pipe(rename("styles.css"))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest(paths.dist));
}

// Compile SCSS to CSS (development)
function stylesDev() {
  return gulp
    .src(paths.scss)
    .pipe(sourcemaps.init())
    .pipe(sass().on("error", sass.logError))
    .pipe(rename("styles.css"))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest(paths.dist));
}

// Bundle TypeScript to single file and minify (production)
function scripts() {
  return gulp
    .src(paths.ts)
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
}

// Bundle TypeScript to single file (development)
function scriptsDev() {
  return gulp
    .src(paths.ts)
    .pipe(
      esbuild({
        outfile: "main.js",
        bundle: true,
        minify: false,
        sourcemap: true,
        target: "es2017",
        format: "iife",
        platform: "browser",
      })
    )
    .pipe(gulp.dest(paths.dist));
}

// Copy manifest.json
function manifest() {
  return gulp.src(paths.manifest).pipe(gulp.dest(paths.dist));
}

// Watch for changes (development)
function watch() {
  gulp.watch(paths.scss, stylesDev);
  gulp.watch(paths.ts, scriptsDev);
}

// Build task (production)
const build = gulp.series(clean, gulp.parallel(styles, scripts, manifest));

// Build task (development)
const buildDev = gulp.series(
  clean,
  gulp.parallel(stylesDev, scriptsDev, manifest)
);

// Development workflow: build + watch
const dev = gulp.series(buildDev, watch);

// Exports
exports.clean = clean;
exports.build = build;
exports.dev = dev;
exports.default = build;
