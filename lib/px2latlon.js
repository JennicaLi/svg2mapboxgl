/**
 * Created by lj on 16-9-22.
 */
exports.px2latlon=function px2latlon(pt,screen,extent) {
    //  screen=[[0,0],[400,500]];
    // extent=[90,10,140,60];
    //  extent=[73,3,136,54];
    // extent=[121.7,39,122,39.1]
    if(screen.length==0||extent.length==0){
        return pt;
    }
    var p0={};
    p0.x=screen[0][0];
    p0.y=screen[0][1];

    var min_lon=extent[0],
        min_lat=extent[1],
        max_lon=extent[2],
        max_lat=extent[3];

    var width=screen[1][0]-screen[0][0],
        height=screen[1][1]-screen[0][1];

    var scaleX=(max_lon-min_lon)*3600/width,
        scaleY=(max_lat-min_lat)*3600/height;

    var mx=pt[0],my=pt[1];
    var lon=mx*scaleX/3600+min_lon;
    var lat=max_lat-my*scaleY/3600;
    while(lon>180){
        lon-=180
    };
    while(lat>90){lat-=90;}
    return [lon,lat];
}

