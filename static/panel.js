(function(window) { 

	// comparator used to sort the connections by their connection time
	function connectionTimeComparator(a, b) {

		if (a.connectionTime < b.connectionTime) { return -1; }
		if (a.connectionTime > b.connectionTime) { return  1; }
		return 0;
	}

	// formats bytes as GB (two decimal points)
	function prettyBytes(byteCount) {
		return (Math.round((byteCount / 1000000000) * 100) / 100) + " GB";
	}

	// formats the diffrence of 'time' to the unix time beautiful (e.g. 12h 15m 16s)
	function prettyUnixTimeDuration(time) {

		var diff 		= Date.now() - time * 1000;
		var DAY_MS 		= 86400000;
		var HOUR_MS 	= 3600000;
		var MINUTE_MS 	= 60000;

		var days  = Math.floor(diff / DAY_MS); 
		diff -= DAY_MS * days;
		var hours = Math.floor(diff / HOUR_MS);
		diff -= HOUR_MS * hours;
		var minutes = Math.floor(diff / MINUTE_MS);
		diff -= MINUTE_MS * minutes;

		return (days > 0 ? days + "d " : "") + (hours > 0 ? hours + "h " : "") + minutes + "m";
	}

	// panel object
	function Panel(options) {

		var self = this;

		// default options
		var defaultOptions = {
			refreshRate: 10, // every x seconds
		}

		if(typeof options === "undefined") {
			options = {};
		}

		// override default option if option provided it
		if(typeof options.refreshRate !== "undefined") { 
			defaultOptions.refreshRate == options.refreshRate;
		}

		// store the options
		self.options = defaultOptions;

		// archive of older data to generate graphs
		self.dataArchive = [];

		// callbacks
		self.successCallback = function(){};
		self.failCallback 	 = function(){};
	}

	// Stores a callback function when requesting new data is successfull
	Panel.prototype.success = function(callback) {
		this.successCallback = callback;
	};

	// Stores a callback function when requesting new data failed
	Panel.prototype.fail = function(callback) {
		this.failCallback = callback;
	};

	// Sends a request to the server to get new data. Callback gets triggered when the data is recieved.
	Panel.prototype.requestNewData = function (callback) {

		var self = this;
		var xhr  = new XMLHttpRequest();

		xhr.onreadystatechange = function() {

			// skips every ready state except "DONE"
			if(this.readyState != 4) { 
				return;
			}

			// if the http response doesn't say "OK"
			if(this.status != 200) {
				self.failCallback("Recieved http status code " + this.status + ". Expected: 200.");
				return;
			}

			// checks if the response is valid json
			var obj;

			try {
				obj = JSON.parse(this.responseText);
			} catch(e) {
				self.failCallback("Parsing json failed. (" + e.name + ": " + e.message + ")");
				return;
			}

			// checks if the response is an error message
			if(typeof obj.error !== "undefined") {
				self.failCallback("Server returned an error: \"" + obj.error + "\".")
				return;
			}

			// read in new data
			var data = { 
				blockchain: {
					blockCount:  0,
					difficulty:  0.0,
					memoryUsage: 0,
				},
				connections: { 
					inbound:  [], 
					outbound: [],
				}
			};

			// blockchain info and remap property names to fir the server side names
			data.blockchain.blockCount  = obj.blockchainInfo.blocks;
			data.blockchain.difficulty  = obj.blockchainInfo.difficulty;
			data.blockchain.memoryUsage = obj.blockchainInfo.memoryUsage;

			// split connections in inbound and outbound and remap property names to fit the server side names
			for(var i = 0; i < obj.connections.length; i++) {

				var c = obj.connections[i];

				if(c.inbound) {
					data.connections.inbound.push({
						address: 		c.addr,
						bytesSent: 		c.bytessent,
						bytesRecieved: 	c.bytesrecv,
						connectionTime: c.conntime,
					});
				} else {
					data.connections.outbound.push({
						address: 	  	c.addr,
						bytesSent: 		c.bytessent,
						bytesRecieved: 	c.bytesrecv,
						connectionTime: c.conntime,
					});
				}
			}

			// sort the connections by its connection time
			data.connections.inbound.sort(connectionTimeComparator);
			data.connections.outbound.sort(connectionTimeComparator);

			// push the data object to the archive. 
			self.dataArchive.push(data);
			// trigger success callback and return the data.
			self.successCallback(data);
			return;
		};

		// send request
		xhr.open("GET", "./data", true);
		xhr.send();
	};

	// renders blockchain info
	Panel.prototype.renderBlockhainInfo = function() {

		var self = this;
		var info = self.dataArchive[this.dataArchive.length - 1].blockchain;

		var blockchainInfoTable = document.getElementById("blockchain-info");
		blockchainInfoTable.innerHTML = "<td>" + info.blockCount + "</td><td>" + info.difficulty + "</td><td>" + prettyBytes(info.memoryUsage) + "</td>";
	}

	// renders connections
	Panel.prototype.renderConnections = function() {

		var self = this;
		var conns = self.dataArchive[this.dataArchive.length - 1].connections;

		var inboundConnectionsTable  = document.getElementById("inbound-connections");
		var outboundConnectionsTable = document.getElementById("outbound-connections");
		var inboundHtml  = "";
		var outboundHtml = "";

		for(var i = 0; i < conns.inbound.length; i += 2) {
			var c1 = conns.inbound[i];
			var c2 = conns.inbound[i + 1];
			
			inboundHtml += "<tr><td>" + c1.address + "</td><td style='border-right: 1px rgb(230, 230, 230) solid;'>" + prettyUnixTimeDuration(c1.connectionTime) + "</td>";

			if(typeof c2 == "undefined") {
				inboundHtml += "</tr>";
				continue;
			}

			inboundHtml += "<td>" + c2.address + "</td><td>" + prettyUnixTimeDuration(c2.connectionTime) + "</td></tr>";
		}

		for(var i = 0; i < conns.outbound.length; i += 2) {
			var c1 = conns.outbound[i];
			var c2 = conns.outbound[i + 1];
			
			outboundHtml += "<tr><td>" + c1.address + "</td><td style='border-right: 1px rgb(230, 230, 230) solid;'>" + prettyUnixTimeDuration(c1.connectionTime) + "</td>";

			if(typeof c2 == "undefined") {
				outboundHtml += "</tr>";
				continue;
			}

			outboundHtml += "<td>" + c2.address + "</td><td>" + prettyUnixTimeDuration(c2.connectionTime) + "</td></tr>";
		}

		inboundConnectionsTable.innerHTML  = inboundHtml;
		outboundConnectionsTable.innerHTML = outboundHtml;
	};

	// call all render functions
	Panel.prototype.renderAll = function() {

		var self = this;

		self.renderBlockhainInfo();
		self.renderConnections();
	};
	
	window.DogePanel = Panel;

})(this);