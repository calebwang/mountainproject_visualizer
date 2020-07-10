import { default as dc, crossfilter, d3 } from "dc";
import { gradeGroup, gradeOrdering, vGrades, ydsGrades } from "./grades";
import { filterGroup } from "./utils"

const getDateDimension = d => { 
  return d3.timeWeek.floor(new Date(d.date));
}
function renderTicksByDate(chart_id, ndx) {
  const routeTypes = ["Trad", "Sport", "Boulder"];
  const dateDimension = ndx.dimension(getDateDimension); 
  const dateByRouteTypeGroup = dateDimension.group().reduce(
    (groupVal, row) => {
      groupVal[row.route_type] = (groupVal[row.route_type] || 0) + 1;
      return groupVal;
    },
    (groupVal, row) => {
      groupVal[row.route_type] = (groupVal[row.route_type] || 0) - 1;
      return groupVal;
    },
    () => {
      return {};
    }
  );

  const chart = dc.barChart(chart_id);

  chart
    .width(1000)
    .height(500)
    .margins({ left: 100, right: 0, top: 10, bottom: 50 })
    .dimension(dateDimension)
    .group(dateByRouteTypeGroup, routeTypes[0], d => d.value[routeTypes[0]])
    .stack(dateByRouteTypeGroup, routeTypes[1], d => d.value[routeTypes[1]])
    .stack(dateByRouteTypeGroup, routeTypes[2], d => d.value[routeTypes[2]])
    .x(d3.scaleTime().domain([new Date(2017, 0, 1), new Date(2021, 0, 1)]))
    .round(d3.timeWeek.floor)
    .xUnits(d3.timeWeeks)
  ;

  chart.legend(dc.legend());

  chart.render();
}

function renderByType(chart_id, ndx) {
  const dimension = ndx.dimension(d => d.route_type);
  const group = dimension.group();

  const chart = dc.pieChart(chart_id);
  
  chart
    .width(350)
    .height(350)
    .radius(125)
    .dimension(dimension)
    .group(group)
    .label(d => {
      const totalCount = dimension.groupAll().value();
      if (totalCount > 0) {
        return d.key + " (" + Math.floor(d.value / totalCount * 100) + "%)";  
      }
      return d.key;
    })
  ;
  chart.render();
}

function reduceGroupByStyle(group) {
  return group.reduce(
    (groupVal, row) => {
      groupVal[row.style] = (groupVal[row.style] || 0) + 1; 
      groupVal.count = (groupVal.count || 0) + 1;
      return groupVal;
    },
    (groupVal, row) => {
      groupVal[row.style] = (groupVal[row.style] || 0) - 1; 
      groupVal.count = (groupVal.count || 0) - 1;
      return groupVal;
    },
    () => {
      return {};
    }
  );
}

function renderTickGrades(ndx, chart_id, valid_route_type_and_grade_pairs) {
  const indexDimension = ndx.dimension(row => {
    return valid_route_type_and_grade_pairs.indexOf(row.route_type + "|" + gradeGroup(row.grade));
  });
  const indexGroup = reduceGroupByStyle(indexDimension.group());
  const filteredGroup = filterGroup(indexGroup, d => {
    return d.key !== -1;
  });

  const chart = dc.barChart(chart_id);

  const styles = new Set()
  filteredGroup.all().forEach(d => {
    Object.keys(d.value).forEach(k => {
      styles.add(k);
    });
  });
  styles.delete("count");
  const stylesArray = Array.from(styles);

  chart
    .width(450)
    .height(300)
    .margins({ left: 100, right: 0, top: 10, bottom: 50 })
    .dimension(indexDimension)
    .group(filteredGroup, stylesArray[0], d => d.value[stylesArray[0]])
    .x(d3.scaleLinear().domain([-0.5, valid_route_type_and_grade_pairs.length - 1]))
    .xUnits(dc.units.integers)
    .round(x => Math.floor(x) + 0.5)
    .centerBar(true)
    .alwaysUseRounding(true)
    .hidableStacks(true)
  ;
  chart.xAxis().tickFormat(idx => {
    const bucket = valid_route_type_and_grade_pairs[idx];
    return bucket ? bucket.split("|")[1] : "";
  });

  for (let i = 1; i < stylesArray.length; i++) {
    chart.stack(filteredGroup, stylesArray[i], d => d.value[stylesArray[i]]); 
  }
  // Hack into internals to improve redraw behavior
  chart.legendToggle = function (d) {
    if (chart.isLegendableHidden(d)) {
        chart.showStack(d.name);
    } else {
        chart.hideStack(d.name);
    }

    chart.render();
  };

  chart.hideStack("Attempt");
  chart.hideStack("Fell/Hung");


  chart.legend(dc.legend());
  chart.render();
}

function renderDataTable(ndx, chart_id) {
  const table = dc.dataTable(chart_id);
  const dimension = ndx.dimension(getDateDimension);
  table
    .dimension(dimension)
    .size(200)
    .columns([
      "date", 
      "name", 
      { label: "Type", format: d => d["route_type"] }, 
      "grade", "style", 
      { 
        label: "URL", 
        format: d => d["url"] 
      }
    ])
    .on("renderlet", function (table) {
      table.selectAll(".dc-table-group").classed("info", true);
    });
  ;
  table.render();


}


global.initVisualization = function(data) {
  global.data = data;
  global.dc = dc;

  const ndx = crossfilter(data);
  global.ndx = ndx;
  
  renderTicksByDate("#chart1", ndx);
  renderByType("#chart-pie-type", ndx);

  const sportGrades = ydsGrades("Sport");
  const tradGrades = ydsGrades("Trad");
  renderTickGrades(ndx, "#chart2", tradGrades.slice(0, tradGrades.indexOf("Trad|5.12a")));
  renderTickGrades(ndx, "#chart3", sportGrades.slice(sportGrades.indexOf("Sport|5.7"), sportGrades.indexOf("Sport|5.14a")));
  renderTickGrades(ndx, "#chart4", vGrades().slice(0, 10));

  renderDataTable(ndx, "#data-table");
}
