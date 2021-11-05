const fs = require('fs').promises;
const path = require('path');

const { Command } = require('commander');
const { version } = require('../package.json');

const { Global, Parser } = require('./native/main.js');


const program = new Command();
program.version(version);


const utils = {
    async readFile(path) {
        try {
            return await fs.readFile(path, "utf-8");
        } catch (e) {
            console.error(`file reading error: ${path}`);
            return null;
        }
    },
};


program
    .command('run')
    .description('run a jsyon file')
    .option('-j, --json', 'run json representation')
    .argument('<file>')
    .action(async (file, options) => {
        let src = await utils.readFile(file);
        if(!src) return;

        let jsyonGlobal = new Global(path.resolve(file));
        
        if(options.json) {
            try {
                src = JSON.parse(src);
            } catch (e) {
                console.error(`invalid json input from ${file}`);
                return;
            }
            await jsyonGlobal.eval_json(src);
        } else
            await jsyonGlobal.eval(src);
    });

program
    .command('get-json <file>')
    .description('produce json representation of given jsyon file')
    .action(async (file) => {
        const src = await utils.readFile(file);
        if(!src) return;

        console.log(JSON.stringify(
            new Parser(src).parse()
        ));
    });

program.parseAsync(process.argv);
