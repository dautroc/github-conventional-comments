const gulp = require("gulp");
const sass = require("gulp-sass")(require("sass"));
const del = require("del");
const esbuild = require("gulp-esbuild");

const paths = {
  dist: "extension",
  styles: "src/styles/**/*.scss",
  scripts: ["src/main.ts", "src/settings.ts"],
  manifest: "manifest.json",
  html: "settings.html",
};

const clean = () => del([paths.dist]);

const stylesTask = () =>
  gulp
    .src(paths.styles)
    .pipe(sass().on("error", sass.logError))
    .pipe(gulp.dest(paths.dist));

const scriptsTask = () =>
  gulp
    .src(paths.scripts)
    .pipe(
      esbuild({
        bundle: true,
        sourcemap: "inline",
        target: "es2020",
        format: "iife", // This is the crucial setting we were missing.
        // No 'outfile' is specified, so esbuild will create one file per entry point.
        // e.g., 'src/main.ts' -> 'dist/main.js'
      })
    )
    .pipe(gulp.dest(paths.dist));

const manifestTask = () =>
  gulp.src(paths.manifest).pipe(gulp.dest(paths.dist));

const htmlTask = () => gulp.src(paths.html).pipe(gulp.dest(paths.dist));

const build = gulp.series(
  clean,
  gulp.parallel(stylesTask, scriptsTask, manifestTask, htmlTask)
);

exports.build = build;
exports.default = build;
