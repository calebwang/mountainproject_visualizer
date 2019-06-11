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

  const ydsMatch = grade.match(/5.(([0-9]+)[abcd]?)/);
  if (ydsMatch) {
    if (+ydsMatch[2] < 10) {
      return "0" + ydsMatch[1];
    }
    return ydsMatch[1];
  }
  return grade;
}


