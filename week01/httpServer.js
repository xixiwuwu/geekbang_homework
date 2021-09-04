const http = require("http");

http
  .createServer((request, response) => {
    let body = [];
    request
      .on("error", (err) => {
        console.error(err);
      })
      .on("data", (chunk) => {
        console.log("receive data");
        body.push(chunk.toString());
      })
      .on("end", () => {
        //body = Buffer.concat(body).toString();
        body = (Buffer.concat([ Buffer.from(body.toString()) ])).toString();
        console.log("body:", body);
        response.writeHead(200, { "Content-Type": "text/html" });
        response.end("Hello world\n");
      });
  })
  .listen(8088);

console.log("server start");
