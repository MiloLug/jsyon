const {Global} = require('../src/main.js');

Global.eval(`

Obj[] (through) [last:[
    this join = [:Fn[joiner, arr, raw:
        this arr (reduce) [
            @:Obj[
                @:Arr[joiner, @:this joiner],
                :Arr[str, '']
            ],
            :Fn[context, item, i, raw last: [
                this context str += [@:
                    this i (then-else) [@:this context joiner, '']
                    + [@:Str[@:this item]]
                ],
                this context
            ]]
        ]
        str
    ]],

    print[
        "Join, written in jsyon: ",
        @:this join[' UwU ', :Arr[1,2,3,4]]
    ]
]]

`);

