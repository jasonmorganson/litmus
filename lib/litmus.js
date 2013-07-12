var fs, path, Litmus, Parser, version, defaults, configure, run, parse;

fs = require('fs');
path = require('path');

Parser = require('./parser');

version = require('../package.json').version;

defaults = {
    dir: process.cwd(),
    extention: '.litmus',
    syntaxName: 'mocha'
};

configure = function(options) {

    options = options || {};
    options.defaults = defaults;
    options.dir = options.dir || defaults.dir;
    options.sourceDir = options.sourceDir || options.dir;
    options.outputDir = options.outputDir || options.dir;
    options.extension = options.extention || defaults.extention;

    return options;
};

run = function(args) {
    var config, files, nextFile, complete;

    if (args == null) {
        args = process.argv;
    }

    if (args.length) {
        // TODO: Add command line arguments support
    }

    config = configure();

    // Read list of files in the source directory.
    fs.readdir(config.sourceDir, function(error, sourceFiles) {

        if (error) {
            throw new Error("Could not read files from source directory.");
        }

        files = sourceFiles;
        nextFile();
    });

    nextFile = function() {
        var filename, basename, extension, source, sourceFile, output, outputFile, parser;

        if (files.length) {

            filename = files.shift();
            extension = path.extname(filename);

            if (extension != config.extension) {
                return nextFile();
            }

            basename = path.basename(filename, path.extname(filename));
            sourceFile = path.join(config.sourceDir, filename);
            outputFile = path.join(config.outputDir, basename + '.js');
            source = fs.createReadStream(sourceFile);
            output = fs.createWriteStream(outputFile);
            parser = new Parser(config);

            source.pipe(parser).pipe(output);

            nextFile();
        }
    };
};

parse = function(text, callback) {
    var config, parser;

    config = configure();
    parser = new Parser(config);

    callback || (callback = function(error, parsed) {
        if (error) { throw error; }
        return parsed;
    });

    parser.parse(text, function(error, parsed) {
        callback(error, parsed);
    });
};

Litmus = module.exports = {
    run: run,
    parse: parse,
    version: version
};
