module.exports = function(content1, content2, shingleLength, callback){
  // based on http://habrahabr.ru/post/65944/
  var args = [];
  for (var i = 0; i < arguments.length; i++) {
    args.push(arguments[i]);
  }

  content1 = args.shift();
  content2 = args.shift();
  callback = args.pop();

  if(args.length > 0) {
    shingleLength = args.shift();
  } else {
    shingleLength = 10;
  }

  // first init modules
  var pos = require('pos');
  var crc = require('crc');
  var fs = require('fs');
  var async = require('async');

  var SHINGLE_LENGTH = shingleLength;

// it always can be better
  var textCanonization = function(text, callback) {
    var strWordRemove = function(entry) {
      // we can't remove 'in' in 'in-app' string
      // http://stackoverflow.com/questions/2881445/utf-8-word-boundary-regex-in-javascript
      var regex = new RegExp('(^|\\s)'  + entry + '(?=\\s|$)', 'g');
      text = text.replace(regex, '');
    };

// function for clearing the text from all special characters
    var strCharacterRemove = function(entry) {
      // http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
      var escapeRegExp = function (str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
      };

      var regex = new RegExp(escapeRegExp(entry), 'g');
      text = text.replace(regex, '');
    };

    var withoutTagsRegex = /(<([^>]+)>)/ig;

    // here we have text without html tags
    text = text.replace(withoutTagsRegex, "");

    text = text.trim();
    /*
     fs.readFile('./data/english.stop', 'utf8', function (err,data) {
     if (err) {
     return console.log(err);
     }
     var stopWords = (data.split("\n"));
     stopWords.forEach(strWordRemove);
     });
     */
    ['”', '“', "\n", '\r'].forEach(strCharacterRemove);

    var words = new pos.Lexer().lex(text);
    var taggedWords = new pos.Tagger().tag(words);

    var removeWords = [];
    var nounWords = [];

    for (var i in taggedWords) {
      var taggedWord = taggedWords[i];
      var word = taggedWord[0];
      var tag = taggedWord[1];

      //Adjective

      /*
       JJ Adjective                big
       JJR Adj., comparative       bigger
       JJS Adj., superlative       biggest
       CC Coord Conjuncn           and,but,or
       IN Preposition              of,in,by
       TO ÒtoÓ                     to
       UH Interjection             oh, oops
       DT Determiner               the,some
       */

      //console.log(word + " /" + tag);
      if(tag === 'NNS') {
        nounWords.push(word);
      }

      if(['JJ', 'JJR', 'JJS', 'CC', 'IN', 'TO', 'UH', 'DT'].indexOf(tag) !== -1) {
        removeWords.push(word);
      }
    }

    removeWords.forEach(strWordRemove);
    // remove all spec symbols
    [',', '.', ':', '$', '#', '"', '(', ')'].forEach(strCharacterRemove);

    // replace all plural nouns to single ones
    nounWords.forEach(function(entry) {
      //parent’s || Apple’s || Smurf’s
      if(entry.length > 2 && entry.slice(-2) === "’s") {
        // now skip it. in future we can test to remove it
        return ;
      }

      var newOne = '';

      if(entry.length > 3 && entry.slice(-3) === "ies") {
        newOne = entry.slice(0, -3) + 'y';
      } else if(entry.length > 2 && entry.slice(-1) === "s") {
        newOne = entry.slice(0,-1);
      } else {
        return ;
      }

      var rexp = new RegExp('(^|\\s)' + entry + '(?=\\s|$)','g')
      text = text.replace(rexp, "$1" + newOne );
    });

    // http://stackoverflow.com/questions/3286874/remove-all-multiple-spaces-in-javascript-and-replace-with-single-space
    text = text.replace(/ +(?= )/g,'');

    callback(text);
  };

  var makeShingles = function(text, callback) {
    var words = text.split(' ');
    var shingles = [];
    var wordsLength = words.length;

    if(wordsLength < SHINGLE_LENGTH) {
      shingles.push(words.join(' '));
    } else {
      while(shingles.length !== (wordsLength - SHINGLE_LENGTH + 1)) {
        shingles.push(words.slice(0, SHINGLE_LENGTH).join(' '));
        words = words.slice(1);
      }
    }

    callback(shingles)
  };


  var hashingShingles = function(shingles, callback) {
    var hashes = [];
    for(var i = 0, n = 1; i < n; i++) {
      var hashedArr = [];
      for(var j = 0, k = shingles.length; j < k; j++) {
        hashedArr.push(crc.crc32(shingles[j]));
      }
      hashes.push(hashedArr);
    }

    callback(hashes);
  };

//*/
//  var fileJSON = require('./article1.json');
//  var content1 = fileJSON.content;

//  var fileJSON2 = require('./article2.json');
//  var content2 = fileJSON2.content;


  async.parallel([
    function(callback){
      textCanonization(content1, function(text) {
        makeShingles(text, function(shingles) {
          hashingShingles(shingles, function(hashes) {
            callback(null, hashes);
          });
        })
      });
    },
    function(callback){
      textCanonization(content2, function(text) {
        makeShingles(text, function(shingles) {
          hashingShingles(shingles, function(hashes) {
            callback(null, hashes);
          });
        })
      });
    }
  ], function(err, results){
    var firstHashes = results[0];
    var secondHashes = results[1];


    var compareShingles = function(arr1, arr2) {
      var count = 0;

      arr1[0].forEach(function(item) {
        if(arr2[0].indexOf(item) !== -1) {
          count++;
        }
      });

      return count*2/(arr1[0].length + arr2[0].length);
    };

    var c = compareShingles(firstHashes, secondHashes);

    callback(null, c);
  });
};