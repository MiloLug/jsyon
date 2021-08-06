!function(t,e){"object"==typeof exports&&"object"==typeof module?module.exports=e():"function"==typeof define&&define.amd?define([],e):"object"==typeof exports?exports.hornylang=e():t.hornylang=e()}(this,(function(){return(()=>{"use strict";var t={d:(e,s)=>{for(var r in s)t.o(s,r)&&!t.o(e,r)&&Object.defineProperty(e,r,{enumerable:!0,get:s[r]})},o:(t,e)=>Object.prototype.hasOwnProperty.call(t,e),r:t=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})}},e={};function s(t){return t.replace(/[\/.*+?^${}()|[\]\\\-]/g,"\\$&")}t.r(e),t.d(e,{Global:()=>l,Interpreter:()=>p,Parser:()=>o});class r{constructor(t,e){this.tokens=e,this.tokenLength=t}toString(){return 1===this.tokenLength?`[${s(this.tokens.join(""))}]`:`(?:${this.tokens.map(s).join("|")})`}}class i{constructor(t){this.quote=t}toString(){return`(?:${this.quote})((?:\\\\${this.quote}|.|\\n)*?)(?:${this.quote})`}}class o{static tokenCollections=[new r(2,["+=","-=","/=","*="]),new r(1,["=","+","-","/","*",",",":","[","]","{","}","(",")","@"])];static quoteBlocks=[new i('"'),new i("`"),new i("'")];static blockOpenSymbols={"{":"}","[":"]","(":")"};static blockCloseSymbols={"}":"{","]":"{",")":"("};static tokenizerRegExp=new RegExp(o.quoteBlocks.join("|")+`|(?:\\d|\\w|\\\\(?:${o.tokenCollections.join("|")}))+|`+o.tokenCollections.join("|"),"gmi");constructor(t,e=null){this.tokens=e||[...t.matchAll(o.tokenizerRegExp)].map((t=>t.reverse().find((t=>void 0!==t)))),this.position=0,this.tokensCount=this.tokens.length,this.body=[],this.blockParsers={"{":this.parseObjectBlock.bind(this),"[":this.parseArrayBlock.bind(this),"(":this.parseOperatorBlock.bind(this)}}current(){return this.tokens[this.position]}next(){return this.position++,this.current()}push(t){this.body.push(t)}prepareString(t){return t?t.replace(/\\(.)/gim,"$1"):""}buildExpr(t,e){let s={};return(t=t.filter((t=>t)).reduce(((t,e)=>(t[e]=1,t)),{})).raw&&(s["@__raw"]=1),t["@"]&&(s["@__follow_ctx"]=1),t.last?s["@__last"]=this.getArrayTopLevelItems(e).map((t=>new o(null,t).parse())):s["@__expr"]=new o(null,this.getArrayTopLevelItems(e)[0]).parse(),s}getArrayTopLevelItems(t){let e,s=[],r=0,i=0,n=t.length,h=[];for(;i<n;){if(e=t[i],i++,o.blockOpenSymbols[e])r++;else if(o.blockCloseSymbols[e])r--;else if(","===e&&0===r){s.push(h),h=[];continue}h.push(e),i==n&&s.push(h)}return s}parseArrayBlock(t){let e=this.getArrayTopLevelItems(t),s=[];for(let t of e){let e=t.indexOf(":");-1!==e?s.push(this.buildExpr(t.slice(0,e),"["===t[e+1]?t.slice(e+2,t.length-1):t.slice(e+1,t.length))):s.push(this.prepareString(t.join("")))}return s}parseObjectBlock(t){return this.parseArrayBlock(t)[0]}parseOperatorBlock(t){return`(${t.join("")})`}parseBlock(){let t,e=1,s=this.current(),r=o.blockOpenSymbols[s],i=[];for(;this.position<this.tokensCount;){if(t=this.next(),t===s)e++;else if(t===r&&0==--e)break;i.push(t)}this.next(),this.body.push(this.blockParsers[s](i))}parse(){let t;for(;this.position<this.tokensCount;)t=this.current(),o.blockOpenSymbols[t]?(this.parseBlock(),t=this.current()):(this.push(this.prepareString(t)),this.next());return this.body}}let n,h="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:globalThis;const l=n={js:h,eval:(t,e)=>new p(new o(t).parse(),e).run(),zip:(...t)=>t[0].map(((e,s)=>t.map((t=>t[s])))),print:(...t)=>(console.log(...t),t),Obj:(...t)=>t.reduce(((t,e)=>(t[e[0]]=e[1],t)),{}),Arr:(...t)=>t,Fn(...t){let e=t[t.length-1],s=t.slice(0,t.length-1);return(...t)=>{let r=n.Obj(...n.zip(s,t));return new p(e,r).run()}},Num:t=>new Number(t),Str:t=>new String(t)};class p{constructor(t,e,s){this.entryTypeMethods=new Map,this.entryTypeMethods.set(String,this.processStringEntry.bind(this)),this.entryTypeMethods.set(Array,this.processArrayEntry.bind(this)),this.entryTypeMethods.set(Object,this.processObjectEntry.bind(this)),this.entryTypeMethods.set(Number,this.processStringEntry.bind(this)),this.operators=new Map,this.operators.set("(new)",this.operatorNew.bind(this)),this.operators.set("(as-context)",this.operatorAsContext.bind(this)),this.operators.set("(through)",this.operatorThrough.bind(this)),this.operators.set("(then-else)",this.operatorThenElse.bind(this)),this.operators.set("(else)",this.operatorElse.bind(this)),this.operators.set("(then)",this.operatorThen.bind(this)),this.operators.set("(map)",this.operatorMap.bind(this)),this.operators.set("(reduce)",this.operatorReduce.bind(this)),this.operators.set("=",this.operatorAssign.bind(this)),this.operators.set("+=",this.operatorPlusAssign.bind(this)),this.operators.set("-=",this.operatorMinusAssign.bind(this)),this.operators.set("/=",this.operatorDivAssign.bind(this)),this.operators.set("*=",this.operatorMulAssign.bind(this)),this.operators.set("+",this.operatorPlus.bind(this)),this.operators.set("-",this.operatorMinus.bind(this)),this.operators.set("/",this.operatorDiv.bind(this)),this.operators.set("*",this.operatorMul.bind(this)),this.position=0,this.prevPlace,this.curPlace=s,this.path=t,this.context=e}findStartElements(t){switch(t){case"this":this.curPlace=this.context,this.position++;break;case"global":this.curPlace=l,this.position++;break;default:this.curPlace=l}}processStringEntry(t){if(0!==this.position||null!=this.curPlace){if(this.operators.has(t)){let e=this.prevPlace,s=this.path[this.position-1];return this.prevPlace=this.curPlace,this.curPlace=(...r)=>this.operators.get(t)(e,s,r),void this.position++}null!=this.curPlace&&(this.prevPlace=this.curPlace,this.curPlace=this.curPlace[t]),this.position++}else this.findStartElements(t)}processArrayEntry(t){let e=[];for(let s of t)null!=s&&s.constructor===Object?e.push(this.processObject(s)):e.push(s);let s=this.curPlace;this.curPlace=this.curPlace.apply(this.prevPlace,e),this.prevPlace=s,this.position++}processObjectEntry(t){if(this.prevPlace=this.curPlace,0===this.position&&null==this.curPlace)return this.findStartElements(),this.prevPlace=this.curPlace,this.curPlace=this.processObject(t),void this.position++;null!=this.curPlace&&(this.curPlace=this.curPlace[this.processObject(t)]),this.position++}processObject(t){let e;if(t["@__raw"])return void 0!==t["@__last"]?["this","(as-context)",[{"@__last":t["@__last"]}]]:t["@__expr"];if(t["@__follow_ctx"]&&(e=this.context),void 0!==t["@__expr"])return new p(t["@__expr"],e||this.prevPlace).run();if(void 0!==t["@__last"]){let s;for(let r of t["@__last"])s=new p(r,e||this.prevPlace).run();return s}let s=Object.getOwnPropertyNames(t);for(let e of s){let s=t[e];null!=s&&s.constructor===Object&&(t[e]=this.processObject(s))}return t}operatorAssign(t,e,s){return t[e]=s[0],s[0]}operatorPlusAssign(t,e,s){return t[e]+=s[0],t[e]}operatorMinusAssign(t,e,s){return t[e]-=s[0],t[e]}operatorDivAssign(t,e,s){return t[e]/=s[0],t[e]}operatorMulAssign(t,e,s){return t[e]*=s[0],t[e]}operatorPlus(t,e,s){return this.prevPlace+s[0]}operatorMinus(t,e,s){return this.prevPlace-s[0]}operatorDiv(t,e,s){return this.prevPlace/s[0]}operatorMul(t,e,s){return this.prevPlace*s[0]}operatorNew(t,e,s){return new this.prevPlace(...s)}operatorAsContext(t,e,s){return s[0]}operatorThrough(t,e,s){return this.prevPlace}operatorThenElse(t,e,s){return this.prevPlace?s[0]:s[1]}operatorElse(t,e,s){return this.prevPlace?this.prevPlace:s[0]}operatorThen(t,e,s){return this.prevPlace?s[0]:this.prevPlace}operatorMap(t,e,s){let r=s[0];return this.prevPlace.map(((t,e)=>r(t,e)))}operatorReduce(t,e,s){let r=s[1];return this.prevPlace.reduce(((t,e,s)=>r(t,e,s)),s[0])}run(){for(let t;t=this.path[this.position];)this.entryTypeMethods.get(t.constructor)(t);return this.curPlace}}return e})()}));