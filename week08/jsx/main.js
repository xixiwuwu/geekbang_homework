// for (let i of [1, 2, 3]) {
//   console.log(i);
// }

// class Div {
//   constructor() {
//     this.root = document.createElement("div");
//   }

//   setAttribute() {
//     this.root.setAttribute(name, value);
//   }

//   appendChild(child) {
//     child.mountTo(this.root);
//   }

//   mountTo(parent) {
//     parent.appendChild(this.root);
//   }
// }

// let a = (
//   <div id="a">
//     <span>a</span>
//     <span>b</span>
//     <span>c</span>
//   </div>
// );

// let b = <div id="b">hi world</div>;

// let c = (
//   <Div id="c">
//     <span>a</span>
//     <span>b</span>
//     <span>c</span>
//   </Div>
// );

// document.body.appendChild(a);
// document.body.appendChild(b);
// c.mountTo(document.body);

import { Component, createElement } from "./framework.js";


class Carousel extends Component{
  constructor(){
    super();
    this.attributes = Object.create(null);
  }
  setAttribute(name, value){
    this.attributes[name] =value;
  }
  render(){
    this.root = document.createElement("div");
    this.root.classList.add("carousel");
    for(let record of this.attributes.src){
      let child = document.createElement("div");
      child.style.backgroundImage = `url('${record}')`;
      
      this.root.appendChild(child);
    }

    let position = 0;

    this.root.addEventListener("mousedown", event =>{
      let children = this.root.children;
      console.log("mousedown");
      let startX = event.clientX;//, startY = event.clientY;

      let move = event => {
        let x = event.clientX - startX;//, y = event.clientY - startY;
        
        let current = position + ((x - x % 500) / 500);
        for(let offset of [-2, -1, 0, 1, 2]){
          let pos = current + offset;
          pos = (pos + children.length) % children.length;

          children[pos].style.transition ="none";
          children[pos].style.transform = `translateX(${- pos * 500 + offset * 500 + x % 500}px)`;
        }
        
        
      }

      let up = event => {
        let x = event.clientX - startX;
        position = position - Math.round(x / 500);

        for(let offset of [0, - Math.sign(Math.round(x / 500)  - x + 250 * Math.sign(x))]){
          let pos = position + offset;
          pos = (pos + children.length) % children.length;

          children[pos].style.transition ="";
          children[pos].style.transform = `translateX(${- pos * 500 + offset * 500}px)`;
        }

        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", up);
      }

      document.addEventListener("mousemove", move);

      document.addEventListener("mouseup", up);
    })


    /*let currentIndex = 0;
    setInterval(() =>{
      let children = this.root.children;
      let nextIndex = (currentIndex + 1) % children.length; 

      let current = children[currentIndex];
      let next = children[nextIndex];
      next.style.transition = "none";
      next.style.transform = `translateX(${100 - nextIndex * 100}%)`;
      setTimeout(() => {
        next.style.transition ="";
        current.style.transform = `translateX(${-100 - currentIndex * 100}%)`;
        next.style.transform = `translateX(${- nextIndex * 100}%)`;
        
        currentIndex = nextIndex;
      }, 16);      
    }, 3000);*/
    return this.root;
  }
  mountTo(parent){
    parent.appendChild(this.render());
  }
}
let d = [
  "https://static001.geekbang.org/resource/image/73/e4/730ea9c393def7975deceb48b3eb6fe4.jpg",
  "https://static001.geekbang.org/resource/image/bb/21/bb38fb7c1073eaee1755f81131f11d21.jpg",
  "https://static001.geekbang.org/resource/image/1b/21/1b809d9a2bdf3ecc481322d7c9223c21.jpg",
  "https://static001.geekbang.org/resource/image/b6/4f/b6d65b2f12646a9fd6b8cb2b020d754f.jpg",
];

let a = <Carousel src={d}/>
a.mountTo(document.body);