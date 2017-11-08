var gulp = require("gulp"),
	gutil = require("gulp-util"),
    handlebars = require("gulp-compile-handlebars"),
    rename = require("gulp-rename"),
    less = require("gulp-less"),
    cleanCSS = require("gulp-clean-css"),
    autoprefixer = require("gulp-autoprefixer"),
    browserify = require("browserify"),
    source = require("vinyl-source-stream"),
    buffer = require("vinyl-buffer"),
    plumber = require("gulp-plumber"),
    uglify = require("uglify-es"),
    composer = require("gulp-uglify/composer"),
    uglifyjs = composer(uglify, console),
    surge = require("gulp-surge"),
    browserSync = require("browser-sync").create(),
    historyApiFallback = require('connect-history-api-fallback');

// Compilation tasks
gulp.task("handlebars", function(){
	var options = {
		ignorePartials: true,
		batch: ["./templates", "./templates/head", "./templates/tpl"],
		helpers: {
			capitals : function(str){
                return str.fn(this).toUpperCase();
            },
            titleCase: function(str){
            	return str.fn(this).replace(/\w\S*/g, function(txt){
					return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
				});
            },
            ifEquals: function(a, b, opts){
            	if(a == b){
			        return opts.fn(this);
            	}else{
			        return opts.inverse(this);
			    }
            }
		}
	};

	return gulp.src("templates/main.hbs")
		.pipe(plumber({
			errorHandler: onError
		}))
        .pipe(handlebars({page: "index"}, options))
        .pipe(rename("index.html"))
        .pipe(gulp.dest("dist"));
});

gulp.task("stylesheets", function(){
	var lessOptions = {
		paths: ["./stylesheets"]
	};

	var cleanCSSOptions = {};

	return gulp.src("./stylesheets/style.less")
		.pipe(plumber({
			errorHandler: onError
		}))
		.pipe(less(lessOptions))
		.pipe(autoprefixer())
		.pipe(gulp.dest("./dist/stylesheets"))
		.pipe(cleanCSS(cleanCSSOptions))
		.pipe(rename("style.min.css"))
		.pipe(gulp.dest("./dist/stylesheets"))
		.pipe(browserSync.stream());
});

gulp.task("javascripts", function(){
	var uglifyOptions = {};

	return browserify("./javascripts/custom.js", {
		debug: true,
		// standalone: "app"
	})
        .bundle()
        .on("error", onError)
        .pipe(plumber({
			errorHandler: onError
		}))
        .pipe(source("main.js"))
        .pipe(gulp.dest("./dist/javascripts/"))
        .pipe(buffer())
        .pipe(uglifyjs(uglifyOptions))
        .pipe(rename("main.min.js"))
        .pipe(gulp.dest("./dist/javascripts/"));
});

gulp.task("copy-libraries-js", function(){
	return gulp.src("./javascripts/vendor/*")
		.pipe(gulp.dest("./dist/javascripts/vendor"));
});

gulp.task("copy-css", function(){
	gulp.src("./stylesheets/fonts/*")
		.pipe(gulp.dest("./dist/stylesheets/fonts"));

	gulp.src("./stylesheets/img/*")
		.pipe(gulp.dest("./dist/stylesheets/img"));

	return gulp.src("./stylesheets/normalize.min.css")
		.pipe(gulp.dest("./dist/stylesheets"));
});

gulp.task("copy-images", function(){
	return gulp.src("./images/**/*")
		.pipe(gulp.dest("./dist/images"));
});

// Server
gulp.task("server", ["default"], function(){
	browserSync.init({
        server: "./dist",
        middleware: [ historyApiFallback() ]
    });

    gulp.watch("./stylesheets/**/*.less", ["stylesheets"]);
    gulp.watch("./stylesheets/(normalize.min.css|fonts/*|img/*)", ["copy-css"]);

    gulp.watch("./javascripts/**/*.js", ["javascripts"]);
    gulp.watch("./javascripts/vendor/*", ["copy-libraries-js"]);

    gulp.watch("./templates/**/*", ["handlebars"]);

    gulp.watch("./images/**/*", ["copy-images"]);

    gulp.watch("./dist/*.html").on("change", browserSync.reload);
    gulp.watch("./dist/javascripts/**/*").on("change", browserSync.reload);
    gulp.watch("./dist/stylesheets/(normalize.min.css|fonts/*|img/*)").on("change", browserSync.reload);
});


// Deployment tasks
gulp.task("deploy:dev", ["default"], function(){
	return surge({
    	project: "./dist",         // Path to your static build directory
    	domain: ""  // Your domain or Surge subdomain
	});
});

gulp.task("deploy:prod", ["default"], function(){
	return surge({
    	project: "./dist",         // Path to your static build directory
    	domain: ""  // Your domain or Surge subdomain
	});
});


gulp.task("static-files", ["copy-libraries-js", "copy-css", "copy-images"]);
gulp.task("default", ["handlebars", "stylesheets", "javascripts", "static-files"]);
gulp.task("deploy", ["deploy:dev"]);


function onError(err){
	gutil.log(gutil.colors.red('Error (' + err.plugin + '): ' + err.message));
	gutil.log(err.toString());
	this.emit("end");
}