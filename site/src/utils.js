export function filterGroup(group, pred) {
  return {
    all: () => {
      return group.all().filter(d => {
        return pred(d);
      })
    }
  }
}


