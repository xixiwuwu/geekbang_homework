import { linear } from "./ease";

const TICK = Symbol("tick");
const TICK_HANDLER = Symbol("tick-handler");
const ANNIMATIONS = Symbol("animations");
const START_TIME = Symbol("start-time");

export class Timeline{
    constructor(){
        this.state = "inited";
        this[ANNIMATIONS] = new Set();
        this[START_TIME] = new Map();
    }

    start(){
        if(this.state !== "inited"){
            return;
        }
        this.state = "started";

        let startTime = Date.now();
        this[TICK] = () =>{
            let now = Date.now();
            for(let animation of this[ANNIMATIONS]){
                let t;
                if(this[START_TIME].get(animation) < startTime){
                    t = now - startTime - this[PAUSE_TIME] - animation.delay;
                }else{
                    t = now - this[START_TIME].get(animation) - this[PAUSE_TIME] - animation.delay;
                }
                if(animation.duration  < t){
                    this[ANNIMATIONS].delete(animation);
                    t = animation.duration;
                }
                if(t > 0){                
                    animation.receive(t);
                }   
            }
            this[TICK_HANDLER] = requestAnimationFrame(this[TICK]);
        }
        this[TICK]();
    }

    pause(){
        if(this.state !== "started"){
            return;
        }
        this.state = "paused";

        this[PAUSE_START] = Date.now();
        cancelAnimationFrame(this[TICK_HANDLER]);
    }

    resume(){
        if(this.state !== "paused"){
            return;
        }
        this.state = "started";
 
        thisp[PAUSE_TIME] += Date.now() - this[PAUSE_START];
        this[TICK]();
    }

    reset(){
        this.pause();
        this.state = "inited";
        let startTime = Date.now();
        this[PAUSE_TIME] = 0;
        this[ANNIMATIONS] = new Set();
        this[START_TIME] = new Map();
        this[PAUSE_START] = 0;
        this[TICK_HANDLER] = null;
    }

    add(animation, startTime){
        if(arguments.length < 2){
            startTime = Date.now();
        }
        this[ANNIMATIONS].add(animation);
        this[START_TIME].set(animation, startTime);
    }
}

export class Animation{
    constructor(object, perperty, startValue, endValue, duration, delay, timingFuncation, template){
        this.timingFuncation = timingFuncation || (v => v);
        this.template = template || (v => v);
        this.object = object;
        this.perperty = perperty;
        this.startValue = startValue;
        this.endValue = endValue;
        this.duration = duration;
        this.timingFuncation = timingFuncation;
        this.delay = delay;
        this.template = template;
    }

    receive(time){
        let range = (this.endValue -this.startValue);
        let progress = this.timingFuncation(time / this.duration);
        this.object[this.perperty] = this.template(this.startValue + range * progress);
    }
}