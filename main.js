/*
Copyright (c)2014, Matthew Sklar and David Sklar.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

require("sugar");
var express = require("express");
var app = express();
var http = require("http");

var formattedjs;

function getValues(string, title, end) {
	var testRE = JSON.stringify(string).match(title + ":" + "(.*)" + end);
	return(testRE[1].replace("\\n", ""));
}

function getRanges(timespan, body) {
	switch (timespan) {
		case '1m' :
			return "";
			break;
		case '1d' :
			return "";
			break;
		case '5d' :
			var range = getValues(body, "range", "Timestamp:");
			var splitRange = range.split('range:');
			var formattedRange = "";
			for (var i = 0; i < splitRange.length; i++) {
				splitRange[i] = splitRange[i].replace("\\n", "");
			}
			for (var i = 0; i < splitRange.length; i++) {
				var splitSRange = splitRange[i].split(',');
				if (i != 4) formattedRange += splitSRange[0] + ": [" + splitSRange[1] + ',' + splitSRange[2] + '],\n';
				else formattedRange += splitSRange[0] + ": [" + splitSRange[1] + ',' + splitSRange[2] + ']';
			}
			return formattedRange;
			break;
	}
}

function getValuesItems(body) {
	var values = ((body.split("volume:")[1])).split('\n');
	var formattedValue = "";
	for (var i = 1; i < values.length - 1; i++) {
		var splitValue = values[i].split(',');
		if (i != values.length - 2) formattedValue += splitValue[0] + ": " + splitValue[1] + ',\n';
		else formattedValue += splitValue[0] + ": " + splitValue[1];
	}
	return formattedValue;
}

app.get("/:tickersymbol/:timespan", function(req, res) {
	var tickersymbol = req.params.tickersymbol;
	var timespan = req.params.timespan;
	formattedjs = 'window.YSTOKJSDAT = {\n';
	var options = {
		hostname: 'chartapi.finance.yahoo.com',
		port: 80,
		path: '/instrument/1.0/' + tickersymbol + '/chartdata;type=quote;range=' + timespan + '/csv',
		method: 'GET'
	};
	var httpreq = http.request(options, function(httpres) {
		var body;
		httpres.on('data', function(chunk) {
			body += chunk;
		});
		httpres.on('end', function() {
			formattedjs += 'symbol: "' + tickersymbol + '",\n' +
				'name: "' + getValues(body, "Company-Name", "Exchange") + '",\n' +
				'span: "' + timespan + '",\n' +
				'unit: "' + getValues(body, "unit", "time") + '",\n' +
				'ranges: {\n' +
					getRanges(timespan, body) + '\n' +
				'},\n' +
				'values: {\n' +
					getValuesItems(body) + '\n' +
				'}\n' +
			'};';
			console.log(formattedjs);
			res.writeHead(httpres.statusCode, httpres.headers);
			res.end(formattedjs);
		});
	});
	httpreq.end();
});

app.listen(3030);
