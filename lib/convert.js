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
    path:pathConvert
};

var svg2geoType={
    rect:"Polygon",
    polygon:'Polygon',
    line:'LineString',
    polyline:'LineString',
    circle:'Point',
    ellipse:'Polygon',
    path:'MultiLineString'
};

function convert(type,geo,sty,screen,extent) {
    var result=[];
    var layer=[];
    for(var i=0;i<geo.length;i++){
        var svg_obj={};
        svg_obj=geo[i]['$'];
        var random_num=Math.floor(Math.random()*8+1);
        var ids=svg_obj.id||Date.now().toString(16)+random_num;
        var idstring=ids.toLowerCase();
        var svg_style=svg_obj.style||{};
        var mstyle=util.merge(sty,svg_style);
        if(type=='circle'){
            mstyle.radius=svg_obj.r;
        }
        var s={};
        s=Style.getStyle(mstyle,idstring,type);
        layer.push(s);
        var marker=type.toLowerCase();
        if(svg2function[marker]){
            svg2function[marker](svg_obj,screen,extent,function (err,geoObj) {
                if(err) console.log(err);
                geoObj.properties={'id':idstring};
                result.push(geoObj);
            });
        }
    }
    return {data:result,style:layer};
}


function ellipseConvert(svg,screen,extent,cb) {
    var cx=svg.cx?Number(svg.cx):0,
        cy=svg.cy?Number(svg.cy):0,
        rx=Number(svg.rx),
        ry=Number(svg.ry);
    var geoObj=getGeoObj('ellipse');
    geoObj.geometry.coordinates.push(curve.ellipse(cx,cy,rx,ry,screen,extent));
    cb(null,geoObj);
}

function circleConvert(svg,screen,extent,cb) {
    var x=svg.cx?Number(svg.cx):0,
        y=svg.cy?Number(svg.cy):0;

    var radis=svg.r;
    var geoObj=getGeoObj('circle');
    var pt=[];
    pt[0]=x,pt[1]=y;
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
function rectConvert(svg,screen,extent,cb) {
    if(!svg.x||!svg.y||!svg.width||!svg.height){
        cb({"ERROR":"the attribute of rect-svg is not complete"});
    }
    var x=Number(svg.x),y=Number(svg.y);
    var width=Number(svg.width),height=Number(svg.height);
    var geoObj=getGeoObj('rect');

    var p1=p2l.px2latlon([x,y],screen,extent),
        p2=p2l.px2latlon([x+width,y],screen,extent),
        p3=p2l.px2latlon([x+width,y+height],screen,extent),
        p4=p2l.px2latlon([x,y+height],screen,extent);
    geoObj.geometry.coordinates.push(new Array(p1,p2,p3,p4,p1));
    cb(null,geoObj);
}

function polygonConvert(svg,screen,extent,cb) {
    if(!svg.points){cb({"ERROR":"polygon-svg don't have points property"})}
    var geoObj=getGeoObj('polygon');
   // geoObj.id=svg.id||Date.now().toString(16);
    geoObj.geometry.coordinates.push(points2ptArray(svg.points,{isclosed:true}));
    cb(null,geoObj);
}
function lineConver(svg,screen,extent,cb) {
    if(!svg.x1||!svg.y1||!svg.x2||!svg.y2){
        cb({"ERROR":"the attribute of line-svg is not complete"});
    }
    var geoObj=getGeoObj('line');
    // geoObj.id=svg.id||Date.now().toString(16);
    var pt1=[],pt2=[];
    pt1[0]=Number(svg.x1);
    pt1[1]=Number(svg.y1);
    geoObj.geometry.coordinates.push(p2l.px2latlon(pt1,screen,extent));
    pt2[0]=Number(svg.x2);
    pt2[1]=Number(svg.y2);
    geoObj.geometry.coordinates.push(p2l.px2latlon(pt2,screen,extent));
    cb(null,geoObj);
}

function polylineConvert(svg,screen,extent,cb) {
    if(!svg.points){cb({"ERROR":"polyline-svg don't have points property"});}
    var geoObj=getGeoObj('polyline');
    // geoObj.id=svg.id||Date.now().toString(16);
    geoObj.geometry.coordinates=points2ptArray(svg.points,{isclosed:false},screen,extent);
    cb(null,geoObj);
}
function pathConvert(svg,screen,extent,cb) {
    var paths_coord=[];
    var geoObj=getGeoObj('path');
    var path_str=svg.d;
    path_str=path_str.replace(/\d(?=-)/g,'$&'+' ');
    var paths=path_str.split(/(?=[mM])/);
    //笔触的位置
    var pen=[0,0];
    var preCommand={"type":"","coor":[]};
    for(var k=0;k<paths.length;k++){
        var pathString=paths[k].trim();
        var points=[];// the container of point coordinate
        var reg=new RegExp(/(?=[LHVCSQTAZlhvcsqtaz])/);
        var pathArray=pathString.split(reg);//the array of command
        for(var i=0;i<pathArray.length;i++){
            var tag=pathArray[i][0];//the path command,include:m,l,h,v,c,s,q,t,a,z
            var str=pathArray[i].slice(1).trim();

            switch (tag){
                //absolute
                case 'M':
                case 'L':
                    var temp=points2ptArray(str,{isclosed:false,trans:true});
                    points= points.concat(temp);
                    break;
                case 'Z':
                case 'z':
                    var ends=points[0];
                    points.push(ends);
                    break;
                case 'C':
                    var ptArray=points2ptArray(str,{isclosed:false,trans:true});
                    if(ptArray.length%3==0){
                        for(var j=0;j<ptArray.length;j=j+3){
                            var p0=pen,
                                p1=ptArray[j],
                                p2=ptArray[j+1],
                                p3=ptArray[j+2];
                            var berPt=[p0,p1,p2,p3];
                            var cpts=Bezier.CalculateBezier(berPt,10);
                            points=points.concat(cpts);
                            pen[0]=points[points.length-1][0];
                            pen[1]=points[points.length-1][1];
                            preCommand["type"]="C";
                            preCommand["coor"][0]=p2[0];
                            preCommand["coor"][1]=p2[1];
                        }
                    }
                    else{
                        console.error("Cubic Curve:the num of parameters is not a integer multiple of 3")
                    }
                    break;
                case 'Q':
                    var ptArray=points2ptArray(str,{isclosed:false,trans:true});
                    if(ptArray.length%2==0){
                        for(var j=0;j<ptArray.length;j=j+2){
                            var p0=pen,
                                p1=ptArray[j],
                                p3=ptArray[j+1];
                            var berPt=[p0,p1,p3];
                            var cpts=Bezier.CalculateBezier(berPt,10);
                            points=points.concat(cpts);
                            pen[0]=points[points.length-1][0];
                            pen[1]=points[points.length-1][1];
                            preCommand["type"]="Q";
                            preCommand["coor"][0]=p1[0];
                            preCommand["coor"][1]=p1[1];
                        }
                    }
                    else{
                        console.error("Square Curve:the num of parameters is not a integer multiple of 2")
                    }
                    break;
                case 'S':
                    var ptArray=points2ptArray(str,{isclosed:false,trans:true});
                    if(ptArray.length%2==0){
                        for(var j=0;j<ptArray.length;j=j+2){

                            if(preCommand.type=="C"||preCommand.type=="S"||preCommand.type=="c"||preCommand.type=="s"){
                            var p0=pen,
                                p1=symmetricPoint(preCommand.coor,pen),
                                p2=ptArray[j],
                                p3=ptArray[j+1];
                                var berPt=[p0,p1,p2,p3];
                                var cpts=Bezier.CalculateBezier(berPt,10);
                                points=points.concat(cpts);
                            }
                            else{
                                var p0=pen,
                                    p2=ptArray[j],
                                    p3=ptArray[j+1];
                                var berPt=[p0,p2,p3];
                                var cpts=Bezier.CalculateBezier(berPt,10);
                                points=points.concat(cpts);
                            }

                            pen[0]=points[points.length-1][0];
                            pen[1]=points[points.length-1][1];
                            preCommand["type"]="S";
                            preCommand["coor"][0]=p2[0];
                            preCommand["coor"][1]=p2[1];
                        }

                    }
                    else {
                        console.error("smooth Cubic curve:the num of parameters is not a integer multiple of 2");
                    }

                    break;
                case 'T':
                    var ptArray=points2ptArray(str,{isclosed:false,trans:true});

                    for(var j=0;j<ptArray.length;j++){
                        if(preCommand.type=="Q"||preCommand.type=="T"||preCommand.type=="q"||preCommand.type=="t"){
                            var p0=pen,
                                p1=symmetricPoint(preCommand.coor,pen),
                                p2=[];
                            p2[0]=Number(ptArray[j][0]);
                            p2[1]=Number(ptArray[j][1]);

                            var berPt=[p0,p1,p2];
                            var cpts=Bezier.CalculateBezier(berPt,10);
                            points=points.concat(cpts);}
                        else{
                            points.push(ptArray[j]);
                        }
                        pen[0]=points[points.length-1][0];
                        pen[1]=points[points.length-1][1];
                        preCommand["type"]="T";
                        preCommand["coor"][0]=pen[0];
                        preCommand["coor"][1]=pen[1];
                    }
                    break;
                case 'H':
                    var pt=[];
                    pt[0]=Number(str);
                    pt[1]=pen[1];
                    points.push(pt);
                    break;
                case 'V':
                    var pt=[];
                    pt[0]=pen[0];
                    pt[1]=Number(str);
                    points.push(pt);
                    break;

                //relative

                // Todo:A a
                case 'm':
                case 'l':
                    var temp=increacep2arr(str,{trans:true,start:pen});
                    points=points.concat(temp);
                    break;
                case 'h':
                    var temp=increacep2arr(str,{tag:'h',trans:true,start:pen});
                    points=points.concat(temp);
                    break;
                case 'v':
                    var temp=increacep2arr(str,{tag:'v',trans:true,start:pen});
                    points=points.concat(temp);
                    break;
                case 'c':
                    var temp=CubicBezier(str,{start:pen});
                    var ptArray=temp.points;
                    points=points.concat(ptArray);
                    preCommand=temp.cPoint;
                    break;
                case 'q':
                    var temp=SquareBezier(str,{start:pen})
                    var ptArray=temp.points;
                    points=points.concat(ptArray);
                    preCommand=temp.cPoint;
                    break;
                case 's':
                    var ptList=points2ptArray(str,{isclosed:false,trans:true});
                    if(ptList.length%2!==0){
                        console.error("s");
                    }
                    for(var j=0;j<ptList.length;j=j+2){
                        var p0=[],p1=[],p2=[],p3=[],berPt;
                        if(preCommand.type=="C"||preCommand.type=="S"||preCommand.type=="c"||preCommand.type=="s") {
                            p0 = pen;
                            p1 = symmetricPoint(preCommand.coor,pen);
                            p2[0] = ptList[j ][0] + pen[0];
                            p2[1] = ptList[j ][1] + pen[1];
                            p3[0] = ptList[j + 1][0] + pen[0];
                            p3[1] = ptList[j + 1][1] + pen[1];
                            berPt = [p0, p1, p2, p3];
                        }
                        else{
                            p0 = pen;
                            p2[0] = ptList[j ][0] + pen[0];
                            p2[1] = ptList[j][1] + pen[1];
                            p3[0] = ptList[j + 1][0] + pen[0];
                            p3[1] = ptList[j + 1][1] + pen[1];
                            berPt = [p0,p2,p3];
                        }
                        var cpts = Bezier.CalculateBezier(berPt, 10);
                        points = points.concat(cpts);
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
                            p3[0] = ptList[j ][0] + pen[0];
                            p3[1] = ptList[j ][1] + pen[1];
                            berPt = [p0, p1, p3];
                            var cpts = Bezier.CalculateBezier(berPt, 10);
                            points = points.concat(cpts);
                        }
                        else{
                            points.push(ptList[j])
                        }

                        pen[0] = points[points.length-1][0];
                        pen[1] = points[points.length-1][1];
                        preCommand["type"]="t";
                        preCommand["coor"][0]=pen[0];
                        preCommand["coor"][1]=pen[1];
                    }
                    break;

            }
            pen[0]=points[points.length-1][0];
            pen[1]=points[points.length-1][1];
        }
        paths_coord.push(points);
    }
    for(var n=0;n<paths_coord.length;n++){
        for(var m=0;m<paths_coord[n].length;m++){
            paths_coord[n][m]=p2l.px2latlon(paths_coord[n][m],screen,extent);
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
function CubicBezier(ptString,option) {
    var cPoint={"type":"","coor":[]};
    var pen=option.start?option.start:[0,0];
    var result=[];
    var ptList=points2ptArray(ptString,{isclosed:false,trans:true});
    var count=0,counts=ptList.length;
    if(ptList.length%3!==0){
        return [];
    }
    for(var i=0;i<ptList.length;i=i+3){
        var p0=[],p1=[],p2=[],p3=[];
         p0=pen,
             p1[0]=ptList[i][0]+pen[0],
             p1[1]=ptList[i][1]+pen[1],
            p2[0]=ptList[i+1][0]+pen[0],
             p2[1]=ptList[i+1][1]+pen[1],
             p3[0]=ptList[i+2][0]+pen[0],
             p3[1]=ptList[i+2][1]+pen[1];
        var berPt=[p0,p1,p2,p3];
        var cpts=Bezier.CalculateBezier(berPt,10);
        result=result.concat(cpts);
        pen[0]=result[result.length-1][0];
        pen[1]=result[result.length-1][1];
        cPoint.type="c";
        cPoint.coor=p2;
        count+=3;

    }
    if(count>=counts){
        return {points:result,cPoint:cPoint};
    }
}
function SquareBezier(ptString,option) {
    var cPoint={"type":"","coor":[]};
    var pen=option.start?option.start:[0,0];
    var result=[];
    var ptList=points2ptArray(ptString,{isclosed:false,trans:true});
    var count=0,counts=ptList.length;
    if(ptList.length%2!==0){return []};
    for(var i=0;i<ptList.length;i=i+2){
        var p0=[],p1=[],p3=[];
        p0=pen;
        p1[0]=ptList[i][0]+pen[0];
        p1[1]=ptList[i][1]+pen[1];
        p3[0]=ptList[i+1][0]+pen[0];
        p3[1]=ptList[i+1][1]+pen[1];

        var berPt=[p0,p1,p3];
        var cpts=Bezier.CalculateBezier(berPt,10);
        result=result.concat(cpts);
        pen[0]=p3[0];
        pen[1]=p3[1];
        cPoint.type='q';
        cPoint.coor=p1;
        count+=2;
    }
    if(count>=counts){
        return {points:result,cPoint:cPoint};
    }
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

    var result=[];
    var ptstring=ptString.replace(/\d(?=-)/g,'$&'+' ').trim();

    var ptList=ptstring.split(/\s+|,/);// use , and ' ' as spliter
    var count=0,counts=ptList.length;
    if(option.tag=='h'||option.tag=='v'){
        for(var i=0;i<ptList.length;i++){
            var pt=[];
            if(option.tag=='h'){
                pt[0]=Number(ptList[i])+pen[0];
                pt[1]=pen[1];
            }
            else{
                pt[0]=pen[0];
                pt[1]=Number(ptList[i])+pen[1];
            }

            if(option.trans){
                result.push(pt);
                pen[0]=pt[0];
                pen[1]=pt[1];
            }
            else{
                var trans_point=p2l.px2latlon(pt,screen,extent);
                result.push(trans_point);
                pen[0]=trans_point[0];
                pen[1]=trans_point[1];
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
            pt[0]=Number(ptList[i])+pen[0];
            pt[1]=Number(ptList[i+1])+pen[1];
            if(option.trans){result.push(pt);}
            else{result.push(p2l.px2latlon(pt,screen,extent));}
            pen[0]=pt[0];
            pen[1]=pt[1];
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


exports.convert=convert;