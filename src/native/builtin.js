const builtInModules = new Map();

builtInModules.set('@async', ()=>require('../builtin/async.js'));
builtInModules.set('@fs', ()=>require('../builtin/fs.js'));
builtInModules.set('@random', ()=>require('../builtin/random.js'));

module.exports = builtInModules;
