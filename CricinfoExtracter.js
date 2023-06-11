




// npm init -y
// npm install minimist
// npm install axios
// npm install jsdom
// npm install excel4node
// npm install pdf-lib

// node CricinfoExtracter.js --excel=Worldcup.xls --dataFolder=data --source="https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-schedule-fixtures-and-results"

let minimist = require("minimist");
let axios=require("axios");
let jsdom=require("jsdom");
let excel = require("excel4node");
let pdf = require("pdf-lib");
let fs = require("fs");
let path = require('path');

let args=minimist(process.argv);

let responseKaPromise = axios.get(args.source);
responseKaPromise
.then(function(response){
    let html=response.data;

    let dom = new jsdom.JSDOM(html);
    let document = dom.window.document;

    let matches = [];
    let matchScoreDivs = document.querySelectorAll("div.ds-text-compact-xxs");
    for (let i = 0; i < matchScoreDivs.length; i++) {
    let match = {
        t1: "",
        t2: "",
        t1s: "",
        t2s: "",
        result: ""
    };

    let namePs = matchScoreDivs[i].querySelectorAll("p.ds-text-tight-m.ds-font-bold.ds-capitalize.ds-truncate");

    if (namePs.length >= 2) {
       match.t1 = namePs[0].textContent;
       match.t2 = namePs[1].textContent;

    } 

    
    let scoreSpans = matchScoreDivs[i].querySelectorAll("div.ds-text-compact-s.ds-text-typo.ds-text-right.ds-whitespace-nowrap");
if (scoreSpans.length == 2) {
    match.t1s = scoreSpans[0].textContent;
    match.t2s = scoreSpans[1].textContent;
} else if (scoreSpans.length == 1) {
    match.t1s = scoreSpans[0].textContent;
    match.t2s = "";
} else {
    match.t1s = "";
    match.t2s = "";
}

let spanResult = matchScoreDivs[i].querySelector("p.ds-text-tight-s.ds-font-regular.ds-line-clamp-2.ds-text-typo");
match.result = spanResult ? spanResult.textContent : "";

    matches.push(match);
    


}



// matches.splice(0, 9); // Remove the first 15 unwanted which is going on right now elements from the matches array
 
// console.log(matches.length);  // Check 48 matches are coming or not, Change the Slice function argument accordingly.

let matchesJSON = JSON.stringify(matches);
fs.writeFileSync("matches.json", matchesJSON , "utf-8");

  let teams = [];
  for(let i=0;i<matches.length;i++){
    putTeamInTeamsArrayIfMissing(teams,matches[i]);
  }
  
  for(let i=0;i<matches.length;i++){
    putMatchesInAppropriateTeam(teams,matches[i]);
  }
 teams.shift();
  let teamsJSON = JSON.stringify(teams);
fs.writeFileSync("teams.json", teamsJSON , "utf-8");
  

    createExcelFile(teams);
    createFolder(teams);

}).catch(function(err){
    console.log(err);
})


function createScoreCard(teamName, match, matchFileName){
    let t1=teamName;
    let t2=match.vs;
    let t1s = match.selfScore;
    let t2s = match.oppScore;
    let result=match.result;

    let originalBytes=fs.readFileSync("Template.pdf");
    let prmToLoadDoc=pdf.PDFDocument.load(originalBytes);
   
    prmToLoadDoc.then(function(pdfdoc){
        let page=pdfdoc.getPage(0);
        page.drawText(t1,{
            x:300,
            y:450,
            size:24

        });
        page.drawText(t2,{
            x:300,
            y:375,
            size:24

        });
        page.drawText(t1s,{
            x:300,
            y:300,
            size:24

        });
        page.drawText(t2s,{
            x:300,
            y:225,
            size:24

        });

        page.drawText(result,{
            x:300,
            y:150,
            size:24

        });

    let prmToSave=pdfdoc.save();
    prmToSave.then(function(changedBytes){
        fs.writeFileSync(matchFileName,changedBytes);
    });

    });
}


function createFolder(teams){
    fs.mkdirSync(args.dataFolder);
    for (let i = 0; i < teams.length; i++) {
    let teamFN = path.join(args.dataFolder,teams[i].name);
        fs.mkdirSync(teamFN);
        
        for(let j=0; j<teams[i].matches.length; j++){
        let matchFileName = path.join(teamFN,teams[i].matches[j].vs + ".pdf");
            createScoreCard(teams[i].name,teams[i].matches[j], matchFileName)
        }


        }
}


  

  function createExcelFile(teams){
    let wb = new excel.Workbook();
    for (let i = 0; i < teams.length; i++) {
        let sheet = wb.addWorksheet(teams[i].name);
     
        
     
         sheet.cell(1,1).string("VS");
         sheet.cell(1,2).string("Self Score");
         sheet.cell(1,3).string("Opp Score");
         sheet.cell(1,4).string("Result");
     
         for(let j=0;j<teams[i].matches.length;j++){
     
             sheet.cell(j+2,1).string(teams[i].matches[j].vs);
             sheet.cell(j+2,2).string(teams[i].matches[j].selfScore);
             sheet.cell(j+2,3).string(teams[i].matches[j].oppScore);
             sheet.cell(j+2,4).string(teams[i].matches[j].result);
     
     
         }
     
     }
     wb.write(args.excel);
 }

 function putTeamInTeamsArrayIfMissing(teams,match){
    let t1ixd=-1;
    for(let i=0; i<teams.length;i++){
        if(teams[i].name == match.t1){
            t1ixd = i;
            break;
        }
    }

if(t1ixd == -1){
    teams.push ({
        name: match.t1,
        matches: []
    });
}

let t2ixd=-1;
for(let i=0; i<teams.length;i++){
    if(teams[i].name == match.t2){
        t2ixd = i;
        break;
    }
}

if(t2ixd == -1){
teams.push ({
    name: match.t2,
    matches: []
});
}


}

function putMatchesInAppropriateTeam(teams,match){
    let t1ixd=-1;
    for(let i=0; i<teams.length;i++){
        if(teams[i].name == match.t1){
            t1ixd = i;
            break;
        }
    }

    let team1 = teams[t1ixd];
    team1.matches.push({
        vs: match.t2,
        selfScore: match.t1s,
        oppScore: match.t2s,
        result: match.result


    });






    let t2ixd=-1;
for(let i=0; i<teams.length;i++){
    if(teams[i].name == match.t2){
        t2ixd = i;
        break;
    }
}

let team2 = teams[t2ixd];
team2.matches.push({
    vs: match.t1,
    selfScore: match.t2s,
    oppScore: match.t1s,
    result: match.result


});

}


  

