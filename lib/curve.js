/**
 * Created by lj on 16-9-13.
 * 根据控制点的数组生成贝尔曲线的点的数组
 */
var p2l=require('./px2latlon');
function getCoefficient(nn,k){
    var i,sum=1;
    var count=0,counts=2*k;
    for(var i=1;i<=nn;i++){
        sum*=i;
        count++;
    }
    for(var j=1;j<=nn-k;j++){
        sum/=j;
        count++;
    }
    for(var m=1;m<=k;m++){
        sum/=m;
        count++;
    }
    if(count>=counts){
        return sum;
    }
}
/*
t {Number} 0<t<1
 points {Array} the array of control points;
 */
function getPt(t,points) {
    var n=points.length;
    var x = 0, y = 0, ber;
    for (var k = 0; k <n; k++) {
        var ber = getCoefficient(n-1, k) * Math.pow(t, k) * Math.pow(1 - t, n - 1 - k);
        x += points[k][0] * ber;
        y += points[k][1] * ber;
    }
    return [x,y];
}

function ptCollection(points){
    var m=10;
    var count=0;
   var ptArray=[];
    for(var i=1;i<=m;i++){
        var temp=getPt(i/m,points);
        ptArray.push(temp);
        count++;
    }
    if(count==m){
       return ptArray;
    }
}

exports.ptCollection=ptCollection;
exports.ellipse=function (cx,cy,rx,ry,screen,extent) {
    var result=[];
    var n=50;
    var alpha=2*Math.PI/n;
    for(var i=0;i<n;i++){
        var angle=alpha*i;
        var x=cx+rx*Math.cos(angle);
        var y=cy+ry*Math.sin(angle);
        var pt=[];
        pt[0]=x;
        pt[1]=y;
        result.push(p2l.px2latlon(pt,screen,extent));
    }
    result.push(p2l.px2latlon([cx+rx,cy],screen,extent));
    return result;
}