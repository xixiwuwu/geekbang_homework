const css = require("css");
const EOF = Symbol("EOF"); //唯一性Symbol EOF: End Of File
const layout = require("./layout.js");
let currentToken = null;
let currentAttribute = null;
let currentTextNode = null;

//用数组表述stack
//方便操作初始一个ducument节点
let stack = [{ type: "document", children: [] }];

//加入一个新函数 addCSSRules 这里把CSS规则暂存到一个数组
let rules = [];
function addCSSRules(text){
  var ast = css.parse(text);
  rules.push(...ast.stylesheet.rules) //... 扩展运算符，将数组表达式或者string在语法层面展开
}

function match(element, selector){
  if(!selector || !element.attributes)
      return false;  
  
  if(selector.charAt(0) == "#"){//#开头id选择器
    var attr = element.attributes.filter(attr => attr.name === "id")[0];
    if(attr && attr.value === selector.replace("#", ''))
        return true;
  }else if(selector.charAt(0) == "."){ //.开头class选择器
    var attr = element.attributes.filter(attr => attr.name === "class")[0];
    if(attr && attr.value  === selector.replace(".", ''))
        return true;
  }else { //tagname 选择器
    if(element.tagName === selector){
      return true;
    }
  }
}

function specificity(selector){
  //inline id class tagname
  var p = [0, 0, 0, 0];
  var selectorParts = selector.split(" ");
  for(var part of selectorParts){
    if(part.charAt(0) == "#"){
      p[1] += 1;
    }else if(part.charAt(0) == "."){
      p[2] += 1;
    }else {
      p[3] += 1;
    }
  }
  return p;
}

function compare(sp1, sp2){
  if(sp1[0] - sp2[0])
      return sp1[0] - sp2[0];
  if(sp1[1] - sp2[1])
      return sp1[1] - sp2[1];
  if(sp1[2] - sp2[2])
      return sp1[2] - sp2[2];

  return sp1[3] - sp2[3];
}

function computeCSS(element){
  //获取父元素序列 并reverse
  //从当前元素往外匹配
  var elements = stack.slice().reverse();
  if(!element.computedStyle)
     element.computedStyle = {};

  for(let rule of rules){
    //复合选择器
    var selectorParts  = rule.selectors[0].split(" ").reverse();

    //当前选择器和当前元素匹配算法
    if(!match(element, selectorParts[0]))
        continue;

    let matched = false;

    var j = 1; //当前选择器位置
    for(var i = 0; i < elements.length; i++){ //当前元素
      if(match(elements[i], selectorParts[j])){
        j++;
      }
    }

    //匹配成功
    if(j >= selectorParts.length)
        matched = true;
    
    if(matched){
      var sp = specificity(rule.selectors[0]);
      //匹配加入
      var computedStyle = element.computedStyle;
      for(var declaration of rule.declarations){
        if(!computedStyle[declaration.property])
            computedStyle[declaration.property] = {};

        if(!computedStyle[declaration.property].specificity){
          computedStyle[declaration.property].value = declaration.value;
          computedStyle[declaration.property].specificity = sp;
        } else if(compare(computedStyle[declaration.property].specificity, sp) < 0){
            for(var k = 0; k < 4; k++){
              computedStyle[declaration.property][declaration.value][k] += sp[k];
            }
        }
      }
      console.log(element.computedStyle);
    }

  }
}


function emit(token) {
  //取出栈顶
  let top = stack[stack.length - 1];

  //如果startToken入栈element
  //html <叫tag 抽象概念的值是element
  if (token.type == "startTag") {
    let element = {
      type: "element",
      children: [],
      attributes: []
    };

    element.tagName = token.tagName;

    //push type和tagname外属性
    for (let p in token) {
      if (p != "type" && p != "tagName")
        element.attributes.push({
          name: p,
          value: token[p]
        });
    }

    //starttag时计算css
    computeCSS(element);
    //layout(element);

    //对偶操作 建立父子关系
    top.children.push(element);
    element.parent = top;

    if (!token.isSelfClosing) {
      stack.push(element);
    }

    currentTextNode = null;
  } else if (token.type == "endTag") {
    if (top.tagName != token.tagName) {
      throw new Error("Tag start end doesn't match!");
    } else {
      //遇到style标签时 执行添加CSS规则的操作
      //需要环境 npm install css
      if(top.tagName === "style"){
        addCSSRules(top.children[0].content);
      }
      //flex layout发生在标签的结束标签前
      layout(top);
      stack.pop();
    }
    currentTextNode = null;
  }else if(token.type == "text"){ //处理文本节点
    if(currentTextNode == null){
      //开始标签、结束标签清空文本节点内容
      currentTextNode = {
        type: "text",
        content: ""
      }
      top.children.push(currentTextNode);
    }
    currentTextNode.content += token.content;
  }
}


function data(c) {
  if (c == "<") {
    return tagOpen;
  } else if (c == EOF) {
    emit({
      type: "EOF"
    });
    return;
  } else {
    //文本节点emit 一个Text token
    emit({
      type: "text",
      content: c
    });
    return data;
  }
}

function tagOpen(c) {
  if (c == "/") {
    //结束标签开头
    return endTagOpen;
  } else if (c.match(/^[a-zA-Z]$/)) {
    //<div
    //开始标签或自封闭标签
    currentToken = {
      type: "startTag", //isSelfClosing变量标识自封闭
      tagName: ""
    };
    return tagName(c);
  } else {
    emit({
      type: "text",
      content: c
    });
    return;
  }
}

//核心逻辑
function tagName(c) {
  if (c.match(/^[\t\n\f ]$/)) {
    //<html prop
    return beforeAttributeName;
  } else if (c == "/") {
    //自封闭标签
    return selfClosingStartTag;
  } else if (c.match(/^[a-zA-Z$]/)) {
    currentToken.tagName += c;
    return tagName;
  } else if (c == ">") {
    //解析下一个标签
    emit(currentToken);
    return data;
  } else {
    currentToken.tagName += c;
    return tagName;
  }
}

function beforeAttributeName(c) {
  if (c.match(/^[\t\n\f ]$/)) {
    return beforeAttributeName;
  } else if (c == "/" || c == ">" || c == EOF) {
    return afterAttributeName(c);
  } else if (c == "=") {
  } else {
    currentAttribute = {
      name: "",
      value: ""
    };
    return attributeName(c);
  }
}

function attributeName(c) {
  if (c.match(/^[\t\n\f ]$/) || c == "/" || c == ">" || c == EOF) {
    return afterAttributeName(c);
  } else if (c == "=") {
    return beforeAttributeVaule;
  } else if (c == "\u0000") {
  } else if (c == '\"' || c == "'" || c == "<") {
  } else {
    currentAttribute.name += c;
    return attributeName;
  }
}

function beforeAttributeVaule(c) {
  if (c.match(/^[\t\n\f ]$/) || c == "/" || c == ">" || c == EOF) {
    return beforeAttributeVaule;
  } else if (c == '\"') {
    return doubleQuotedAttributeValue;
  } else if (c == "\'") {
    return singleQuotedAttributeValue;
  } else if (c == ">") {
  } else {
    return UnquotedAttributeValue(c);
  }
}

function doubleQuotedAttributeValue(c) {
  if (c == '\"') {
    currentToken[currentAttribute.name] = currentAttribute.value;
    return afterQuotedAttributeValue;
  } else if (c == "\u0000") {
  } else if (c == EOF) {
  } else {
    currentAttribute.value += c;
    return doubleQuotedAttributeValue;
  }
}

function singleQuotedAttributeValue(c) {
  if (c == "\'") {
    currentToken[currentAttribute.name] = currentAttribute.value;
    return afterQuotedAttributeValue;
  } else if (c == "\u0000") {
  } else if (c == EOF) {
  } else {
    currentAttribute.value += c;
    return doubleQuotedAttributeValue;
  }
}

function afterQuotedAttributeValue(c) {
  if (c.match(/^[\t\n\f ]$/)) {
    return beforeAttributeName;
  } else if (c == "/") {
    return selfClosingStartTag;
  } else if (c == ">") {
    currentToken[currentAttribute.name] = currentAttribute.value;
    emit(currentToken);
    return data;
  } else if (c == EOF) {
  } else {
    currentAttribute.value += c;
    return doubleQuotedAttributeValue;
  }
}

function UnquotedAttributeValue(c) {
  if (c.match(/^[\t\n\f ]$/)) {
    currentToken[currentAttribute.name] = currentAttribute.value;
    return beforeAttributeVaule;
  } else if (c == "/") {
    currentAttribute[currentAttribute.name] = currentAttribute.value;
    return selfClosingStartTag;
  } else if (c == ">") {
    currentAttribute[currentAttribute.name] = currentAttribute.value;
    emit(currentToken);
    return data;
  } else if (c == "\u0000") {
  } else if (c == '\"' || c == "'" || c == "<" || c == "=" || c == "`") {
  } else if (c == EOF) {
  } else {
    currentAttribute.value += c;
    return UnquotedAttributeValue;
  }
}

function selfClosingStartTag(c) {
  if (c == ">") {
    currentToken.isSelfClosing = true;
    emit(currentToken);
    return data;
  } else if (c == "EOF") {
  } else {
  }
}

function endTagOpen(c) {
  if (c.match(/^[a-zA-Z]$/)) {
    currentToken = {
      type: "endTag",
      tagName: ""
    };
    return tagName(c);
  } else if (c == ">") {
  } else if (c == EOF) {
  } else {
  }
}

function afterAttributeName(c){
  if(c.match(/^[\t\n\f ]$/)){
    return afterAttributeName;
  }else if(c =="/"){
    return selfClosingStartTag;
  }else if(c = "="){
    return beforeAttributeVaule;
  }else if(c ==">"){
    currentToken[currentAttribute.name] = currentAttribute.value;
    emit(currentToken);
    return data;
  }else if(c == EOF){

  }else {
    currentToken[currentAttribute.name] = currentAttribute.value;
    currentAttribute = {
      name: "",
      value : ""
    };

    return attributeName(c);
  }
}

module.exports.parseHTML = function parseHTML(html) {
  let state = data;
  for (let c of html) {
    state = state(c);
  }
  state = state(EOF);
  return stack[0];
};
