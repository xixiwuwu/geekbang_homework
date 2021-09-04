function matchA(str) {
  for (let c of str) {
    if (c == "a") return true;
  }
  return false;
}

console.log(matchA("I am groot"));
