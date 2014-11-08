module.exports = function(grunt) {
    var sourceDir = 'trademapper/resources',
        buildDir = 'trademapper/build';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        
        sass: {
            dist: {
                src: sourceDir + '/styles/**/*.scss',
                dest: buildDir + '/css/trademapper.css'
            } 
        },

        watch: {
            sass: {
                files: [sourceDir + '/styles/**/*.scss'],
                tasks: ['sass']
            } 
        },
    });

    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default',['watch']);
}