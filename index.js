
var coverter=require('./lib/convert');
var util=require('./lib/util');

var svg2geoType={
    rect:1,
    polygon:1,
    line:1,
    polyline:1,
    circle:1,
    ellipse:1,
    path:1
};
exports.svg2geojson=function (svgobj,screen,extent) {
    var layer_obj=[];
    var geojson={};
    geojson.type="FeatureCollection";
    geojson.features=[];
    var gArray=svgobj.svg;

    var geoArray=getGeo(gArray,{});
    for(var i=0;i<geoArray.length;i++){
        var graph=geoArray[i]["graph"];
        var desc=geoArray[i]["style"];
        var type=geoArray[i]["type"];
        var result=[];
        result=coverter.convert(type,graph,desc,screen,extent);
        geojson.features=geojson.features.concat(result.data);
        layer_obj=layer_obj.concat(result.style);
    }
    return {geojson:geojson,style:layer_obj};
}

function getGeo(obj,desb){
    var geoArray=[];
    var mDes=obj['$']||{};
    mDes=util.merge(desb,mDes);
    for(var pro in obj){
        if(pro=="g"){
            var gcollection=obj["g"];
            for(var i=0;i<gcollection.length;i++){
                var geo_obj=getGeo(gcollection[i],mDes);
                geoArray=geoArray.concat(geo_obj);
            }
        }
        else if(svg2geoType[pro]!==undefined){
            var geo_obj={};
            geo_obj['type']=pro;
            geo_obj["graph"]=obj[pro];
            geo_obj["style"]=util.merge(mDes,{});
            geoArray.push(geo_obj);
        }
    }
    return geoArray;
}

exports.getGeo=getGeo;

