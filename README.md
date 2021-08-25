# jsyon

### The most powerful language, where u can lose some context

## Examples:
`join(Array, joinerString)` function, written in jsyon (with some example):

```python
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
```
Prints out `1 UwU 2 UwU 3 UwU 4`
