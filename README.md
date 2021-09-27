# jsyon

### The most powerful language, where u can lose some context

## Build:
```bash
npm run build
```

## Examples:
`join(joinerString, Array)` function, written in jsyon (with some example):

```ruby
Obj[] (through) [>:[
    ~> join = [:Fn[joiner, arr, $:
        ~> arr (reduce) [
            @:Obj[
                @:Arr[joiner, @:~> joiner],
                :Arr[str, '']
            ],
            :Fn[context, item, i, >$: [
                ~> context str += [@:
                    ~> i (then-else) [@:~> context joiner, '']
                    + [@:Str[@:~> item]]
                ],
                ~> context
            ]]
        ] str
    ]],
    
    print[
        "Join, written in jsyon: ",
        @:~> join[' UwU ', :Arr[1,2,3,4]]
    ]
]]
```
Prints out `1 UwU 2 UwU 3 UwU 4`
