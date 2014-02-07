var assert = require("assert");
var ndd = require('./../lib/ndd');
var fs = require('fs');

var text1 = fs.readFileSync('./testFiles/file01.txt', 'utf8');
var text2 = fs.readFileSync('./testFiles/file75.txt', 'utf8');
var text3 = fs.readFileSync('./testFiles/file02.txt', 'utf8');
var text4 = fs.readFileSync('./testFiles/file76.txt', 'utf8');

describe('List of files', function(){
  it('should be more than 0.5', function(done) {
    ndd(text3, text4, function(err, result) {
      if(result > 0.5) {
        done();
      } else {
        done(new Error('Result: ' + result));
      }
    });
  });
  it('should be more than 0.5', function(done) {
    ndd(text1, text2, function(err, result) {
      if(result > 0.5) {
        done();
      } else {
        done(new Error('Result: ' + result));
      }
    });
  });
});