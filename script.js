const request = require("request");
const cheerio = require("cheerio");
let fs = require("fs");
const { jsPDF } = require("jspdf");
let $;
let data = {};
function linkgenerator(error, response, body) {
  //console.error('error:', error); // Print the error if one occurred
  //console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
  //console.log('body:', body); // Print the HTML for the Google homepage.
  if (!error && response.statusCode == 200) {
    // fs.writeFileSync("index.html",body);

    $ = cheerio.load(body);
    let alltopics = $(".no-underline.d-flex.flex-column.flex-justify-center");
    let alltopicname = $(
      ".f3.lh-condensed.text-center.Link--primary.mb-0.mt-1"
    );
    for (let x = 0; x < 3; x++) {
      let name = $(alltopicname[x]).text().trim();
      let url = "https://github.com/" + $(alltopics[x]).attr("href");
      getTopicPage(name, url);
    }
  }
}

function getTopicPage(name, url) {
  request(url, function f(error, response, body) {
    if (!error && response.statusCode == 200) {
      $ = cheerio.load(body);
      let allproject = $(".d-flex.flex-justify-between.my-3 .text-bold");
      if (allproject.length > 8) allproject = allproject.slice(0, 8);
      for (let i = 0; i < allproject.length; i++) {
        let projecttitle = $(allproject[i]).text().trim();
        let projectlink = "https://github.com/" + $(allproject[i]).attr("href");
        if (!data[name]) {
          data[name] = [{ name: projecttitle, link: projectlink }];
        } else data[name].push({ name: projecttitle, link: projectlink });

        getIssuePage(name, projecttitle, projectlink + "/issues");
      }
    }
  });
}

function getIssuePage(projectname, topicname, url) {
  request(url, function f(error, response, body) {
    if (!error && response.statusCode == 200) {
      $ = cheerio.load(body);
      let allissues = $(
        ".Link--primary.v-align-middle.no-underline.h4.js-navigation-open"
      );
      for (let i = 0; i < allissues.length; i++) {
        let issuename = $(allissues[i]).text().trim();
        let issuelink = "https://github.com/" + $(allissues[i]).attr("href");
        for (let j = 0; j < data[projectname].length; j++) {
          if (data[projectname][j].name === topicname) {
            if (!data[projectname][j].issues) {
              data[projectname][j].issues = [
                { issuename: issuename, issuelink: issuelink },
              ];
            } else {
              data[projectname][j].issues.push({
                issuename: issuename,
                issuelink: issuelink,
              });
            }

            break;
          }
        }
      }
      pdfgenerator(data);
      fs.writeFileSync("data.json", JSON.stringify(data));
    }
  });
}

request("http://www.github.com/topics", linkgenerator);

function pdfgenerator(d) {
  for (x in d) {
    if (!fs.existsSync(x)) fs.mkdirSync(x);
    let path = "./" + x + "/";
    for (y in d[x]) {
      const doc = new jsPDF();
      let issueArr = d[x][y].issues;
      let spacing = 1;

      for (z in issueArr) {
        doc.text(issueArr[z].issuename, 10, 10 * spacing);
        doc.text(issueArr[z].issuelink, 10, 10 * spacing + 5);
        spacing++;
      }
      if (fs.existsSync(path + d[x][y].name + ".pdf"))
        fs.unlinkSync(path + d[x][y].name + ".pdf");

      doc.save(path + d[x][y].name + ".pdf");
    }
  }
}
