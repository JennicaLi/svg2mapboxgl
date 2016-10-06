var test = require('tape');
var convert=require('../lib/convert');
var curve=require('../lib/curve');

test('ptstring to ptArray',function (t) {
    t.plan(4);
    var str1="14.6171875 10.2890625 150.796875 205.199219 267.863281 25.1914062 394.09375 198.679688";
    var str2="14.6171875,10.2890625 150.796875,205.199219 267.863281,25.1914062 394.09375,198.679688";
    var str3="14.6171875 10.2890625 150.796875 205.199219 267.863281 394.09375 198.679688";
    var result=[[14.6171875 ,10.2890625],[150.796875 ,205.199219],[267.863281 ,25.1914062],[394.09375 ,198.679688],[14.6171875 ,10.2890625]];
    t.equal(convert.points2ptArray(str1,true).join(),result.join());
    t.equal(convert.points2ptArray(str2,false).join(),result.slice(0,result.length-1).join());
    t.equal(convert.points2ptArray(str2,true).join(),result.join());

    t.equal(JSON.stringify(convert.points2ptArray(str3,true)),JSON.stringify({err:'Points is single'}));
});

test('rect convert function',function (t) {
    t.plan(1);
    var svg_obj={x:'647',y:'10',width:'221',height:'203'};
    var expect={type:'Polygon',
        coordinates:[[647,10],[868,10],[868,213],[647,213],[647,10]]};
        convert.rectConvert(svg_obj,function (err,result) {
            t.equal(JSON.stringify(result),JSON.stringify(expect));
        });
});

test('generate curve to line',function (t) {
    t.plan(1);
    var points=[[211,300],[186,274],[156,274]];
    var result=curve.ptCollection(points);
    console.log(result);

});



