var express = require("express");
var app = express();
var http = require("http");

function getValues(string, title, end, newLine, c) {
	/*var betweenString = string.match(title + "(.*)" + end);
	console.log(betweenString);*/
	//console.log(title + "(.*)" + end);
	var testRE;
	if (c) testRE = JSON.stringify(string).match(title + ":" + "(.*)" + end);
	else testRE = JSON.stringify(string).match(title + ":" + "(.*)" + end);
	//console.log(testRE[1].replace("\\n", ""));
	if (newLine) return(testRE[1]);
	else return(testRE[1].replace("\\n", ""));
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
			var range = getValues(body, "range", "Timestamp:", false, true);
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
	console.log(values.length);
	console.log(values[values.length - 2]);
	var formattedValue = "";
	for (var i = 1; i < values.length - 1; i++) {
		var splitValue = values[i].split(',');
		if (i != values.length - 2) formattedValue += splitValue[0] + ": " + splitValue[1] + ',\n';
		else formattedValue += splitValue[0] + ": " + splitValue[1];
		//console.log(splitValue);
	}
	return formattedValue;
}

app.get("/:tickersymbol/:timespan", function(req, res) {
	var tickersymbol = req.params.tickersymbol;
	var timespan = req.params.timespan;
	var formattedjs = 'window.YSTOKJSDAT = {\n';
	console.log("Ticker Symbol: " + tickersymbol + " Time span: " + timespan);
	console.log('/instrument/1.0/' + tickersymbol + '/chardata;type=quote;range=' + timespan + '/csv');
	var options = {
		hostname: 'chartapi.finance.yahoo.com',
		port: 80,
		path: '/instrument/1.0/YUM/chartdata;type=quote;range=5d/csv',
		method: 'GET'
	};
	console.log("After options");
	var httpreq = http.request(options, function(httpres) {
		console.log("After http request");
		var body;
		httpres.on('data', function(chunk) {
			body += chunk;
		});
		httpres.on('end', function() {
			formattedjs += 'symbol: "' + tickersymbol + '",\n' +
				'name: "' + getValues(body, "Company-Name", "Exchange", false, true) + '",\n' +
				'span: "' + timespan + '",\n' +
				'unit: "' + getValues(body, "unit", "timezone", false, true) + '",\n' +
				'ranges: {\n' +
					getRanges(timespan, body) + '\n' +
				'},\n' +
				'values: {\n' +
					getValuesItems(body) + '\n' +
				'}\n' +
			'};';
			getValuesItems(body);
			console.log(formattedjs);
			console.log("-------------");
			console.log("-------------");
			res.writeHead(httpres.statusCode, httpres.headers);

			res.end(body);
		});
	});
	httpreq.end();
});

app.listen(3030);