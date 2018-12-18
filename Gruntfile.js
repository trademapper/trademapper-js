module.exports = function(grunt) {
		var sourceDir = 'trademapper',
				resourceDir = sourceDir + '/resources/',
				buildDir = sourceDir + '/build/',
				distDir = 'dist/';

		grunt.initConfig({
				pkg: grunt.file.readJSON('package.json'),

				//Compile sass to css
				sass: {
						dist: {
								src: resourceDir + 'styles/**/*.scss',
								dest: buildDir + 'css/trademapper.css'
						}
				},

				//Watch files for changes, then run given task
				watch: {
						sass: {
								files: [resourceDir + 'styles/**/*.scss'],
								tasks: ['sass']
						}
				},

				clean: {
						dist: [distDir]
				},

				//Copy source files to build dir or dist directory
				copy: {
						build: {
								files: [{
										expand: true,
										cwd: resourceDir,
										src: [
												'images/**/*.jpg',
												'images/**/*.png',
												'images/**/*.gif',
												'images/**/*.svg',
												'fonts/*',
												'styles/*.css',
												'styles/*.css.map'
										],
										dest: buildDir
								}]
						},

						// this copies files from build/, so copy:build needs to be run
						// first for this to produce a working distribution
						dist: {
								files: [
										{
												expand: true,
												cwd: sourceDir,
												src: [
													'build/**',
													'!build/css/trademapper.css.map',
													'!build/styles/bootstrap.css',
													'!build/styles/bootstrap-switch.css',
													'!build/styles/bootstrap.css.map',
													'fragments/**',
													'index.html',
													'js/**',
													'!js/configextra.js',
													'!js/configextra.default.js',
													'sample_data/**',
												],
												dest: distDir
										},
										{
												src: sourceDir + '/js/configextra.default.js',
												dest: distDir + '/js/configextra.js',
										}
								]
						}
				},
		});

		grunt.loadNpmTasks('grunt-contrib-copy');
		grunt.loadNpmTasks('grunt-contrib-sass');
		grunt.loadNpmTasks('grunt-contrib-watch');
		grunt.loadNpmTasks('grunt-contrib-clean');

		grunt.registerTask('default',['sass', 'copy:build', 'watch']);

		// produces a built version of the app in the dist/ directory
		grunt.registerTask('dist', ['clean:dist', 'sass', 'copy:build', 'copy:dist']);
};
