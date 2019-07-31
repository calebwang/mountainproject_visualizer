export function gradeGroup(grade) {
  const vMatch = grade.match(/^V([0-9]*)/);
  if (vMatch) {
    return vMatch[0];
  }
  const ydsMatch = grade.match(/5.(([0-9]+)[abcd]?)/);
  if (ydsMatch) {
    return ydsMatch[0];
  }
  return grade;

}

export function gradeOrdering(grade) {
  const vMatch = grade.match(/^V([0-9]*)/);
  if (vMatch) {
    return +vMatch[1];
  }

  const ydsMatch = grade.match(/5.([0-9]+)([abcd+-]?)/);
  if (ydsMatch) {
    if (+ydsMatch[1] < 10) {
      return "0" + ydsMatch[1];
    }
    if (ydsMatch[2] === "-" || ydsMatch[2] === "") {
      return ydsMatch[1] + "a";
    } else if (ydsMatch[2] === "+") {
      return ydsMatch[1] + "d";
    } else {
      return ydsMatch[1] + ydsMatch[2];
    }
  }
  return grade;
}

export function ydsGrades(route_type) {
  const grades = [];
  for (let i = 0; i < 10; i++) {
    grades.push(route_type + "|5." + i);
  }
  for (let i = 10; i < 16; i++) {
    for (let l of ["a", "b", "c", "d"]) {
      grades.push(route_type + "|5." + i + l);
    }
  }
  return grades;
}

export function vGrades() {
  const grades = [];
  for (let i = 0; i < 17; i++) {
    grades.push("Boulder|V" + i);
  }
  return grades;
}
