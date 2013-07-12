litmus
======

## Literate Testing ##

Shorthand plaintext DSL for writing tests in natural language and an easy to
read format so you can focus on the tests themselves. It does this by letting
you write your tests without brackets or quotation.

Lets you to write:

    Describe a feature
        It should exist
            Object.should.exist();
        It should not be null
            Object.should.not.be.null();
        It will do this someday

Instead of:

    describe("a feature", function() {
        it("should exist", function() {
            Object.should.exist();
        });
        it("should not be null", function() {
            Object.should.not.be.null();
        });
        it("will do this someday");
    });

## Instalation ##

    sudo npm install -g litmus

## Usage ##

Write your litmus files anywhere and save them with the extension `.litmus`. In the
directory where your files are run:

    litmus

Any litmus files in that directory will be converted to Javascript files that
you can then use in mocha like you normally would.

## Format ##

The file format is just plain text. The extension is `.litmus` by default.

## Syntax ##

The current syntax mirrors the 'mocha.js' BDD interface. It can be changed or
extended by providing a syntax file in JSON format. See `syntax/mocha.json`.

### Whitespace ###

Whitespace is used to distiguish code blocks and so therefore is signifcant.
Any lines at the same level on indentation are considered to be in the same
block.

### Keywords ###

Any line starting with a keyword is treated as a mocha keyword function. If the
line is followed by another at the same indent instead of an indented one it is
set to a pending test.

`Describe` and `It` are currently the only two supported words and are used
exactly how you would in mocha. Capitalization is ignored, so you can write them
however you want to.

## Caveats ##

* All tests are written in the syncronous format

--------------------------------------------------------------------------------

### TODO ###
* Support for async
* Commandline support
* Automatically run test suite
* More parsers
* Syntax highlighters
