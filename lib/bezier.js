/**
 * Created by lj on 16-10-3.
 */

/*
 ****** p0,p3   {num} the end points of beizer curve
 *******p1,p2   {num} the reference points of berzer curve
 ********t      {num} 0<t<1
 */
var convert=require('./convert');

function CurbMetaComputing(p0,p1,p2,p3,t) {
    var a,b,c;
    var tSquare, tCube;
    c=3*(p1-p0);
    b=3*(p2-p1)-c;
    a=p3-b-c-p0;
    tSquare=t*t;
    tCube=t*tSquare;
    return a*tCube+b*tSquare+c*t+p0;
}

/*
 ****** p0,p3   {num} the end points of beizer curve
 *******p1   {num} the reference points of berzer curve
 ********t      {num} 0<t<1
 */
function SquareMetaComputing(p0,p1,p3,t) {
    var item=1-t;
    return item*item*p0+2*t*item*p1+t*t*p3;
}

function PointOnBezier(pt,t) {
    var tPoint=[];
    if(pt.length==4){
        tPoint[0]=CurbMetaComputing(pt[0][0],pt[1][0],pt[2][0],pt[3][0],t);
        tPoint[1]=CurbMetaComputing(pt[0][1],pt[1][1],pt[2][1],pt[3][1],t);
    }
    else if(pt.length==3){
        tPoint[0]=SquareMetaComputing(pt[0][0],pt[1][0],pt[2][0],t);
        tPoint[1]=SquareMetaComputing(pt[0][1],pt[1][1],pt[2][1],t);
    }

    return tPoint;
}

function CalculateBezier(cp,num){
    if(cp.length<3){
        console.error('beizerCurve:the num of the reference-point is less than 1.');
        return [];
    }

    var curve=[];
    var t=1/(num-1);

    for(var i=1;i<num;i++){
        curve[i-1]=PointOnBezier(cp,i*t);
    }

    return curve;
}

exports.CalculateBezier=CalculateBezier;

exports.SquareBezier=function (ptString,option) {
    var cPoint={"type":"","coor":[]};
    var pen=option.start?option.start:[0,0];
    var result=[];
    var trsform={};
    // if(option.trsform){
    //     trsform=util.deepCopy(option.trsform,'translate');
    // }
    var ptList=convert.points2ptArray(ptString,{isclosed:false,trans:true,trsform:trsform});
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

exports.CubicBezier=function (ptString,option) {
    var cPoint={"type":"","coor":[]};
    var pen=option.start?option.start:[0,0];
    var trsform={};
    var result=[];
    if(option.trsform){
        trsform=util.deepCopy(option.trsform,'translate');
    }
    var ptList=convert.points2ptArray(ptString,{isclosed:false,trans:true,trsform:trsform});
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
        var cpts=CalculateBezier(berPt,10);
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