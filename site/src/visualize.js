import { default as dc, crossfilter, d3 } from "dc";

global.initVisualization = function(data) {
  global.data = data;
  global.dc = dc;
  document.body.appendChild(document.createTextNode(JSON.stringify(data, undefined, 4)));

  const chart1 = dc.barChart("#chart1");
  const ndx = dc.crossfilter(data);
  const dateDimension = ndx.dimension(function(d) { return new Date(d.date); }); 
  const dateGroup = dateDimension.group();
  
  chart1
    .width(1000)
    .height(500)
    .x(dc.d3.scaleTime().domain([new Date(2018, 0, 1), new Date(2020, 0, 1)]))
    .dimension(dateDimension)
    .group(dateGroup);
  chart1.render();
  console.log("HELLO");
}
