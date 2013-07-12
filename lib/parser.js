var EMPTY, TAB, SPACE, EOL;
var fs, path, util, split, stream;
var Readable, Writable, Transform;

EMPTY = '';
SPACE = ' ';
TAB = '\t';
EOL = require('os').EOL;

fs = require('fs');
path = require('path');
util = require('util');
split = require('split');
stream = require('stream');

Readable = stream.Readable;
Writable = stream.Writable;
Transform = stream.Transform;

function LineParser(options) {

    if (!(this instanceof LineParser))
        return new LineParser(options);

    Transform.call(this, options);

    this.config = options;
    this.blocks = [];
    this.previous = {};
}

util.inherits(LineParser, Transform);

function Parser(options) {

    if (!(this instanceof Parser))
        return new Parser(options);

    Transform.call(this, options);

    options = options || {};

    options.syntaxName = options.syntaxName || options.defaults.syntaxName;
    options.syntaxDir = options.syntaxDir || path.join(__dirname, '../syntax');

    if (!options.syntax) {
        var syntaxFile, syntaxFileContents;

        // Read the syntax definition file.
        syntaxFile = path.join(options.syntaxDir, options.syntaxName + '.json');
        syntaxFileContents = fs.readFileSync(syntaxFile, {encoding: 'UTF-8'});
        options.syntax = JSON.parse(syntaxFileContents);
    }

    options.keywordMatcher = RegExp(options.syntax.keywords.join('|'), 'i');
    options.lineMatcher = RegExp("^(\\s*)(" + options.syntax.keywords.join('|') + ") ", 'i');

    this.config = options;
}

util.inherits(Parser, Transform);

Parser.prototype = Object.create(
    Transform.prototype, { constructor: { value: Parser }}
);

Parser.prototype.parse = function(text, callback) {
    var self, readable, writable, lineParser;

    self = this;
    readable = new Readable;
    writable = new Writable;
    lineParser = new LineParser(this.config);

    callback || (callback = function(error, parsed) {
        if (error) { throw error; }
        return parsed;
    });

    writable._write = function(output, encoding, done) {
        self.push(output);
        done();
    };

    writable.on('finish', function() {
        self.push(null);
        callback(null, self.read().toString());
    });

    readable.push(text);
    readable.push(null);

    readable.pipe(split()).pipe(lineParser).pipe(writable);
};

Parser.prototype._transform = function(input, encoding, done) {
    var self, readable, writable, lineParser;

    self = this;
    readable = new Readable;
    writable = new Writable;
    lineParser = new LineParser(this.config);

    writable._write = function(output, encoding, done) {
        self.push(output);
        done();
    };

    writable.on('finish', function() {
        self.push(null);
    });

    readable.push(input);
    readable.push(null);

    readable.pipe(split()).pipe(lineParser).pipe(writable);

    done();
}

LineParser.prototype._transform = function(chunk, encoding, done) {
    var stream, line;

    stream = this;
    line = chunk.toString();
    this._parseLine(line, stream, function() {
        done();
    });
}

LineParser.prototype._parseLine = function(line, stream, done) {
    var blocks, previous, depth, indent, keyword;

    blocks = this.blocks;
    previous = this.previous;
    depth = this._numberOfIndents(line)
    indent = keyword = line.match(this.config.lineMatcher);
    indent = indent ? indent[1] : EMPTY;
    keyword = keyword ? keyword[2] : null;

    if (previous.keyword) {

        // Handle case where NOTHING follows a keyword.
        if (depth <= previous.depth) {
            stream.push(");" + EOL);
        }

        // Handle case where SOMETHING follows a keyword.
        if (depth > previous.depth) {
            stream.push(", function() {" + EOL);
            blocks.push(previous.indent + "});" + EOL);
        }
    }

    // Close any open code blocks.
    while (blocks.length > 0 && depth < previous.depth--) {
        stream.push(blocks.pop());
    }

    if (keyword) {

        var string;
        keyword = keyword.toLowerCase();
        string = line.slice(indent.length + keyword.length + SPACE.length);
        stream.push(indent);
        stream.push(keyword);
        stream.push('(');
        stream.push('"' + string + '"');
    }

    else {

        var code;
        stream.push(indent);
        code = line.slice(indent.length);
        this._parseCode(code, stream);
        stream.push(EOL);
    }

    this.previous.depth = depth;
    this.previous.indent = indent;
    this.previous.keyword = keyword;

    done();
}

LineParser.prototype._parseCode = function(code, stream) {

    // TODO: Automatically combine spaced code into "dotted" code.
    // For now, this just passes any code through as written.

    stream.push(code);
}

LineParser.prototype._numberOfIndents = function(text) {
    var index, count, spaces, char;

    index = 0;
    count = 0;
    spaces = 0;
    char = text.charAt(index);

    while (char === TAB || char === SPACE) {
        if (char === TAB) {
            count++;
        }
        else if (char === SPACE) {
            if (++spaces % 4 === 0) {
                count++;
            }
        }
        char = text.charAt(++index);
    }
    return count;
}

module.exports = Parser;
