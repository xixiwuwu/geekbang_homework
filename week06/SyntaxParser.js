import {scan} from "./LexParser.js"
//安装webserver否则无法跨域
//npm install -g local-web-server
//启动
//ws

//递归关系语法树
let syntax = {
  Program: [
    ["StatementList", "EOF"]
  ],
  StatementList: [
    ["Statement"], 
    ["StatementList", "Statement"]
  ],
  Statement: [
    ["ExpressionStatement"],
    ["IfStatement"],
    ["WhileStatement"],
    ["VariableDeclaration"],
    ["FuncationDeclaration"],
    ["Block"],
    ["BreakStatement"],
    ["ContinueStatement"],
    ["FuncationDeclaration"]
  ],
  BreakStatement:[
    ["break", ";"]
  ],
  ContinueStatement:[
    ["continue", ";"]
  ],
  Block:[
    ["{", "StatementList","}"],
    ["{", "}"]
  ],
  WhileStatement:[
    ["while", "(", "Expression", ")", "Statement"]
  ],
  IfStatement: [
    ["if", "(", "Expression", ")", "Statement"]
  ],
  VariableDeclaration: [
    ["var", "Identifier", ";"],
    ["let", "Identifier", ";"]
  ],
  FuncationDeclaration: [
    ["function", "Identifier", "(", ")", "{", "StatementList", "}"]
  ],
  ExpressionStatement: [
    ["Expression", ";"]
  ],
  Expression: [
    ["AssignmentExpression"]
  ],
  AssignmentExpression:[
    ["Identifier", "=", "AdditiveExpression"],
    ["AdditiveExpression"],
    ["LogicalORExpression"]
  ],
  LogicalORExpression: [
     ["LogicalANDExpression"],
     ["LogicalORExpression", "||", "LogicalANDExpression"]
  ],
  LogicalANDExpression:[
     ["AdditiveExpression"],
     ["LogicalANDExpression", "&&", "AdditiveExpression"]
  ],
  AdditiveExpression: [
    ["MultiplicativeExpression"],
    ["AdditiveExpression", "+", "MultiplicativeExpression"],
    ["AdditiveExpression", "-", "MultiplicativeExpression"]
  ],
  MultiplicativeExpression: [
    ["LeftHandSideExpression"],
    ["MultiplicativeExpression", "*", "LeftHandSideExpression"],
    ["MultiplicativeExpression", "/", "LeftHandSideExpression"],
  ],
  LeftHandSideExpression: [
    ["CallExpression"],
    ["NewExpression"]
  ],
  CallExpression:[
    ["MemberExpression", "Arguments"],
    ["CallExpression", "Arguments"]
  ],
  Arguments: [
    ["(", ")"],
    ["(", "ArgumentList", ")"]
  ],
  ArgumentList: [
    ["AssignmentExpression"],
    ["ArgumentList", ",", "AssignmentExpression"]
  ],
  NewExpression: [
    ["MemberExpression"],
    ["new", "NewExpression"]
  ],
  MemberExpression: [
    ["PrimaryExpression"],
    ["PrimaryExpression", ".", "Identifier"],
    ["PrimaryExpression", "[", "Expression", "]"]
  ],
  PrimaryExpression: [
    ["(", "Expression",")"],
    ["Literal"],
    ["Identifier"]
  ],
  Literal: [
    ["NumericLiteral"],
    ["StringLiteral"],
    ["BooleanLiteral"],
    ["NullLiteral"],
    ["RegularExpressionLiteral"],
    ["ObjectLiteral"],
    ["ArrayLiteral"]
  ],
  ObjectLiteral:[
    ["{", "}"],
    ["{", "PropertyList","}"]
  ],
  PropertyList:[
    ["Property"],
    ["PropertyList", ",", "Property"]
  ],
  Property:[
    ["StringLiteral", ":", "AdditiveExpression"],
    ["Identifier", ":", "AdditiveExpression"]
  ]
};

//已存在结构哈希表
let hash = {

}

function closure(state) {
  hash[JSON.stringify(state)] = state;
  let queue = [];
  for (let symbol in state) {
    //过滤dollar开头属性
    if(symbol.match(/^\$/)){
      continue;
    }
    queue.push(symbol);
  }

  while (queue.length) {
    let symbol = queue.shift();
    
    //console.log(symbol);
    //过滤递归
    if (syntax[symbol]) {
      //广义优先搜索
      for (let rule of syntax[symbol]) {
        if (!state[rule[0]]){
            queue.push(rule[0]);
        }
        let current = state;
        //第二层序列关系
        for(let part of rule){
          //剔除重复
          if(!current[part]){
            current[part] = {};
          }
          //新规则结构
          current = current[part];
        }
        //reduce类型
        current.$reduceType = symbol;
        current.$reduceLength = rule.length;
      }
    }
  }

  //closure展开后的symbol
  for(let symbol in state){
    if(symbol.match(/^\$/)){
      continue;
    }
    if(hash[JSON.stringify(state[symbol])]){
      state[symbol] = hash[JSON.stringify(state[symbol])];
    }else{
      closure(state[symbol]);
    }
  }
}

//状态
let end = {
  $isEnd: true,
};

let start = {
  "Program": end,
};

closure(start);

let source = `
    10
`

export function parse(source){
  let stack = [start];
  let symbolStack = [];

  function reduce(){
    //取栈顶作为当前状态
    let state = stack[stack.length - 1];
    
    if(state.$reduceType){
      let children = [];
      for(let i = 0; i < state.$reduceLength; i++){
        stack.pop();
        children.push(symbolStack.pop());
      }
      //create non-terminal symbol and shitf it
      return{
        type: state.$reduceType,
        children: children.reverse()
      };
    }else{
      throw new Error("unexpected token");
    }
  }

  function shift(symbol){
    //取栈顶作为当前状态
    let state = stack[stack.length - 1];
    
    if(symbol.type in state){
      stack.push(state[symbol.type]);
      symbolStack.push(symbol);
    }else{
      //reduce to non-terminal symbols
      shift(reduce());
      shift(symbol);
    }
  }
  //terminal symbols
  for(let symbol of scan(source)){
    shift(symbol);
    //console.log(symbol);
  }
  return reduce();
}


