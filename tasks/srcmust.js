/*
 * grunt-srcmust
 * https://github.com/derrickliu/grunt-srcmust
 *
 * Copyright (c) 2014 derrickliu
 * Licensed under the MIT license.
 */

'use strict';
var fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');
module.exports = function(grunt) {

  function md5(filepath, algorithm, encoding) {
    var hash = crypto.createHash(algorithm);
    grunt.log.verbose.write('Hashing ' + filepath + '...');
    hash.update(grunt.file.read(filepath));
    return hash.digest(encoding);
  }

  function replaceSrc(options,src){
    var dirfiles;
    var srcStr = grunt.file.read(src, 'utf8');
    options.dirs.forEach(function(dir){
      dirfiles = fs.readdirSync(dir);
      srcStr = _replace(options,dirfiles,dir,srcStr);
    });
    if(options.jsdir){
      dirfiles = fs.readdirSync(options.jsdir);
      srcStr = _replace(options,dirfiles,options.jsdir,srcStr);
    }
    if(options.cssdir){
      dirfiles = fs.readdirSync(options.cssdir);
      srcStr = _replace(options,dirfiles,options.cssdir,srcStr);
    }
    if(options.imagesdir){
      dirfiles = fs.readdirSync(options.imagesdir);
      srcStr = _replace(options,dirfiles,options.imagesdir,srcStr);
    }
   
    return srcStr;
  }

  function _replace(options,dirfiles,path,srcStr){

    if(options.type === 'rename'){
      dirfiles.forEach(function(file){
        var s = file.split('.');
        if(s[2] !== undefined){ 
            var fileName = s[1] + '.' + s[2];
            var cifReg = new RegExp('(\\w{8}\.)*' + fileName,'g');
            srcStr = srcStr.replace(cifReg, file);
            grunt.log.writeln('src "' + fileName + '" replace with: "' + file + '"');
        }
      });
      

      //clear md5
      // dirfiles.forEach(function(file){
      //   var cifReg = new RegExp('(\\w{8}\.)*' + file,'g');
      //   srcStr = srcStr.replace(cifReg, file);
      // });
    }
    else{
      dirfiles.forEach(function(file){
        var pathname = path + file;
        var stat = fs.lstatSync(pathname);
          if(!stat.isDirectory()){
          var len =  options.length,
            hash = md5(pathname, options.algorithm, 'hex'),
            prefix = hash.slice(0, len),
            cifReg = new RegExp(file + '(\\?\\w{'+ len +'})*' + '([\"\'])', 'g');

            srcStr = srcStr.replace(cifReg, file + '?' + prefix + '$2');
            grunt.log.write(file + ' ').ok(file + '?' + prefix);
          } 
      });     

      //clear md5
      // dirfiles.forEach(function(file){
      //   var cifReg = new RegExp(file + '(\\?\\w{8})*','g');
      //   srcStr = srcStr.replace(cifReg, file);
      // });
    }
    return srcStr;
  }

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('srcmust', 'resource in page cache control', function() {
    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      dirs:'',
      jsdir: '',
      cssdir: '',
      imagesdir: '',
      algorithm: 'md5',
      length: 8,
      type: 'rename'
    });

    // Iterate over all specified file groups.
    this.files.forEach(function(f) {
      // Concat specified files.
      f.src.filter(function(filepath) {
        // Warn on and remove invalid source files (if nonull was set).
        if (!grunt.file.exists(filepath)) {
          grunt.log.warn('Source file "' + filepath + '" not found.');
          return false;
        } else {
          return true;
        }
      }).map(function(filepath) {
        var src = replaceSrc(options,filepath);
        fs.writeFileSync(filepath,src); 
      });


      // Print a success message.
      grunt.log.writeln('File "' + f.src + '" replaced.');
    });
  });

};
