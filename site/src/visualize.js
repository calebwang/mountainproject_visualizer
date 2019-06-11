import { default as dc, crossfilter, d3 } from "dc";
import { gradeGroup, gradeOrdering } from "./grades";
import { filterGroup } from "./utils"

function renderTicksByDate(chart_id, ndx) {
  const routeTypes = ["Trad", "Sport", "Boulder"];
  const dateDimension = ndx.dimension(d => { 
    return d3.timeWeek.floor(new Date(d.date));
  }); 
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
    .margins({ left: 100, right: 50, top: 10, bottom: 50 })
    .dimension(dateDimension)
    .group(dateByRouteTypeGroup, routeTypes[0], d => d.value[routeTypes[0]])
    .stack(dateByRouteTypeGroup, routeTypes[1], d => d.value[routeTypes[1]])
    .stack(dateByRouteTypeGroup, routeTypes[2], d => d.value[routeTypes[2]])
    .x(d3.scaleTime().domain([new Date(2017, 0, 1), new Date(2020, 0, 1)]))
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
    .width(250)
    .height(250)
    .radius(100)
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

function genRenderTickGradesByRouteType(ndx) {
  const routeTypeAndGradeDimension = ndx.dimension(row => {
    return row.route_type + "|" + gradeGroup(row.grade);
  });
  return (chart_id, target_route_type) => {
    const dimensionGroupedByStyle = reduceGroupByStyle(routeTypeAndGradeDimension.group())
    const filteredGroup = filterGroup(dimensionGroupedByStyle, d => {
      const [route_type, grade] = d.key.split("|");
      return route_type === target_route_type;
    });

    const styles = new Set()
    filteredGroup.all().forEach(d => {
      Object.keys(d.value).forEach(k => {
        styles.add(k);
      });
    });
    styles.delete("count");
    const stylesArray = Array.from(styles);

    const chart = dc.barChart(chart_id);

    chart
      .width(400)
      .height(300)
      .dimension(routeTypeAndGradeDimension)
      .group(filteredGroup, stylesArray[0], d => d.value[stylesArray[0]])
      .x(d3.scaleBand())
      .xUnits(dc.units.ordinal)
      .ordering(d => {
        const [route_type, grade] = d.key.split("|");
        return gradeOrdering(grade);
      })
    ;

    for (let i = 1; i < stylesArray.length; i++) {
      chart.stack(filteredGroup, stylesArray[i], d => d.value[stylesArray[i]]); 
    }
    chart.xAxis().tickFormat(v => {
      const [route_type, grade] = v.split("|");
      return grade;
    });
    chart.legend(dc.legend());
    chart.render();

  };
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
    .width(400)
    .height(300)
    .dimension(indexDimension)
    .group(filteredGroup, stylesArray[0], d => d.value[stylesArray[0]])
    .x(d3.scaleLinear().domain([0, valid_route_type_and_grade_pairs.length + 1]))
    .xUnits(dc.units.integers)
    .round(x => Math.floor(x) + 0.5)
    .centerBar(true)
    .alwaysUseRounding(true)
  ;

  for (let i = 1; i < stylesArray.length; i++) {
    chart.stack(filteredGroup, stylesArray[i], d => d.value[stylesArray[i]]); 
  }
  chart.legend(dc.legend());
  chart.render();
}


global.initVisualization = function(data) {
  global.data = data;
  global.dc = dc;

  const ndx = crossfilter(data);
  global.ndx = ndx;
  
  const renderTickGradesByRouteType = genRenderTickGradesByRouteType(ndx);
  
  renderTicksByDate("#chart1", ndx);
  renderByType("#chart-pie-type", ndx);

  const boulderGrades = [
    "Boulder|V0", "Boulder|V1", "Boulder|V2", "Boulder|V3", "Boulder|V4", "Boulder|V5", "Boulder|V6"
  ];

  renderTickGradesByRouteType("#chart2", "Trad");
  renderTickGradesByRouteType("#chart3", "Sport");
  renderTickGrades(ndx, "#chart4", boulderGrades);
}
