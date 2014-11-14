module.exports = function(grunt) {
    var sourceDir = 'trademapper/resources/',
        buildDir = 'trademapper/build/';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        //Compile sass to css
        sass: {
            dist: {
                src: sourceDir + 'styles/**/*.scss',
                dest: buildDir + 'css/trademapper.css'
            }
        },

        //Watch files for changes, then run given task
        watch: {
            sass: {
                files: [sourceDir + 'styles/**/*.scss'],
                tasks: ['sass']
            }
        },

        //Copy source files to build dir
        copy: {
            dist: {
                files: [{
                    expand: true,
                    cwd: sourceDir,
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
        }
    });

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default',['sass', 'copy', 'watch']);
};
