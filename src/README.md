Near duplicate detection for node.js <br>
Installation <br>
  ```
  npm i near-dup-detection
  ```
Declaration <br>
  ```
ndd(text1, text2, [shingleLength = 10], callback(err, result))
  ```
Example <br>
  ```
  var ndd = require('near-dup-detection');

  ndd(text1, text2, function(err, result) {
    console.log(result); // from 0 to 1 where 1 - the same documents
  });
  ```
