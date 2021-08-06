import {hornyRun} from '../src/main.js';

hornyRun(`

global hornyJoin = [:std Fn[joiner, arr, raw:
    this arr (reduce) [
        @:std Obj[
            @:std Arr[joiner, @:this joiner],
            :std Arr[str, '']
        ],
        :std Fn[context, item, i, raw last: [
            this context str += [@:
                std Str[@: this i (then-else) [@:this context joiner, '']]
                + [@: std Str[@:this item]]
            ],
            this context
        ]]
    ]
    str
]]

`)
