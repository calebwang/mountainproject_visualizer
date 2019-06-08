import { default as dc, crossfilter, d3 } from "dc";

function renderTicksByDate(chart, ndx) {
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

  chart
    .width(1200)
    .height(500)
    .margins({ left: 100, right: 50, top: 10, bottom: 50 })
    .dimension(dateDimension)
    .group(dateByRouteTypeGroup, routeTypes[0], d => d.value[routeTypes[0]])
    .stack(dateByRouteTypeGroup, routeTypes[1], d => d.value[routeTypes[1]])
    .stack(dateByRouteTypeGroup, routeTypes[2], d => d.value[routeTypes[2]])
    .x(d3.scaleTime().domain([new Date(2018, 0, 1), new Date(2020, 0, 1)]))
    .round(d3.timeWeek.floor)
    .xUnits(d3.timeWeeks)
  ;

  chart.legend(dc.legend());

  chart.render();
}

function gradeGroup(grade) {
  const vMatch = grade.match(/^V([0-9]*)/);
  if (vMatch) {
    return vMatch[0];
  }
  return grade;

}

function gradeOrdering(grade) {
  const vMatch = grade.match(/^V([0-9]*)/);
  if (vMatch) {
    return +vMatch[1];
  }

  const ydsMatch = grade.match(/5.(([0-9]+)[abcd+-]?)/);
  if (ydsMatch) {
    if (+ydsMatch[2] < 10) {
      return "0" + ydsMatch[1];
    }
    return ydsMatch[1];
  }
  return grade;
}

function filterGroup(group, pred) {
  return {
    all: () => {
      return group.all().filter(d => {
        return pred(d);
      })
    }
  }
}

function genRenderTickGradesByRouteType(ndx) {
  const routeTypeAndGradeDimension = ndx.dimension(row => {
    return row.route_type + "|" + gradeGroup(row.grade);
  });
  return (chart_id, target_route_type) => {
    const dimensionGroupedByStyle = routeTypeAndGradeDimension.group().reduce(
      (groupVal, row) => {
        return groupVal + 1;
      },
      (groupVal, row) => {
        return groupVal - 1;
      },
      () => {
        return 0;
      }
    );
    const filteredGroup = filterGroup(dimensionGroupedByStyle, d => {
      const [route_type, grade] = d.key.split("|");
      return route_type === target_route_type;
    });

    const chart = dc.barChart(chart_id);

    chart
      .width(400)
      .height(300)
      .dimension(routeTypeAndGradeDimension)
      .group(filteredGroup)
      .x(d3.scaleBand())
      .xUnits(dc.units.ordinal)
      .ordering(d => {
        const [route_type, grade] = d.key.split("|");
        return gradeOrdering(grade);
      })
    ;
    chart.xAxis().tickFormat(v => {
      const [route_type, grade] = v.split("|");
      return grade;
    });
    chart.render();

  };
}

global.initVisualization = function(data) {
  global.data = data;
  global.dc = dc;

  const ndx = crossfilter(data);
  global.ndx = ndx;
  
  const renderTickGradesByRouteType = genRenderTickGradesByRouteType(ndx);
  
  const chart1 = dc.barChart("#chart1");
  renderTicksByDate(chart1, ndx);

  renderTickGradesByRouteType("#chart2", "Trad");
  renderTickGradesByRouteType("#chart3", "Sport");
  renderTickGradesByRouteType("#chart4", "Boulder");
}
