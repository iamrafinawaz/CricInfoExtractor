




// npm init -y
// npm install minimist
// npm install axios
// npm install jsdom
// npm install excel4node
// npm install pdf-lib

// node CricinfoExtracter.js --excel=Worldcup.xls --dataFolder=data --source=https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-schedule-fixtures-and-results

let minimist = require("minimist");
let axios=require("axios");
let jsdom=require("jsdom");
let excel4node = require("excel4node");
let pdf = require("pdf-lib");

let args=minimist(process.argv);
console.log(args);
