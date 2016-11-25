/**
 * Created by lj on 16-9-12.
 */
var curve=require('./curve');
var util=require('./util');
var Style=require('./style');
var p2l=require('./px2latlon');
var Bezier=require('./bezier');
/*
 type {enum} type of svg grapth,such  as path,linestring,polygon,circle ....
 geo {Array}
 sty {object} the style property of the parent obj
 */
var svg2function={
    rect:rectConvert,
    polygon:polygonConvert,
    line:lineConver,
    polyline:polylineConvert,
    circle:circleConvert,
    ellipse:ellipseConvert,
    path:pathConvert,
    text:textConvert
};

var svg2geoType={
    rect:"Polygon",
    polygon:'Polygon',
    line:'LineString',
    polyline:'LineString',
    circle:'Point',
    ellipse:'Polygon',
    path:'MultiLineString',
    text:'Point'
};

function convert(type,geo,sty,screen,extent) {
    var result=[];
    var layer=[];
    var trsform={};
    for(var i=0;i<geo.length;i++){
        var svg_obj={};
        svg_obj=geo[i]['$'];
        // svg_obj.text=;
        var random_num=Math.floor(Math.random()*10000+1);
        var ids=svg_obj.id||Date.now().toString(16)+random_num.toString(16);
        var idstring=ids.toLowerCase();
        var svg_style=svg_obj.style||{};
        var mstyle=util.merge(sty,svg_style);
        if(svg_obj.transform){
            if(mstyle.transform){mstyle.transform+=';'+svg_obj.transform}
            else{mstyle.transform=svg_obj.transform}
        }
        if(type=='circle'){
            mstyle.radius=svg_obj.r;
        }
        var s={};
        s=Style.getStyle(mstyle,idstring,type);
        layer.push(s);
        if(mstyle.transform){
            trsform=transform(mstyle.transform);
        }
        var marker=type.toLowerCase();
        if(svg2function[marker]){
            svg2function[marker](svg_obj,trsform,screen,extent,function (err,geoObj) {
                if(err) console.log(err);
                geoObj.properties={'id':idstring};
                if(type=='text'){
                    geoObj.properties.text=geo[i]["_"]||(geo[i]['tspan']?geo[i]['tspan'][0]["_"]:'');
                }
                result.push(geoObj);
            });
        }
    }
    return {data:result,style:layer};
}

function textConvert(svg,trsform,screen,extent,cb) {
    var x=svg.x?Number(svg.x):0,
        y=svg.y?Number(svg.y):0;
    var pt=ptTrsCollection([x,y],trsform);
    var point=p2l.px2latlon(pt,screen,extent);
    var geoObj=getGeoObj('text');
    geoObj.geometry.coordinates=point;
    cb(null,geoObj);
}


function ellipseConvert(svg,trsform,screen,extent,cb) {
    var cx=svg.cx?Number(svg.cx):0,
        cy=svg.cy?Number(svg.cy):0,
        rx=Number(svg.rx),
        ry=Number(svg.ry);
    var pt=ptTrsCollection([cx,cy],trsform);

    if(trsform.scale){
        rx*=trsform.scale[0];
        ry*=trsform.scale[1];
    }

    var geoObj=getGeoObj('ellipse');
    geoObj.geometry.coordinates.push(curve.ellipse(pt[0],pt[1],rx,ry,screen,extent));
    cb(null,geoObj);
}

function circleConvert(svg,trsform,screen,extent,cb) {
    var x=svg.cx?Number(svg.cx):0,
        y=svg.cy?Number(svg.cy):0;

    var radis=svg.r;
    var pt=ptTrsCollection([x,y],trsform);
    if(trsform.scale){
        radis*=trsform.scale[0];
    }
    var geoObj=getGeoObj('circle');
    var p=p2l.px2latlon(pt,screen,extent);
    geoObj.geometry.coordinates=geoObj.geometry.coordinates.concat(p);
    cb(null,geoObj);
}

/*
 {Object}    svg:the object of svg element
 {Function}  cb:callback
 return:

 the geojson geometry object
 */
function rectConvert(svg,trsform,screen,extent,cb) {
    if(!svg.width||!svg.height){
        cb({"ERROR":"the attribute of rect-svg is not complete"});
    }
    var x=svg.x?Number(svg.x):0,
        y=svg.y?Number(svg.y):0;

    var width=Number(svg.width),height=Number(svg.height);
    var pt=ptTrsCollection([x,y],trsform);
    x=pt[0],y=pt[1];
    if(trsform.scale){
        width*=trsform.scale[0];
        height*=trsform.scale[1];
    }
    var geoObj=getGeoObj('rect');

    var p1=p2l.px2latlon([x,y],screen,extent),
        p2=p2l.px2latlon([x+width,y],screen,extent),
        p3=p2l.px2latlon([x+width,y+height],screen,extent),
        p4=p2l.px2latlon([x,y+height],screen,extent);
    geoObj.geometry.coordinates.push(new Array(p1,p2,p3,p4,p1));
    cb(null,geoObj);
}

function polygonConvert(svg,trsform,screen,extent,cb) {
    if(!svg.points){cb({"ERROR":"polygon-svg don't have points property"})}
    var geoObj=getGeoObj('polygon');
    // geoObj.id=svg.id||Date.now().toString(16);
    geoObj.geometry.coordinates.push(points2ptArray(svg.points,{isclosed:true,trsform:trsform},screen,extent));
    cb(null,geoObj);
}
function lineConver(svg,trsform,screen,extent,cb) {
    if(!svg.x1||!svg.y1||!svg.x2||!svg.y2){
        cb({"ERROR":"the attribute of line-svg is not complete"});
    }
    var geoObj=getGeoObj('line');
    // geoObj.id=svg.id||Date.now().toString(16);
    var str=svg.x1+','+svg.y1+' '+svg.x2+','+svg.y2;
    geoObj.geometry.coordinates.push(points2ptArray(str,{trsform:trsform}));
    // var pt1=[],pt2=[];
    // pt1[0]=Number(svg.x1);
    // pt1[1]=Number(svg.y1);
    // pt2[0]=Number(svg.x2);
    // pt2[1]=Number(svg.y2);
    // if(trsform.translate){
    //     pt1[0]+=trsform.translate[0];
    //     pt1[1]+=trsform.translate[1];
    //     pt2[0]+=trsform.translate[0];
    //     pt2[1]+=trsform.translate[1];
    // }
    // if(trsform.scale){
    //     pt1[0]*=trsform.scale[0];
    //     pt1[1]*=trsform.scale[1];
    //     pt2[0]*=trsform.scale[0];
    //     pt2[1]*=trsform.scale[1];
    // }
    // geoObj.geometry.coordinates.push(p2l.px2latlon(pt1,screen,extent));
    // geoObj.geometry.coordinates.push(p2l.px2latlon(pt2,screen,extent));
    cb(null,geoObj);
}

function polylineConvert(svg,trsform,screen,extent,cb) {
    if(!svg.points){cb({"ERROR":"polyline-svg don't have points property"});}
    var geoObj=getGeoObj('polyline');
    // geoObj.id=svg.id||Date.now().toString(16);
    geoObj.geometry.coordinates=points2ptArray(svg.points,{isclosed:false,trsform:trsform},screen,extent);
    cb(null,geoObj);
}
function pathConvert(svg,trsform,screen,extent,cb) {
    var paths_coord=[];
    var geoObj=getGeoObj('path');
    var path_str=svg.d;
    path_str=path_str.replace(/\d(?=-)/g,'$&'+' ');
    var paths=path_str.split(/(?=[mM])/);
    var pen=[0,0];//笔触的位置
    var preCommand={"type":"","coor":[]};
    for(var k=0;k<paths.length;k++){
        var pathString=paths[k].trim();
        var points=[];// the container of point coordinate
        var reg=new RegExp(/(?=[LHVCSQTAZlhvcsqtaz])/);
        var pathArray=pathString.split(reg);//the array of command
        for(var i=0;i<pathArray.length;i++){
            var tag=pathArray[i][0];//the path command,include:m,l,h,v,c,s,q,t,a,z
            var str=pathArray[i].slice(1).trim();
            var ptCollection=[];
            switch (tag){
                //absolute
                case 'M':
                case 'L':
                    ptCollection=points2ptArray(str,{isclosed:false,trans:true});
                    break;
                case 'Z':
                case 'z':
                    ptCollection=points[0];
                    break;
                case 'C':
                    var ptArray=points2ptArray(str,{isclosed:false,trans:true});
                    if(ptArray.length%3==0){
                        for(var j=0;j<ptArray.length;j=j+3){
                            var p0=pen,  //起始点
                                p1=ptArray[j],//控制点1
                                p2=ptArray[j+1],//控制点2
                                p3=ptArray[j+2];//终点
                            ptCollection=Bezier.CalculateBezier([p0,p1,p2,p3],10);
                            pen[0]=p3[0];pen[1]=p3[1];
                            preCommand["type"]="C";
                            preCommand["coor"][0]=p2[0];
                            preCommand["coor"][1]=p2[1];
                        }
                    }
                    else{
                        cb("Cubic Curve:the num of parameters is not a integer multiple of 3",null);
                    }
                    break;
                case 'Q':
                    var ptArray=points2ptArray(str,{isclosed:false,trans:true,trsform:trsform});
                    if(ptArray.length%2==0){
                        for(var j=0;j<ptArray.length;j=j+2){
                            var p0=pen,//起始点
                                p1=ptArray[j],//控制点1
                                p3=ptArray[j+1];//终点
                            ptCollection=Bezier.CalculateBezier([p0,p1,p3],10);
                            pen[0]=p3[0];pen[1]=p3[1];
                            preCommand["type"]="Q";
                            preCommand["coor"][0]=p1[0];
                            preCommand["coor"][1]=p1[1];
                        }
                    }
                    else{
                        cb("Square Curve:the num of parameters is not a integer multiple of 2")
                    }
                    break;
                case 'S':
                    var ptArray=points2ptArray(str,{isclosed:false,trans:true});
                    if(ptArray.length%2==0){
                        for(var j=0;j<ptArray.length;j=j+2){
                            if(preCommand.type=="C"||preCommand.type=="S"||preCommand.type=="c"||preCommand.type=="s"){
                                var p0=pen,//起始点
                                    p1=symmetricPoint(preCommand.coor,pen),//控制点1（前一命令控制点的对称点）
                                    p2=ptArray[j],//控制点2
                                    p3=ptArray[j+1];//终点
                                var berPt=[p0,p1,p2,p3];
                                ptCollection=Bezier.CalculateBezier(berPt,10);
                            }
                            else{
                                var p0=pen,
                                    p2=ptArray[j],
                                    p3=ptArray[j+1];
                                ptCollection=Bezier.CalculateBezier([p0,p2,p3],10);
                            }
                            pen[0]=p3[0];pen[1]=p3[1];
                            preCommand["type"]="S";
                            preCommand["coor"][0]=p2[0];
                            preCommand["coor"][1]=p2[1];
                        }
                    }
                    else {
                        cb("smooth Cubic curve:the num of parameters is not a integer multiple of 2");
                    }
                    break;
                case 'T':
                    var ptArray=points2ptArray(str,{isclosed:false,trans:true});
                    for(var j=0;j<ptArray.length;j++){
                        if(preCommand.type=="Q"||preCommand.type=="T"||preCommand.type=="q"||preCommand.type=="t"){
                            var p0=pen,
                                p1=symmetricPoint(preCommand.coor,pen),
                                p2=[];
                            p2[0]=Number(ptArray[j][0]);p2[1]=Number(ptArray[j][1]);
                            ptCollection=Bezier.CalculateBezier([p0,p1,p2],10);
                        }
                        else{
                            ptCollection=ptArray[j];
                        }
                        pen[0]=ptCollection[ptCollection.length-1][0];
                        pen[1]=ptCollection[ptCollection.length-1][1];
                        preCommand["type"]="T";
                        preCommand["coor"][0]=p2[0];
                        preCommand["coor"][1]=p2[1];
                    }
                    break;
                case 'H':
                    ptCollection[0]=Number(str);
                    ptCollection[1]=pen[1];
                    break;
                case 'V':
                    ptCollection[1]=Number(str);
                    ptCollection[0]=pen[0];
                    break;
                //relative

                // Todo:A a
                case 'm':
                case 'l':
                    ptCollection=increacep2arr(str,{trans:true,start:pen});
                    break;
                case 'h':
                    ptCollection=increacep2arr(str,{tag:'h',trans:true,start:pen});
                    break;
                case 'v':
                    ptCollection=increacep2arr(str,{tag:'v',trans:true,start:pen});
                    break;
                case 'c':
                    var temp=Bezier.CubicBezier(str,{start:pen});
                    ptCollection=temp.points;
                    preCommand=temp.cPoint;
                    break;
                case 'q':
                    var temp=Bezier.SquareBezier(str,{start:pen})
                    ptCollection=temp.points;
                    preCommand=temp.cPoint;
                    break;
                case 's':
                    var  ptList=points2ptArray(str,{isclosed:false,trans:true});
                    if(ptList.length%2!==0){
                        cb("smooth Cubic curve:the num of parameters is not a integer multiple of 2");
                    }
                    for(var j=0;j<ptList.length;j=j+2){
                        var p0=[],p1=[],p2=[],p3=[],berPt=[];
                        if(preCommand.type=="C"||preCommand.type=="S"||preCommand.type=="c"||preCommand.type=="s") {
                            p0 = pen;
                            p1 = symmetricPoint(preCommand.coor,pen);
                            p2[0] = ptList[j ][0] + pen[0];p2[1] = ptList[j ][1] + pen[1];
                            p3[0] = ptList[j + 1][0] + pen[0];p3[1] = ptList[j + 1][1] + pen[1];
                            berPt = [p0, p1, p2, p3];
                        }
                        else{
                            p0 = pen;
                            p2[0] = ptList[j ][0] + pen[0];p2[1] = ptList[j][1] + pen[1];
                            p3[0] = ptList[j + 1][0] + pen[0];p3[1] = ptList[j + 1][1] + pen[1];
                            berPt = [p0,p2,p3];
                        }
                        ptCollection = Bezier.CalculateBezier(berPt, 10);
                        pen[0] = points[points.length-1][0];
                        pen[1] = points[points.length-1][1];
                        preCommand["type"]="s";
                        preCommand["coor"][0]=p2[0];
                        preCommand["coor"][1]=p2[1];
                    }
                    break;
                case 't':
                    var ptList=points2ptArray(str,{isclosed:false,trans:true});
                    for(var j=0;j<ptList.length;j++){
                        var p0=[],p1=[],p3=[],berPt;
                        if(preCommand.type=="Q"||preCommand.type=="T"||preCommand.type=="q"||preCommand.type=="T") {
                            p0 = pen;
                            p1 = symmetricPoint(preCommand.coor,pen);
                            p3[0] = ptList[j][0] + pen[0];p3[1] = ptList[j][1] + pen[1];
                            berPt = [p0, p1, p3];
                            ptCollection = Bezier.CalculateBezier(berPt, 10);
                        }
                        else{
                            ptCollection=ptList[j];
                        }
                        pen[0] = p3[0];pen[1] = p3[1];
                        preCommand["type"]="t";
                        preCommand["coor"][0]=pen[0];
                        preCommand["coor"][1]=pen[1];
                    }
                    break;
            }
            if(ptCollection[0] instanceof Array){
                points=points.concat(ptCollection);
            }
            else{
                points.push(ptCollection);
            }
            pen[0]=points[points.length-1][0];
            pen[1]=points[points.length-1][1];
        }
        paths_coord.push(points);
    }
    for(var n=0;n<paths_coord.length;n++){
        for(var m=0;m<paths_coord[n].length;m++){
            var pt=ptTrsCollection(paths_coord[n][m],trsform);
            paths_coord[n][m]=p2l.px2latlon(pt,screen,extent);
        }
    }
    geoObj.geometry.coordinates=paths_coord;
    cb(null,geoObj);
}
function getGeoObj(tag) {
    var geoObj={};
    geoObj.type="Feature";
    geoObj.properties={};
    geoObj.geometry={};
    var type=svg2geoType[tag];
    geoObj.geometry.type=type;
    geoObj.geometry.coordinates=[];
    return geoObj;
}

/*
 ref{Array}  对称原点
 pt{Array}   目标点
 */
function symmetricPoint(pt,ref) {
    var x=2*ref[0]-pt[0];
    var y=2*ref[1]-pt[1];
    return [x,y];
}

function increacep2arr(ptString,option,screen,extent) {
    var pen=option.start?option.start:[0,0];//笔触的位置
    var trsform={};
    var result=[];
    var ptstring=ptString.replace(/\d(?=-)/g,'$&'+' ').trim();

    var ptList=ptstring.split(/\s+|,/);// use , and ' ' as spliter
    var count=0,counts=ptList.length;
    if(option.tag=='h'||option.tag=='v'){
        for(var i=0;i<ptList.length;i++){
            var pt=[];
            if(option.tag=='h'){
                var temp=ptTrsCollection([ptList[i]*1,0],trsform);
                ptList[i]=temp[0];
                pt[0]=Number(ptList[i])+pen[0];pt[1]=pen[1];
            }
            else{
                var temp=ptTrsCollection([0,ptList[i]*1],trsform);
                ptList[i]=temp[1];
                pt[0]=pen[0];pt[1]=Number(ptList[i])+pen[1];
            }

            if(option.trans){
                result.push(pt);
                pen[0]=pt[0];pen[1]=pt[1];
            }
            else{
                var trans_point=p2l.px2latlon(pt,screen,extent);
                result.push(trans_point);
                pen[0]=trans_point[0];pen[1]=trans_point[1];
            }
            count++;
        }
    }

    else{
        if(ptList.length%2!==0){
            console.log('points is single');
            return result;
        }
        for(var i=0;i<ptList.length;i=i+2){
            var pt=[];

            var temp=ptTrsCollection([ptList[i]*1,ptList[i+1]*1],trsform);
            ptList[i]=temp[0],ptList[i+1]=temp[1];
            pt[0]=Number(ptList[i])+pen[0];
            pt[1]=Number(ptList[i+1])+pen[1];

            if(option.trans){result.push(pt);}
            else{result.push(p2l.px2latlon(pt,screen,extent));}
            pen[0]=pt[0];pen[1]=pt[1];
            count+=2;
        }
    }

    if(count>=counts){
        return result;
    }
}

/*
 @ptString  {String} the "points" attribute
 @isclosed  {boolean} wether the feather is closed,for example,the polygon is closed,the polyline is not closed
 @trans     {boolean} wether transform the px to lat/lon

 return
 */
function points2ptArray(ptString,option,screen,extent) {
    var result=[];
    ptString=ptString.replace(/\d(?=-)/g,'$&'+' ');
    var ptList=ptString.split(/\s+|,/)
    var count=0,counts=ptList.length;
    if(ptList.length%2!==0){
        console.log('points is single');
        return result;
    }
    for(var i=0;i<ptList.length;i=i+2){
        var pt=[];
        pt[0]=Number(ptList[i]);
        pt[1]=Number(ptList[i+1]);
        if(option.trsform){
            pt=ptTrsCollection(pt,option.trsform);
        }
        if(option.trans){result.push(pt);}
        else{result.push(p2l.px2latlon(pt,screen,extent));}
        count+=2;
    }
    if(option.isclosed){
        counts++;
        result.push(result[0]);
        count++;
    }
    if(count>=counts){
        return result;
    }
}


function transform(str) {
    var obj={};
    str=str.replace(/\W(?=[a-z])/g,'$&'+';');
    var array=str.split(/;+/);
    array.forEach(function (e) {
        var index=e.indexOf('\(');
        var type=e.slice(0,index);
        var lastindex=e.indexOf('\)');
        var parameters=e.slice(index+1,lastindex).split(/[,\s]+/);
        parameters=parameters.map(function (x) {
            return Number(x);
        });
        if(obj[type]){
            obj[type]=util.arrayAdd(obj[type],parameters);
        }
        else{
            obj[type]=parameters;
        }
    });
    if(obj.translate&&obj.translate.length==1){
        obj.translate[1]=0;
    }
    if(obj.scale&&obj.scale.length==1){
        obj.scale[1]=obj.scale[0];
    }
    return obj;

}

function ptTransform(trsform,p,pt) {
    var a=1,b=0,
        c=0,d=1,
        e=0,f=0;
    //变换矩阵
    var transMatrix=[
        [a,c,e],
        [b,d,f],
        [0,0,1]
    ];
    var result=[];
    switch (p){
        case 'translate':
            e=trsform[p][0];
            f=trsform[p][1];
            break;
        case 'scale':
            a=trsform[p][0];
            d=trsform[p][1];
            break;
        case 'matrix':
            a=trsform[p][0];
            b=trsform[p][1];
            c=trsform[p][2];
            d=trsform[p][3];
            e=trsform[p][4];
            f=trsform[p][5];
            break;
        case 'rotate':
            a=Math.cos(trsform[p][0]);
            b=Math.sin(trsform[p][0]);
            c=-Math.sin(trsform[p][0]);
            d=-Math.cos(trsform[p][0]);
            break;
        case 'skew':
            b=Math.tan(trsform[p][1]);
            c=-Math.tan(trsform[p][0]);
            break;
        default:break;
    }

    result[0]=a*pt[0]+c*pt[1]+e;
    result[1]=b*pt[0]+d*pt[1]+f;
    return result;
}
function ptTrsCollection(pt,trsform) {
    if(!trsform){
        return pt;
    }
    var result=[pt[0],pt[1]];
    for(var p in trsform){
        result=ptTransform(trsform,p,result);
    }
    return result;
}

exports.convert=convert;
