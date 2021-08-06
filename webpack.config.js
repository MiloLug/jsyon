import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));


export default {
    entry: './src/main.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'hornylang.js',
        library: {
            name: 'hornylang',
            type: 'umd'
        },
        globalObject: 'this'
    }
}
