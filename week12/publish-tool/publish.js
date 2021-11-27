let http = require("http");
let fs = require("fs");
let archiver = require("archiver");
let child_process = require("child_process");
let querystring = require("querystring");

//认证说明https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps

//1 打开 GET https://github.com/login/oauth/authorize
child_process.exec(`open https://github.com/login/oauth/authorize?client_id=xxxxx`);

//3 创建server 接受token 点击发布

http
  .createServer(function (req, res) {
    let query = querystring.parse(req.url.match(/^\/\?(\s\S]+)$/)[1]);
    console.log(query); 
  })
  .listen(8083, "0.0.0.0");


  function publish(token){
    let request = http.request(
      {
        hostname: "127.0.0.1",
        port: 8082,
        method: "POST",
        path: "/publish?token="+token,
        headers: {
          "Content-Type": "application/octet-stream"
        },
      },
      (response) => {
        console.log(response);
      }
    );
}


/*
let request = http.request(
  {
    hostname: "127.0.0.1",
    port: 8082,
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream"
    },
  },
  (response) => {
    console.log(response);
  }
);
const archive = archiver("zip", {
  zlib: { level: 9 },
});

archive.directory("./sample/", false);
archive.finalize();
archive.pipe(fs.createWriteStream("tmp.zip"));
*/


// fs.stat('./sample.html', (err, stats) =>{

//     let file = fs.createReadStream("./package.json");

//     file.pipe(request);
// });

// file.on('data', chuck => {
//     console.log(chuck.toString());
//     request.write(chuck);
// })

// file.on('end', chuck => {
//     console.log("read finished");
//     request.end(chuck);
// })
