#!/usr/bin/env ts-node

import * as yargs from 'yargs';
import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';
import chalk from 'chalk';

// parse args
const {
  argv: {
    scope,
    prefix = 'packages',
    _: [scriptName],
    $0,
    ...argsObject
  },
} = yargs;

if (!scope) {
  throw new Error('Please provide a scope argument i.e. "--scope <myPackage>"');
}

const packageJSONPath = path.join(__dirname, 'package.json');

const packageJSON = fs.readFileSync(packageJSONPath, {
  encoding: 'UTF-8',
});

const { scripts } = JSON.parse(packageJSON);

const script = scripts[scriptName];

if (!script) {
  throw new Error(`'${scriptName}' not found in ${packageJSONPath}`);
}

// format additional arguments
const argsString = (Object.entries(argsObject) as string[][])
  .map(([key, value]) => [
    key.length === 1 ? '-'.concat(key) : '--'.concat(key),
    value,
  ])
  .reduce((args, argEntry) => args.concat(argEntry), [])
  .join(' ');

// append additional arguments
const scriptWithAdditionalArgs = argsString
  ? script.concat(' ', argsString)
  : script;

const packagePath = path.join(__dirname, prefix as string, scope as string);

const childProcess = cp.exec(scriptWithAdditionalArgs, {
  cwd: packagePath,
});

// execute command
childProcess.stdout.on('data', data => console.log(chalk.italic(data)));

childProcess.stderr.on('data', data => console.error(chalk.red(data)));

childProcess.on('close', () =>
  console.info(chalk.green(`✔ Script: '${scriptWithAdditionalArgs}'`)),
);
