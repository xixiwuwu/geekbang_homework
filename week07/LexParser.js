class XRegExp {
  constructor(source, flag, root = "root") {
    //定义词法表格
    this.table = new Map();
    //遍历循环解析
    this.regexp = new RegExp(this.compileRegExp(source, root, 0).source, flag);
  }

  compileRegExp(source, name, start) {
    //如果值为正则 返回名字和长度
    if (source[name] instanceof RegExp)
      return {
        source: source[name].source,
        length: 0
      };

    let length = 0;

    //使用replace将占位字符替换为正则表达式
    let regexp = source[name].replace(/\<([^>]+)\>/g, (str, $1) => {
      this.table.set(start + length, $1);

      ++length;
      //递归调用继续解析
      let r = this.compileRegExp(source, $1, start + length);

      length += r.length;
      return "(" + r.source + ")";
    });
    
    return {
      source: regexp,
      length: length
    };
  }

  exec(string) {
    let r = this.regexp.exec(string);
    //循环匹配词法表 返回匹配结果
    for (let i = 1; i < r.length; i++) {
      if (r[i] !== void 0) {
        r[this.table.get(i - 1)] = r[i];
      }
    }
    return r;
  }

  //上一次匹配文本之后的第一个字符的位置
  get lastIndex() {
    return this.regexp.lastIndex;
  }

  set lastIndex(value) {
    return this.regexp.lastIndex = value;
  }
}


//iterator =>> function*
export function* scan(str) {
  //定义扩展巴科斯范式ABNF 词法分析js规则和正则Map
  let regexp = new XRegExp(
    {
      InputElement: "<Whitespace>|<LineTerminator>|<Comments>|<Token>",
      Whitespace: / /,
      LineTerminator: /\n/,
      Comments: /\/\*(?:[^*]|\*[^\/])*\*\/|\/\/[^\n]*/,
      Token: "<Literal>|<Keywords>|<Identifier>|<Punctuator>",
      Literal: "<NumericLiteral>|<BooleanLiteral>|<StringLiteral>|<NullLiteral>",
      NumericLiteral: /0x[0-9a-zA-Z]+|0o[0-7]+|0b[01]+|(?:[1-9][0-9]*|0)(?:\.[0-9]*)?|\.[0-9]+/,
      BooleanLiteral: /true|false/,
      StringLiteral: /\"(?:[^"\n]|\\[\s\S])*\"|\'(?:[^'\n]|\\[\s\S])*\'/,
      NullLiteral: /null/,
      Keywords: /continue|break|if|else|for|function|let|var|new|while/,
      Identifier: /[a-zA-Z_$][a-zA-Z0-9_$]*/,
      Punctuator: /\|\||\&\&|\+|\-|\,|\?|\:|\{|\}|\.|\(|\=|\<|\+\+|\=\=|\=\>|\*|\)|\[|\]|;/,
    },
    "g",
    "InputElement"
  );

  while (regexp.lastIndex < str.length) {
    let r = regexp.exec(str);

    if(r.Whitespace){

    }else if(r.LineTerminator){

    }else if(r.Comments){

    }else if(r.NumericLiteral){
        yield{
            type: "NumericLiteral",
            value: r[0]
        }
    }else if(r.BooleanLiteral){
        yield{
            type: "BooleanLiteral",
            value: r[0]
        }
    }else if(r.StringLiteral){
        yield{
            type: "StringLiteral",
            value: r[0]
        }
    }else if(r.NullLiteral){
        yield{
            type: "NullLiteral",
            value: r[0]
        }
    }else if(r.Identifier){
        yield{
            type: "Identifier",
            value: r[0]
        }
    }else if(r.Keywords){
        yield{
            type: r[0]
        }
    }else if(r.Punctuator){
        yield{
            type: r[0]
        }
    }else {
        throw new Error("unexpected token " + r[0]);
    }

    if(!r[0].length){
        break;
    }
  }
  yield{
      type: "EOF"
  }
}