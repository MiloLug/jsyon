const path = require('path');

module.exports = {
    entry: './src/web/main.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'jsyon.js',
        library: {
            name: 'jsyon',
            type: 'umd'
        },
        globalObject: 'this'
    }
};

