let http = require("http");
let https = require("https");
//let fs = require("fs");
let unzipper = require("unzipper");
let querystring = require("querystring");

//2 auth 路由 接受code 用code + client_id + client_secret换token

function auth(req, res) {
    let query = querystring.parse(req.url.match(/^\/auth\?(\s\S]+)$/)[1]);
    getToken(query.code, function(info){
        //res.write(JSON.stringify(info));
        res.write(`<a href='http://localhost:8083/?token=${info.access_token}'>publish</a>`);
        res.end();
    });
}

function getToken(code, callback){
    let request = https.request({
        hostname: "github.com",
        path: `/login/oauth/access_token?code=${code}&client_id=Xddsds&client_secret=sdfsafaffwewjro`,
        port: 443,
        method: "POST"
    }, function(response){
        let body = "";
        response.on('data', chuck => {
            body += chuck.toString();
        });
        response.on('end', chuck => {            
            callback(querystring.parse(body));
        });
    });

    request.end();
}

//4 用token获取用户信息，鉴权 接受发布
function publish(req, res){
    let query = querystring.parse(req.url.match(/^\/publish\?(\s\S]+)$/)[1]);
    getUser(query.token, info => {
        if(info.login === "xixiwuwu"){
          req.pipe(unzipper.Extract({path: '../server/public/'}));
          req.on('end', function(){
            res.end("success");
          });
        }
    });
    
}

function getUser(token, callback){
    let request = https.request({
        hostname: "api.github.com",
        path: `/user`,
        port: 443,
        method: "GET",
        headers: {
            Authorization :`token ${token}`,
            "User-Agent": 'toy-publish'
        }
    }, function(response){
        let body = "";
        response.on('data', chuck => {
            body += chuck.toString();
        });
        response.on('end', chuck => {            
            console.log(body);
            callback(JSON.stringify(body));
        });
    });
}


http
  .createServer(function (req, res) {
    console.log(req.headers);
    if (req.url.match(/^/auth\?/)) 
      return auth(req, res);
    if (req.url.match(/^/publish\?/)) 
      return publish(req, res);

    //let outFile = fs.createWriteStream("../server/public/tmp.zip");

    // req.on('data', chuck =>{
    //     //console.log(chuck.toString());
    //     outFile.write(chuck);
    // });
    // req.on('end', () =>{
    //     outFile.end();
    //     res.end("Success");
    // })
    req.pipe(unzipper.Extract({ path: "../server/public/" }));
  })
  .listen(8082, "0.0.0.0");
