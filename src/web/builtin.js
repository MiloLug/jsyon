const builtInModules = new Map();

builtInModules.set('@async', require('../builtin/async.js'));
builtInModules.set('@random', require('../builtin/random.js'));
builtInModules.set('@branches', require('../builtin/branches.js'));

module.exports = builtInModules;
