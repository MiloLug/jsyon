class Random {
    constructor(global) {
        this.__global = global;
    }

    async from_range(range) {
        const i = (
            // 10 ^ (number places) = (max number for this digits count) + 1,
            // so the number will always have a possibility to reach the length of the range
            Math.random() * 10 ** (
                // get number places count
                Math.log10(Math.abs(range.length))|0 + 1
            ) | 0
        ) % range.length;

        return range?.__get_attr__ ? range.__get_attr__(i) : range[i];
    }
}

module.exports = Random;
