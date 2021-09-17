function getStyle(element){
    //初始化style属性
    if(!element.style)
        element.style = {};
    
    for(let prop in element.computedStyle){
        var p = element.computedStyle.value;
        element.style[prop] = element.computedStyle[prop].value;

        //px属性变数字
        if(element.style[prop].toString().match(/px$/)){
            element.style[prop] = parseInt(element.style[prop]);
        }
        //数字属性转换类型
        if(element.style[prop].toString().match(/^[0-9\.]+$/)){
            element.style[prop] = parseInt(element.style[prop]);
        }
    }
    return element.style;
}

function layout(element){
    //跳过没有computedStyle元素
    if(!element.computedStyle)
        return ;
    //对style进行预处理
    var elementStyle = getStyle(element);
    //只处理flex layout
    if(elementStyle.display !== 'flex')
        return ;
    
    //过滤掉文本节点
    var items = element.children.filter( e => e.type  === 'element');
    //为支持order属性进行排序
    items.sort(function (a, b){
        return (a.order || 0) - (b.order || 0);
    });

    var style = elementStyle;

    //主轴 交叉轴处理
    
    //初始化便于统一判断
    ['width', 'height'].forEach(size =>{
        if(style[size] === 'auto' || style[size] === ''){
            style[size] = null;
        }
    });

    //初始化默认值
    if(!style.flexDirection || style.flexDirection === 'auto')
        style.flexDirection = 'row';
    if(!style.alignItems || style.alignItems === 'auto')
        style.alignItems ='stretch';
    if(!style.justifyContent || style.justifyContent ==='auto')
        style.justifyContent ='flex-start';
    if(!style.flexWrap || style.flexWrap === 'auto')
        style.flexWrap = 'nowrap';
    if(!style.alignContent || style.alignContent === 'auto')
        style.alignContent = 'stretch';

    var mainSize, mainStart, mainEnd, mainSign, mainBase,
    crossSize, crossStart, crossEnd, crossSign, crossBase;

    if(style.flexDirection === 'row'){
        mainSize = 'width'; //主轴尺寸
        mainStart = 'left'; 
        mainEnd = 'right';
        mainSign = +1; //符号
        mainBase = 0;

        crossSize = 'height';
        crossStart = 'top';
        crossEnd = 'bottom';
    }

    if(style.flexDirection === 'row-reverse'){
        mainSize = 'width'; //主轴尺寸
        mainStart = 'right'; 
        mainEnd = 'left';
        mainSign = -1; //符号
        mainBase = style.width;

        crossSize = 'height';
        crossStart = 'top';
        crossEnd = 'bottom';
    }

    if(style.flexDirection === 'column'){
        mainSize = 'height'; //主轴尺寸
        mainStart = 'top'; 
        mainEnd = 'bottom';
        mainSign = +1; //符号
        mainBase = 0;

        crossSize = 'width';
        crossStart = 'left';
        crossEnd = 'right';
    }

    if(style.flexDirection === 'column-reverse'){
        mainSize = 'height'; //主轴尺寸
        mainStart = 'bottom'; 
        mainEnd = 'top';
        mainSign = -1; //符号
        mainBase = style.height;

        crossSize = 'width';
        crossStart = 'left';
        crossEnd = 'right';
    }

    //反向换行
    if(style.flexWrap === 'wrap-reverse'){
        //交叉轴开始 结束互换
        var tmp = crossStart;
        crossStart = crossEnd;
        crossEnd = tmp;
        crossSign = -1;
    }else{
        crossBase = 0;
        crossSign = 1;
    }
    
    //特殊情况 父元素没有设置主轴尺寸
    var isAutoMainSize = false;
    if(!style[mainSize]){
        elementStyle[mainSize] = 0;
        for(var i = 0; i < items.length; i++){
            var item = items[i];
            if(itemStyle[mainSize] !== null || itemStyle[mainSize] !== (void 0)) //标识undefined
                elementStyle[mainSize] = elementStyle[mainSize] + itemStyle[mainSize];
        }
        isAutoMainSize = true;
    }

    //把元素收进行
    var flexLine = [];
    var flexLines = [flexLine];

    var mainSpace = elementStyle[mainSize]; //剩余空间
    var crossSpace = 0;

    for(var i = 0; i < items.length; i++){
        var item =  items[i];
        var itemStyle = getStyle(item);

        //没设置属性 默认为0
        if(itemStyle[mainSize] === null){
            itemStyle[mainSize] = 0;
        }

        if(itemStyle.flex){  //flex属性
            flexLine.push(item);
        }else if(style.flexWrap === 'nowrap' && isAutoMainSize){
            mainSpace -= itemStyle[mainSize];
            if(itemStyle[crossSize] !== null && itemStyle[crossSize] !== (void 0))
                crossSpace = Math.max(crossSpace, itemStyle[crossSize]); //取交叉轴尺寸最大的
            flexLine.push(item);
        }else{
            //比父元素尺寸大 则压缩成主轴尺寸
            if(itemStyle[mainSize] > style[mainSize]){
                itemStyle[mainSize] = style[mainSize];
            }
            //如果超过主轴 则换行
            if(mainSpace < itemStyle[mainSize]){
                flexLine.mainSpace = mainSpace;
                flexLine.crossSpace = crossSpace;
                //创建新行
                flexLine = [item];
                flexLine.push(flexLine);
                mainSpace = style[mainSize];
                crossSpace = 0;
            } else{
                flexLine.push(item);
            }

            //算主轴 交叉轴计算
            if(itemStyle[crossSize] !== null && itemStyle[crossSize] !== (void 0))
                crossSpace = Math.max(crossSpace, itemStyle[crossSize]);
             mainSpace -= itemStyle[mainSize];

        }
    }
    //最后一行flexline加上mainspace
    flexLine.mainSpace = mainSpace;
    
    if(style.flexWrap  === 'nowrap' || isAutoMainSize){
        flexLine.crossSpace =(style[crossSize] !== undefined)? style[crossSize]: crossSpace;
    } else{
        flexLine.crossSpace = crossSpace;
    }

    //进行等比压缩
    if(mainSpace < 0 ){
        //容器主轴尺寸style[mainSize] - 期望尺寸mainSpace 后进行等比压缩
        var scale = style[mainSize]  / (style[mainSize] - mainSpace);
        var currentMain = mainBase;
        //循环每个元素
        for( var i = 0; i < items.length; i++){
            var item = items[i];
            var itemStyle = getStyle(item);
            //flex不参加等比压缩计算
            if(itemStyle.flex){
                itemStyle[mainSize] = 0;
            }

            itemStyle[mainSize] = itemStyle[mainSize] * scale;
            //计算left right
            itemStyle[mainStart] = currentMain;
            itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
            currentMain = itemStyle[mainEnd];
        }
    } else {
        //依次处理flex line
        flexLines.forEach(function (items){

            var mainSpace  = items.mainSpace;
            var flexTotal = 0;
            for(var i = 0; i < items.length; i++){
                var item = items[i];
                var itemStyle = getStyle(item);

                if((itemStyle.flex !== null) && (itemStyle.flex !== (void 0))){
                    flexTotal += itemStyle.flex;
                    continue;
                }
            }

            if(flexTotal > 0){
                //均匀分布给flex元素
                var currentMain = mainBase;
                for(var i = 0; i < items.length; i++){
                    var item = items[i];
                    var itemStyle = getStyle(item);

                    if(itemStyle.flex){
                        itemStyle[mainSize] = (mainSpace / flexTotal) * itemStyle.flex;
                    }
                    itemStyle[mainStart] = currentMain;
                    //等比划分
                    itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
                    currentMain = itemStyle[mainEnd];
                }
            }else{
                //没有flex元素 根据justifyContent 分配
                //从左向右排
                if(style.justifyContent === 'flex-start'){
                    var currentMain = mainBase;
                    var step = 0;
                }
                //从右向左排
                if(style.justifyContent === 'flex-end'){
                    var currentMain = mainSpace * mainSign + mainBase;
                    var step = 0;
                }
                //居中
                if(style.justifyContent === 'center'){
                    var currentMain = mainSpace / 2 * mainSign + mainBase;
                    var step  = 0;
                }
                //所有元素间隔
                if(style.justifyContent === 'space-between'){
                    var step = mainSpace / (items.length - 1) * mainSign;
                    var currentMain = mainBase;
                }
                //前后间隔
                if(style.justifyContent === 'space-around'){
                    var step  = mainSpace / items.length * mainSign;
                    var currentMain = step / 2  + mainBase;
                }

                for(var i = 0; i < items.length; i++){
                    var item = items[i];
                    itemStyle[mainStart] = currentMain;
                    //itemStyle[mainStart, currentMain];
                    itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
                    currentMain = itemStyle[mainEnd] + step;
                }
            }
        })
    }


    //计算交叉轴
    var crossSpace;

    if(!style[crossSize]){
        crossSpace = 0;
        elementStyle[crossSize] = 0;
        //加撑开的高度
        for(var i = 0; i < flexLine.length; i++){
            elementStyle[crossSize] = elementStyle[crossSize] + flexLines[i].crossSpace;
        }
    }else {
        //依次减crossSpace 得到剩余行高
        crossSpace = style[crossSize];
        for(var i = 0; i < flexLines.length; i++){
            crossSpace -= flexLines[i].crossSpace;
        }
    }

    //分配行高
    //计算从尾巴到头排布
    if(style.flexWrap  === 'wrap-reverse'){
        crossBase = style[crossSize];
    }else{
        crossBase = 0;
    }
    //总体交叉轴尺寸除以行数
    var lineSize  = style[crossSize] / flexLines.length;

    //校正crossBase 计算增量
    var step;
    if(style.alignContent  === 'flex-start'){
        crossBase += 0;
        step = 0;
    }

    if(style.alignContent === 'flex-end'){
        crossBase += crossSign * crossSpace;
        step = 0;
    }

    if(style.alignContent === 'center'){
        crossBase += crossSign * crossSpace / 2;
        step = 0;
    }

    if(style.alignContent === 'space-between'){
        crossBase += 0;
        step  = crossSpace / (flexLines.length -1);
    }

    if(style.alignContent === 'space-around'){
        
        step = crossSpace / (flexLines.length);
        crossBase += crossSign * step / 2;
    }

    if(style.alignContent === 'streth'){
        crossBase += 0;
        step  = 0;
    }

    flexLines.forEach(function (items){
        //行 交叉轴尺寸
        var lineCrossSize  = style.alignContent === 'stretch' ?
        items.crossSpace + crossSpace / flexLines.length :
        items.crossSpace;
        //循环访问每个元素
        for(var i = 0; i < items.length; i++){
            var item  = items[i];
            var itemStyle = getStyle(item);
            //每个元素alignSelf优先 后用父元素alignItems指定统一值
            var align  = itemStyle.alignSelf || style.alignItems;
            //未指定交叉轴尺寸 满属性或零
            if(itemStyle[crossSize] ===  null)
                itemStyle[crossSize] = (align === 'stretch') ?
                lineCrossSize : 0;
            
            if(align === 'flex-start'){
                itemStyle[crossStart]  = crossBase;
                itemStyle[crossEnd]  = itemStyle[crossStart] + crossSign * itemStyle[crossSize];
            }
            //crossBase+剩余空间
            if(align === 'flex-end'){
                itemStyle[crossEnd]  = crossBase + crossSign * lineCrossSize;
                itemStyle[crossStart]  = itemStyle[crossEnd] - crossSign * itemStyle[crossSize];
            }

            if(align === 'center'){
                itemStyle[crossStart] = crossBase + crossSign * (lineCrossSize - itemitemStyle[crossSize]) / 2;
                itemStyle[crossEnd] = itemStyle[crossStart] + crossSign * itemStyle[crossSize];
            }

            if(align  === 'stretch'){
                itemStyle[crossStart] = crossBase;
                itemStyle[crossEnd]  = crossBase + crossSign * ((itemStyle[crossSize] !== null && itemStyle[crossSize] !== null && itemStyle[crossSize] !== (void 0))? itemStyle[crossSize] : lineCrossSize);

                itemStyle[crossSize] = crossSign * (itemStyle[crossEnd] - itemStyle[crossStart]);
            }
        }
        //每行+crossBase
        crossBase += crossSign * (lineCrossSize + step);
    });

    console.log(items);
}


module.exports = layout;