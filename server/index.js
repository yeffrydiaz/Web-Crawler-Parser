var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var fs = require('fs');

const app = express()
app.use(cors())
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.post('/', (req, res) => {
  res.set('Cache-Control', 'public,max-age=300,s-maxage=300')

  const { clientId } = req.body
  const nBatchNo = clientId.split('-')[0]
  const nSubDiv = clientId.split('-')[1]
  const nRefNo = clientId.split('-')[2]

  var START_URL = `http://www.lesco.gov.pk/Modules/CustomerBill/AccountStatus.asp?nBatchNo=${nBatchNo}&nSubDiv=${nSubDiv}&nRefNo=${nRefNo}&strRU=U`
  var MAX_PAGES_TO_VISIT = 1;
  var pagesVisited = {};
  var numPagesVisited = 0;
  var pagesToVisit = [];
  var url = new URL(START_URL);
  var baseUrl = url.protocol + "//" + url.hostname;

  pagesToVisit.push(START_URL);
  crawl();

  function crawl() {
    if (numPagesVisited >= MAX_PAGES_TO_VISIT) {
      console.log("Reached max limit of number of pages to visit.");
      return;
    }
    var nextPage = pagesToVisit.pop();
    if (nextPage in pagesVisited) {
      // We've already visited this page, so repeat the crawl
      crawl();
    } else {
      // New page we haven't visited
      visitPage(nextPage, crawl);
    }
  }

  function visitPage(url, callback) {
    // Add page to our set
    pagesVisited[url] = true;
    numPagesVisited++;

    // Make the request
    console.log("Visiting page: " + url);
    request(url, function (error, response, body) {
      // Check status code (200 is HTTP OK)
      console.log("Status code: " + response.statusCode);
      if (response.statusCode !== 200) {
        callback();
        return;
      }
      // Parse the document body
      var $ = cheerio.load(body);
      console.log('Scrapping...');
      // Search for the exact words or arguments
      let fieldName = ''
      let fieldValue = ''
      let listOfCell = ''
      const clientData = {}

      $("#main .MemTab").find("td").each(function (index) {
        listOfCell = $(this).siblings()
        for (i = 0; i < listOfCell.length; i++) {
          if ($(listOfCell[i]).text().match(/Customer Name/) ||
            $(listOfCell[i]).text().match(/Bill Issue Date/) ||
            $(listOfCell[i]).text().match(/Due Date/) ||
            $(listOfCell[i]).text().match(/Payment Date/)
          ) {
            fieldName = $(listOfCell[i]).text().trim()
            fieldValue = $(listOfCell[i]).next().text().trim()
            clientData[fieldName] = fieldValue
          }
        }
      })
      console.log(clientData)
      fs.appendFileSync('test.txt', JSON.stringify(clientData) + '\n')
      res.send(clientData)
    })
  }
})


const port = 8008
app.listen(port, (req, res) => {
  console.log(`Server Started on port ${port}`)
})