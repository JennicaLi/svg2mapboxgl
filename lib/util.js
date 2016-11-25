/**
 * Created by lj on 16-9-21.
 */
exports.merge=function merge(destination, source) {
    if (destination && source) {
        var result={};
        for (var property in destination) {
            result[property] = destination[property];
        }
        for (var property in source) {
            result[property] = source[property];
        }
        return result;
    } else if (source && (!destination)) {
        var result={};
        for (var property in source) {
            result[property] = source[property];
        }
        return result;
    } else if (destination && (!source)) {
        var result={};
        for (var property in destination) {
            result[property] = destination[property];
        }
        return result;
    }
};

exports.arrayAdd=function (arr1,arr2) {
    if(!arr1 instanceof Array||!arr2 instanceof Array){
        return [];
    }
    var result=arr1.length<arr2.length?arr1:arr2;
    var target=arr1.length<arr2.length?arr2:arr1;
    for(var i=0;i<target.length;i++){
        result[i]=result[i]?result[i]+target[i]:target[i];
    }
    return result;
}
exports.isEmptyObject = function(e) {
    var t
    for (t in e)
        return !1
    return !0
};

exports.deepCopy=function (obj,prop) {
    var result={};
    // var count=0,counts=Object.keys(obj).length;
    for(var p in obj){
        if(p!==prop){
            result[p]=obj[p];
        }
    }
    return result;
}

exports.matrixMultiply=function (m1,m2) {
    var a=1,b=0,
        c=0,d=1,
        e=0,f=0;
    //变换矩阵
    var Matrix=[
        [a,c,e],
        [b,d,f],
        [0,0,1]
    ];
    a=m1[0][0]*m2[0][0]+m1[0][1]*m2[1][0];
    b=m1[1][0]*m2[0][0]+m1[1][1]*m2[1][0];
    c=m1[0][0]*m2[0][1]+m1[0][1]*m2[1][1];
    d=m1[1][0]*m2[0][1]+m1[1][1]*m2[1][1];
    e=m1[0][0]*m2[0][2]+m1[0][1]*m2[1][2]+m1[0][2];
    f=m1[1][0]*m2[0][2]+m1[1][1]*m2[1][2]+m1[1][2];
    return Matrix;

}