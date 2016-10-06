#purpose:
       convert svg to mapbox gl,the graph is converted to geojson and the style is convert into [mapbox gl style](https://www.mapbox.com/mapbox-gl-style-spec/)

#usage:


##svg2geojson(svgobj,screen,extent)

###parameters:
  svgobj:{Object} use [xml2js module](https://www.npmjs.com/package/xml2js) convert svg file to object

  screen:{Array} the scope of svg,it is a array with two items.The first item is the upper-left screen coordinate and the second item is the lower-right screen coordinate.eg:[[0,0],[600,800]]

  extent:{Array} the extent of geography longtitude and latitude-[w,s,e,n].for example:the extent of China is [73.5,3.4,135.1,53.6] 

###return:
  {Object} a object with two properties:"geojson","style"
