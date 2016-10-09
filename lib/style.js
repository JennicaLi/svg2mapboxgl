/**
 * Created by lj on 16-9-21.
 */
var util=require('./util');

function getStyle(styleobj,id,type) {
    var s={};
    s["id"]=id;
    s.filter=["==","id",id];

        switch (type.toLowerCase()){
            case 'line':
            case 'polyline':
            case 'path':
                s.type="line";
                var mstyle=lineStyle(styleobj);
                s= util.merge(s,mstyle);
                break
            case 'rect':
            case 'ellipse':
            case 'polygon':
                s.type='fill';
                var mstyle=fillStyle(styleobj);
                s=util.merge(s,mstyle);
                break;
            case 'circle':
                s.type='circle';
                var mstyle=circleStyle(styleobj);
                s=util.merge(s,mstyle);
                break;
            case 'text':
                s.type='symbol';
                s.layout={};
                s.layout["text-field"]="{text}"
            default:
                break;
        }
        return s;
}

function lineStyle(obj) {
    var line_obj={paint:{},layout:{}};
    for(var p in obj){
        switch (p){
            case "stroke":
                line_obj['paint']['line-color']=obj[p];
                break;
            case 'stroke-width':
                line_obj['paint']['line-width']=Number(obj[p]);
                break;
            case 'stroke-opacity':
                line_obj['paint']['line-opacity']=Number(obj[p]);
                break;
            case 'stroke-dasharray':
                line_obj['paint']['line-dasharray']=obj[p].split(',');
                break;
            case 'stroke-linecap':
                line_obj['layout']['line-cap']=obj[p];
                break;
            case 'stroke-linejoin':
                line_obj['layout']['line-join']=obj[p];
                break;
            default:
                break;
        }
    }
    for(var prooerty in line_obj){
        if(util.isEmptyObject(line_obj[prooerty])){
            delete line_obj[prooerty];
        }
    }
    return line_obj;
}

function symbolStyle() {
    
}

function fillStyle(obj) {
    var fill_obj={paint:{}};
    for(var p in obj){
        if(p=='fill'){
            fill_obj['paint']['fill-color']=obj[p];
        }
        else if(p=='fill-opacity'){
            fill_obj['paint']['fill-opacity']=Number(obj[p]);
        }
    }
    return fill_obj;
}

function circleStyle(obj) {
    var fill_obj={paint:{}};
    for(var p in obj){
        if(p=='fill'){
            fill_obj['paint']['circle-color']=obj[p];
        }
        else if(p=='fill-opacity'){
            fill_obj['paint']['circle-opacity']=Number(obj[p]);
        }
        else if(p=='radius'){
            fill_obj['paint']['circle-radius']=Number(obj[p]);
        }
    }
    return fill_obj;
}

exports.getStyle=getStyle;
