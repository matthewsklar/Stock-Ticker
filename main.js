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

function ranges(body, splitR) {
	var range = getValues(body, "range", "Timestamp:");
	var splitRange = range.split('range:');
	var formattedRange = "";
	for (var i = 0; i < splitRange.length; i++) {
		splitRange[i] = splitRange[i].replace("\\n", "");
	}
	if (splitR) return splitRange;
	for (var i = 0; i < splitRange.length; i++) {
		var splitSRange = splitRange[i].split(',');
		if (i != splitRange.length - 1) formattedRange += splitSRange[0] + ": [" + splitSRange[1] + ',' + splitSRange[2] + '],\n';
		else formattedRange += splitSRange[0] + ": [" + splitSRange[1] + ',' + splitSRange[2] + ']';
	}
	return formattedRange;
}

function getRanges(timespan, body) {
	if (timespan.indexOf('d') > -1 && timespan.indexOf('1d') === -1) {
		return ranges(body, false);
	} else {
		return "";
	}
}

function getDateRanges(timespan, body, date) {
	var splitRanges = ranges(body, true);
	var formattedRange = "";
	var dateLocation;
	for (var i = 0; i < splitRanges.length; i++) {
		if (splitRanges[i].split(',')[0] == date) {
			for (var j = 0; j < timespan.substring(0, timespan.length - 1); j++) {
				var splitSRanges = splitRanges[i + j].split(',');
				if (j != timespan.substring(0, timespan.length - 1) - 1) formattedRange += splitSRanges[0] + ': [' + splitRanges[1] + ',' + splitRanges[2] + '],\n';
				else formattedRange += splitSRanges[0] + ': [' + splitRanges[1] + ',' + splitRanges[2] + ']';
			}
		}
	}
	return formattedRange;
}


function getValuesItems(body) {
	var values = ((body.split("volume:")[1])).split('\n');
	var formattedValue = "";
	for (var i = 1; i < values.length - 1; i++) {
		var splitValue = values[i].split(',');
		if (i != values.length - 2) formattedValue +=  splitValue[0] + ": [" + splitValue[1] + ',' + splitValue[2] + '],\n';
		else formattedValue += splitValue[0] + ": [" + splitValue[1] + ',' + splitValue[2] + ']';
	}
	return formattedValue;
}

function getDateValues(timespan, body, date) {
	var values = ((body.split("volume:")[1])).split('\n');
	var days = timespan.substring(0, timespan.length - 1);
	var formattedValue = "";
	if (days == 1) {
		for (var i = 1; i < 391; i++) {
			var splitValue = values[i].split(',');
			if (i != values.length) formattedValue += splitValue[0] + ": [" + splitValue[1] + ',' + splitValue[2] + '],\n';
			else formattedValue += splitValue[0] + ": [" + splitValue[1] + ',' + splitValue[2] + ']';
		}
	} else {
		for (var i = 1; i < days * 79 + 1; i++) {
			var splitValue = values[i].split(',');
			if (i != days * 79) formattedValue += splitValue[0] + ": [" + splitValue[1] + ',' + splitValue[2] + '],\n';
			else formattedValue += splitValue[0] + ": [" + splitValue[1] + ',' + splitValue[2] + ']';
		}
	}
	return formattedValue;
}

function isError(body, date) {
	var splitRanges = ranges(body, true);
	for (var i = 0; i < splitRanges.length; i++) {
		if (splitRanges[i].split(',')[0] == date) {
			return false;
		}
	}
	return true;
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
			res.writeHead(httpres.statusCode, httpres.headers);
			res.end(formattedjs);
		});
	});
	httpreq.end();
});

app.get("/:tickersymbol/:date/:timespan", function(req, res) {
	var tickersymbol = req.params.tickersymbol;
	var date = req.params.date;
	var timespan = req.params.timespan;
	formattedjs = 'window.YSTOKJSDAT = {\n';
	var options = {
		hostname: 'chartapi.finance.yahoo.com',
		port: 80,
		path: '/instrument/1.0/' + tickersymbol + '/chartdata;type=quote;range=15d/csv',
		method: 'GET'
	};
	var httpreq = http.request(options, function(httpres) {
		var body;
		httpres.on('data', function(chunk) {
			body += chunk;
		});
		httpres.on('end', function() {
			if (isError(body, date)) {
				formattedjs +=
					'status: "ERROR",\n' +
					'detail: "Data is available only for the most recent 15 market days."\n' +
				'};';
			} else {
				formattedjs += 
					'symbol: "' + tickersymbol + '",\n' +
					'name: "' + getValues(body, "Company-Name", "Exchange") + '",\n' +
					'span: "' + timespan + '",\n' +
					'unit: "' + getValues(body, "unit", "time") + '",\n' +
					'ranges: {\n' +
						getDateRanges(timespan, body, date) + '\n' +
					'},\n' +
					'values: {\n' +
						getDateValues(timespan, body, date) + '\n' +
					'}\n' +
				'};';
			}
			res.writeHead(httpres.statusCode, httpres.headers);
			res.end(formattedjs);
		});
	});
	httpreq.end();
});

app.listen(3030);