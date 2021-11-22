# jsyon

### The most powerful language, where u can lose some context

## Build:
```bash
npm i
npm run build
```

## Examples:
#### To run js examples:
`npm run test`
#### To run cli examples (.jy files directly using jsyon runner):
`npm run test-cli`

#### Some code:

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
