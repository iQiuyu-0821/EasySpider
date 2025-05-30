import $ from "jquery";
import Vue from "vue";
import {global, getOS, readXPath, addEl, clearEl, clearReady, handleElement, clearParameters, generateParameters, generateMultiParameters, handleDescendents, generateValTable, findRelated, pushToReadyList, readyToList, combineXpath, relatedTest} from "./global.js";
import ToolKit from "./toolkit.vue";


//表现逻辑层的处理

if (window.location.href.indexOf("backEndAddressServiceWrapper") >= 0) {
    throw "serviceGrid"; //如果是服务器网页页面，则不执行工具
}


//创造div作为选中元素后的样式存在
global.div = document.createElement('div');
global.div.style.zIndex = "-2147483647";
global.div.setAttribute("id", "wrapperDiv");
global.div.style.position = "fixed";
global.div.style.boxSizing = "border-box";
global.div.style.border = "dotted";

global.tdiv = document.createElement('div');
global.tdiv.style.zIndex = "2147483647";
global.tdiv.style.position = "fixed";
global.tdiv.setAttribute("id", "wrapperTdiv");
// @ts-ignore
global.tdiv.classList = "tdiv";
global.tdiv.style.top = "0px";
global.tdiv.style.width = "3000px";
global.tdiv.style.height = "3000px";
global.tdiv.style.pointerEvents = "none";

var mousemovebind = false; //如果出现元素默认绑定了mousemove事件导致匹配不到元素的时候，开启第二种模式获得元素

var toolkit = document.createElement("div")
// @ts-ignore
toolkit.classList = "tooltips"; //添加样式
toolkit.setAttribute("id", "wrapperToolkit");

var tooltips = false; //标记鼠标是否在提示框上

//右键菜单屏蔽
document.oncontextmenu = () => false;
document.addEventListener("mousemove", function() {
    if (mousemovebind) {
        global.tdiv.style.pointerEvents = "none";
    }

    //如果鼠标在元素框内则点击和选中失效
    var x = event.clientX;
    var y = event.clientY;
    var divx1 = toolkit.offsetLeft;
    var divy1 = toolkit.offsetTop;
    var divx2 = toolkit.offsetLeft + toolkit.offsetWidth;
    var divy2 = toolkit.offsetTop + toolkit.offsetHeight;
    if (x >= divx1 && x <= divx2 && y >= divy1 && y <= divy2) {
        tooltips = true;
        return;
    }
    global.oe = document.elementFromPoint(event.x, event.y);
    if (global.oe == global.tdiv) {
        return;
    }
    tooltips = false;
    global.NowNode = global.oe;
    let te = 0;
    let exist = 0;
    let exist2 = 0;
    for (let o of global.nodeList) {
        if (o["node"] == global.oe) {
            exist = 1;
            break;
        }
    }
    for (let o of global.nodeList) {
        if (o["node"] == global.xnode) {
            exist2 = 1;
            break;
        }
    }
    // console.log(oe);
    if (global.xnode == null) {
        global.xnode = global.oe;
    }
    if (global.xnode != global.oe) {
        if (exist2 == 0) { //如果上个元素不在数组里，改回上个元素的初始颜色
            try {
                global.xnode.style.backgroundColor = global.style; //上个元素改回原来元素的背景颜色
            } catch {
                global.xnode.style.backgroundColor = ""; //上个元素改回原来元素的背景颜色
            }
        }

        try {
            global.xnode = global.oe.style.backgroundColor;
        } catch {
            global.xnode = "";
        }

        if (exist == 1) {

        } else {
            try {
                global.oe.style.backgroundColor = global.defaultbgColor; //设置新元素的背景元素
            } catch {}

        }
        global.xnode = global.oe;
        global.div.style.display = "none";
    }
    if (mousemovebind) {
        global.tdiv.style.pointerEvents = "";
    }

});

window.addEventListener("beforeunload", function(event) {
    event.preventDefault();
    let message = {
        type: 10,
        message: {
            id: global.id, //socket id
        }
    };
    global.ws.send(JSON.stringify(message));
});

//点击没反应时候的替代方案
document.onkeydown = function(event) {
    // console.log("keydown");
    var e = event || window.event || arguments.callee.caller.arguments[0];
    if (e && e.keyCode == 118) { // 按 F7
        addEl();
    } else if (e && e.keyCode == 119) { //按F8
        clearEl();
    } else if (e && e.keyCode == 120) { //按F9
        global.NowNode.focus();
        global.NowNode.click();
        // console.log("click",global.NowNode);
    } else {
        return event.keyCode;
    }
};


document.addEventListener("mousedown", addEl);
toolkit.addEventListener("mousedown", function(e) { e.stopPropagation(); }); //重新定义toolkit里的点击事件


document.body.append(global.div); //默认如果toolkit不存在则div和tdiv也不存在
document.body.append(global.tdiv);
document.body.append(toolkit);
var timer;


//生成Toolkit
function generateToolkit() {
    $(".tooltips").html(`
    <div id="realcontent"></div>
`);
    global.app = new Vue(ToolKit);
    let h = $(".tooldrag").height();
    let difference = 26 - h; //获得高度值差
    if (difference > 0) {
        $(".tooldrag").css("cssText", "height:" + (26 + difference) + "px!important")
    }
    //实现提示框拖拽功能
    $('.tooldrag').mousedown(function(e) {
        // e.pageX
        var positionDiv = $(this).offset();
        var distanceX = e.pageX - positionDiv.left;
        var distanceY = e.pageY - positionDiv.top;
        //alert(distanceX)
        // alert(positionDiv.left);

        $(document).mousemove(function(e) {
            var x = e.clientX - distanceX;
            var y = e.clientY - distanceY;

            if (x < 0) {
                x = 0;
            } else if (x > window.innerWidth - $('.tooldrag').outerWidth(true)) {
                x = window.innerWidth - $('.tooldrag').outerWidth(true);
            }

            if (y < 0) {
                y = 0;
            } else if (y > window.innerHeight - $('.tooldrag').outerHeight(true)) {
                y = window.innerHeight - $('.tooldrag').outerHeight(true);
            }

            $('.tooltips').css({
                'right': window.innerWidth - x - $('.tooltips').outerWidth(true) + 'px',
                'bottom': window.innerHeight - y - $('.tooltips').outerHeight(true) + 'px',
            });
        });

        $(document).mouseup(function() {
            $(document).off('mousemove');
        });
    });
    timer = setInterval(function() { //时刻监测相应元素是否存在(防止出现如百度一样元素消失重写body的情况)，如果不存在，添加进来
        if (document.body != null && document.getElementById("wrapperToolkit") == null) {
            this.clearInterval(); //先取消原来的计时器，再设置新的计时器
            document.body.append(global.div); //默认如果toolkit不存在则div和tdiv也不存在
            document.body.append(global.tdiv);
            document.body.append(toolkit);
            generateToolkit();
        }
    }, 3000);
}
//Vue元素
generateToolkit();

