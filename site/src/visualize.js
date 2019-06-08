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
    .dimension(dateDimension)
    .group(dateByRouteTypeGroup, routeTypes[0], d => d.value[routeTypes[0]])
    .stack(dateByRouteTypeGroup, routeTypes[1], d => d.value[routeTypes[1]])
    .stack(dateByRouteTypeGroup, routeTypes[2], d => d.value[routeTypes[2]])
    .x(d3.scaleTime().domain([new Date(2018, 0, 1), new Date(2020, 0, 1)]))
    .round(d3.timeWeek.floor)
    .xUnits(d3.timeWeeks);

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

  const ydsMatch = grade.match(/5.(([0-9]+)[abcd+-])?/);
  if (ydsMatch) {
    if (+ydsMatch[2] < 10) {
      return "0" + ydsMatch[1];
    }
    return ydsMatch[1];
  }
  return grade;
}

function renderTickGrades(ndx) {
  const dimension = ndx.dimension(d => d.route_type);
  const group = dimension.group().reduce(
    (groupVal, row) => {
      const g = gradeGroup(row.grade)
      groupVal[g] = (groupVal[g] || 0) + 1;
    },
    (groupVal, row) => {
      const g = gradeGroup(row.grade)
      groupVal[g] = (groupVal[g] || 0) - 1;
    },
    () => {
      return {};
    }
  );
}

function genRenderTickGradesByRouteType(ndx) {
  const typeStyleGradeDimension = ndx.dimension(d =>
    d.route_type + "|" + d.style + "|" + gradeGroup(d.grade)
  );
  const typeStyleGradeGroup = typeStyleGradeDimension.group();

  return (chart, ndx, target_route_type) => {
    const routeTypeGroup = (source_group) => {
      return {
        all: () => {
          return source_group.all()
            .filter(d => {
              const [route_type, style, grade] = d.key.split("|");
              return route_type === target_route_type;
            })
        }
      } 
    }
    chart
      .width(500)
      .height(500)
      .dimension(typeStyleGradeDimension)
      .group(routeTypeGroup(typeStyleGradeGroup))
      .keyAccessor(d => {
        const [route_type, style, grade] = d.key.split("|");
        return grade;
      })
      .ordering(d => gradeOrdering(d.key));

    chart.render();


  }
}

global.initVisualization = function(data) {
  global.data = data;
  global.dc = dc;

  const ndx = crossfilter(data);
  global.ndx = ndx;
  
  const renderTickGradesByRouteType = genRenderTickGradesByRouteType(ndx);
  
  
  const chart1 = dc.barChart("#chart1");
  renderTicksByDate(chart1, ndx);

  const chart2 = dc.rowChart("#chart2");
  const chart3 = dc.rowChart("#chart3");

  const chart4 = dc.rowChart("#chart4");
  renderTickGradesByRouteType(chart4, ndx, "Sport");

  const chart5 = dc.rowChart("#chart5");
  renderTickGradesByRouteType(chart5, ndx, "Boulder");
}
