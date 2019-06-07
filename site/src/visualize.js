import { default as dc, crossfilter, d3 } from "dc";

global.initVisualization = function(data) {
  global.data = data;
  global.dc = dc;
  document.body.appendChild(document.createTextNode(JSON.stringify(data, undefined, 4)));

  const ndx = crossfilter(data);
  const dateDimension = ndx.dimension(function(d) { 
    return d3.timeWeek.floor(new Date(d.date));
  }); 
  const dateGroup = dateDimension.group();

  const typeDimension = ndx.dimension(function(d) { return d.route_type });
  const typeBuckets = ["RouteType.Sport", "RouteType.Boulder"];
  const typeGroup = typeDimension.group();
  
  const chart1 = dc.barChart("#chart1");
  chart1
    .width(1000)
    .height(500)
    .dimension(dateDimension)
    .group(dateGroup)
    .x(d3.scaleTime().domain([new Date(2018, 0, 1), new Date(2020, 0, 1)]))
    .round(d3.timeWeek.floor)
    .xUnits(d3.timeWeeks);

  chart1.render();

  const chart2 = dc.rowChart("#chart2");
  chart2
    .width(500)
    .height(250)
    .dimension(typeDimension)
    .group(typeGroup);
  

  chart2.render();
}
