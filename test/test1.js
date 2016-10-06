/**
 * Created by lj on 16-9-22.
 */
var fs=require('fs');

var xml2js=require('xml2js');
var svg2gj=require('../index');

var sourceName='geojson-source';

var screen=[[0,0],[400,500]];//the width
var extent=[73,3,136,54];

fs.readFile('./data/tt.svg','utf-8',function(err,xml){
    if(err) {console.log(err);return;}
    xml2js.parseString(xml,function(e,result){
        // var arr=svg2gj.getGeo(result.svg,{});
        // console.log(arr);
        if(e){console.log(e);return;}
        // console.log(result);
        var gl={};
        gl.version=8;
        gl.name='test';
        gl.sources={};
        gl['sources'][sourceName]={"type":"geojson","data":{}};

        // gl.sources={"geojson-source":{"type":"geojson","data":{}}};
        var obj=svg2gj.svg2geojson(result,screen,extent);
        gl['sources'][sourceName]["data"]=obj.geojson;
        var layer_array=obj.style;
        for(var i=0;i<layer_array.length;i++){
            layer_array[i]["source"]=sourceName;
        }
        gl.layers=layer_array;
       // return gl;
        fs.writeFile('./result.json',JSON.stringify(gl),'utf-8',function (err,result) {
            if(err) console.log(err);
            else(console.log('ok'));
        });
    });
});