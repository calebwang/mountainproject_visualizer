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
    .width(1000)
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

function renderTickGrades(ndx) {
  const routeTypeDimension = ndx.dimension(d => d.route_type);
  const routeTypeGroupByGrade = dimension.group().reduce(
    (groupVal, row) => {
      const g = gradeGroup(row.grade)
      groupVal[g] = (groupVal[g] || 0) + 1;
      return groupVal;
    },
    (groupVal, row) => {
      const g = gradeGroup(row.grade)
      groupVal[g] = (groupVal[g] || 0) - 1;
      return groupVal;
    },
    () => {
      return {};
    }
  );
}

function filterGroupNonZero(group) {
  return {
    all: () => {
      return group.all().filter(d => {
        return d.value > 0; 
      })
    }
  }
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

function genRenderTickGrades(ndx) {
  const gradeDimension = ndx.dimension(d => gradeGroup(d.grade));
  return (chart_id, route_type) => {
    const gradeDimensionByRouteTypeGroup = gradeDimension.group().reduce(
      (groupVal, row) => {
        if (row.route_type === route_type) {
          return groupVal + 1;
        }
        return groupVal;
      },
      (groupVal, row) => {
        if (row.route_type === route_type) {
          return groupVal - 1;
        }
        return groupVal;
      },
      () => {
        return 0;
      }
    )

    const chart = dc.rowChart(chart_id);

    chart
      .width(500)
      .height(500)
      .dimension(gradeDimension)
      .group(gradeDimensionByRouteTypeGroup)
      .ordering(d => gradeOrdering(d.key))
    ;

    chart.render();

  }
}

function genRenderTickGradesByRouteTypeAndGrade(ndx) {
  const routeTypeAndGradeDimension = ndx.dimension(row => {
    row.route_type + "|" + gradeGroup(row.grade);
  });
  return (chart, target_route_type) => {
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
      return d.split("|")[0] === target_route_type;
    });

    chart
      .width(500)
      .height(500)
      .dimension(routeTypeAndGradeDimension)
      .group(filteredGroup)
    ;
    chart.render();

  };
}

function genRenderTickGradesByRouteType(ndx) {
  const typeStyleGradeDimension = ndx.dimension(d => {
    return d.route_type + "|" + d.style + "|" + gradeGroup(d.grade)
  });

  return (chart, target_route_type) => {
    const typeStyleGradeGroup = typeStyleGradeDimension.group();
    const filteredRouteTypeGroup = filterGroup(typeStyleGradeGroup, d => {
      const [route_type, style, grade] = d.key.split("|");
      return route_type === target_route_type;
    });

    chart
      .width(500)
      .height(500)
      .dimension(typeStyleGradeDimension)
      .group(filteredRouteTypeGroup)
    ;

    chart.render();
  }
}

global.initVisualization = function(data) {
  global.data = data;
  global.dc = dc;

  const ndx = crossfilter(data);
  global.ndx = ndx;
  
  const renderTickGradesByRouteType = genRenderTickGradesByRouteType(ndx);

  const renderTickGrades = genRenderTickGrades(ndx);
  
  
  const chart1 = dc.barChart("#chart1");
  renderTicksByDate(chart1, ndx);

  renderTickGrades("#chart2", "Sport");
  const chart3 = dc.rowChart("#chart3");
  genRenderTickGradesByRouteTypeAndGrade(ndx)(chart3, "Sport");

  const chart4 = dc.rowChart("#chart4");
  renderTickGradesByRouteType(chart4, "Sport");

  const chart5 = dc.rowChart("#chart5");
  renderTickGradesByRouteType(chart5, "Boulder");
}
