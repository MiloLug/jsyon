const builtInModules = new Map();

builtInModules.set('@async', ()=>require('./Async.js'));
builtInModules.set('@fs', ()=>require('./Fs.js'));
builtInModules.set('@random', ()=>require('./Random.js'));

module.exports = builtInModules;
