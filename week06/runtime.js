
  export class ExecutionContext{
    constructor(realm, lexicalEnvironment, variableEnvironment){
        variableEnvironment = variableEnvironment || lexicalEnvironment;
      this.lexicalEnvironment = lexicalEnvironment;
      this.variableEnvironment = variableEnvironment;
      this.realm = realm;
    }
  }
  
  
  export class Reference{
    constructor(object, Property){
      this.object = object;
      this.Property = Property;
    }
  
    set(value){
      this.object[this.Property] = value;
    }
  
    get(){
      return this.object[this.property];
    }
  }
  