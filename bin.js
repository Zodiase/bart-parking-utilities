#! /usr/bin/env node

/**
 * This is the command-line interface that runs the functions provided by the
 * library to execute the tasks specified by the input arguments.
 */

var program = require('commander');

var npmManifest = require('./package.json');
var cli = require('./lib/cli.js');

program.version(npmManifest.version).parse(process.argv);

try {
    cli(program.args[0], program).then(
        function(result) {
            process.exit(result);
        },
        function(error) {
            console.error(error.message);
        },
    );
} catch (error) {
    console.error(error.message);
    process.exit(1);
}
