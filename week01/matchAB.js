function matchAB(str) {
  let foundA = false;
  for (let c of str) {
    if (c == "a") foundA = true;
    else if (c == "b" && foundA) return true;
    else foundA = false;
  }
  return false;
}

console.log(matchAB("I acbm groot"));
