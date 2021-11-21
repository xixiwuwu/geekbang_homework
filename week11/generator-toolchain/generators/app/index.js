var Generator = require("yeoman-generator");

module.exports = class extends Generator {
  // The name `constructor` is important here
  constructor(args, opts) {
    // Calling the super constructor is important so our generator is correctly set up
    super(args, opts);
  }

  // async method1() {
  //   const answers = await this.prompt([
  //     {
  //       type: "input",
  //       name: "name",
  //       message: "Your project name",
  //       default: this.appname, // Default to current folder name
  //     },
  //     {
  //       type: "confirm",
  //       name: "cool",
  //       message: "Would you like to enable the Cool feature?",
  //     },
  //   ]);

  //   this.log("app name", answers.name);
  //   this.log("cool feature", answers.cool);
  // }


  initPackage(){
    const pkgJson = {
      devDependencies: {
        eslint: '^3.15.0'
      },
      dependencies: {
        react: '^16.2.0'
      }
    };

    // Extend or create package.json file in destination path
    this.fs.extendJSON(this.destinationPath('package.json'), pkgJson);
    
    Object.assign(Generator.prototype, require('yeoman-generator/lib/actions/install')) 
    this.npmInstall(['lodash'], { 'save-dev': true });


    //addDependencies(pkgJson);
  }

  install() {
    
    
    //this.npmInstall();
  }

  async step1() {
    this.fs.copyTpl(
      this.templatePath('t.html'),
      this.destinationPath('public/index.html'),
      { title: 'Templating with Yeoman' }
    );

  }

};
