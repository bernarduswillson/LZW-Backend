const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

function lzwCompress(text) {
  let dictionary = {};
  let maxCode = 127;

  // initialize dictionary with all possible single-character sequences
  for (let i = 0; i <= maxCode; i++) {
    dictionary[String.fromCharCode(i)] = i;
  }

  let compressedData = [];
  let currentSequence = '';

  for (let i = 0; i < text.length; i++) {
    currentSequence += text[i];
    // if current sequence is not in dictionary, add it
    if (!(currentSequence in dictionary)) {
      dictionary[currentSequence] = maxCode + 1;
      maxCode++;
      compressedData.push(decimalToBinary(dictionary[currentSequence.slice(0, -1)]));
      currentSequence = text[i];
    }
  }

  if (currentSequence in dictionary) {
    compressedData.push(decimalToBinary(dictionary[currentSequence]));
  }

  let binaryData = compressedData.join(' ');

  return binaryData;
}

function decimalToBinary(decimal) {
  let binary = decimal.toString(2);
  while (binary.length < 8) {
    binary = '0' + binary;
  }
  return binary;
}

function lzwDecompress(binaryData) {
  let dictionary = {};
  let maxCode = 127;

  // initialize dictionary with all possible single-character sequences
  for (let i = 0; i <= maxCode; i++) {
    dictionary[i] = String.fromCharCode(i);
  }

  let compressedData = [];
  let binaryNumbers = binaryData.split(' ');

  for (let i = 0; i < binaryNumbers.length; i++) {
    compressedData.push(parseInt(binaryNumbers[i], 2));
  }

  let decompressedData = '';
  let currentSequence = String.fromCharCode(compressedData[0]);
  let output = [currentSequence];

  for (let i = 1; i < compressedData.length; i++) {
    let currentCode = compressedData[i];

    let entry = dictionary[currentCode];
    if (entry === undefined) {
      if (dictionary[compressedData[i - 1]] === undefined){
        entry = "*unknown character*"; 
      } else {
        entry = dictionary[compressedData[i - 1]] + dictionary[compressedData[i - 1]][0];
        
      }
    }

    dictionary[maxCode + 1] = dictionary[compressedData[i - 1]] + entry[0];
    maxCode++;

    output.push(entry);

    currentSequence = entry;
  }
  
  for (let i = 0; i < output.length; i++) {
    if (output[i].charCodeAt(0) < 32 || output[i].charCodeAt(0) > 126) {
      output.pop();
    }
  }

  decompressedData = output.join('');

  return decompressedData;
}

function rleCompress(text) {
  let compressedData = '';

  if (text.length === 0) {
    return compressedData;
  }

  let count = 1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === ' ') {
      compressedData += ' ';
      count = 1;
    }
    else if (text[i] === text[i + 1]) {
      count++;
    } else {
      compressedData += count + text[i];
      count = 1;
    }
  }

  return compressedData;
}

function rleDecompress(compressedData) {
  let decompressedData = '';

  if (compressedData.length === 0) {
    return decompressedData;
  }

  let count = 0;
  let index = 0;
  for (let i = 0; i < compressedData.length; i++) {
    if (compressedData[i] === ' ') {
      decompressedData += ' ';
      count = 0;
      index = 0
    } else if (index % 2 === 0) {
      count = compressedData[i];
      index++;
    } else if (index % 2 === 1) {
      for (let j = 0; j < count; j++) {
        decompressedData += compressedData[i];
      }
      count = 0;
      index = 0;
    }
  }

  return decompressedData;
}

const app = express();
app.use(bodyParser.json());
app.use(cors());

// route for LZW Compression
app.post('/compress', (req, res) => {
  const originalText = req.body.text;
  const compressedLZW = lzwCompress(originalText);
  const compressedRLE = rleCompress(compressedLZW);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');

  res.json({ compressedRLE });
});

// route for LZW Decompression
app.post('/decompress', (req, res) => {
  const binaryData = req.body.data;
  const decompressedRLE = rleDecompress(binaryData);
  const decompressedLZW = lzwDecompress(decompressedRLE);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');

  res.json({ decompressedLZW });
});

const port = process.env.PORT || 8082;

app.listen(port, () => console.log(`Server running on port ${port}`));
