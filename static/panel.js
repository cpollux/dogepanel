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

		// DOM elements
		self.el = {};

		// pause requesting new data and updating the view (successCallback doesn't get trigger. You have to call requestNewData to continue.)
		self.paused = false;
	}

	// Stores a callback function when requesting new data is successfull
	Panel.prototype.success = function(callback) {
		this.successCallback = callback;
	};

	// Stores a callback function when requesting new data failed
	Panel.prototype.fail = function(callback) {
		this.failCallback = callback;
	};

	// Get all DOM elements
	Panel.prototype.initElements = function() {

		var self = this;

		// blockchain info
		self.el.blockCount 		= document.getElementById("block-count");
		self.el.blockDifficulty = document.getElementById("block-difficulty");
		self.el.memoryUsage 	= document.getElementById("memory-usage");

		self.el.inboundConnectionCount  = document.getElementById("inbound-connection-count");
		self.el.outboundConnectionCount = document.getElementById("outbound-connection-count");
		self.el.sentByteCount 			= document.getElementById("sent-byte-count");
		self.el.recievedByteCount		= document.getElementById("recieved-byte-count");
		self.el.inboundConnections 		= document.getElementById("inbound-connections");
		self.el.outboundConnections 	= document.getElementById("outbound-connections");
	};

	// Sends a request to the server to get new data. Callback gets triggered when the data is recieved.
	Panel.prototype.requestNewData = function (callback) {

		var self = this;
		var xhr  = new XMLHttpRequest();

		// if panel is paused
		if(self.paused) {
			// do not trigger successCallback
			return;
		}

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
				networkInfo: {
					bytesSent: 0,
					bytesrecv: 0,
					connections: { 
						inbound:  [], 
						outbound: [],
					},
				}
			};

			// blockchain info and remap property names to fit server side names
			data.blockchain.blockCount  = obj.blockchainInfo.blocks;
			data.blockchain.difficulty  = obj.blockchainInfo.difficulty;
			data.blockchain.memoryUsage = obj.blockchainInfo.memoryUsage;

			// traffic info and remap property names to fit server side names
			data.networkInfo.bytesSent     = obj.networkInfo.totalbytessent;
			data.networkInfo.bytesRecieved = obj.networkInfo.totalbytesrecv;

			// split connections in inbound and outbound and remap property names to fit server side names
			for(var i = 0; i < obj.networkInfo.connections.length; i++) {

				var c = obj.networkInfo.connections[i];

				if(c.inbound) {
					data.networkInfo.connections.inbound.push({
						address: 		c.addr,
						bytesSent: 		c.bytessent,
						bytesRecieved: 	c.bytesrecv,
						connectionTime: c.conntime,
					});
				} else {
					data.networkInfo.connections.outbound.push({
						address: 	  	c.addr,
						bytesSent: 		c.bytessent,
						bytesRecieved: 	c.bytesrecv,
						connectionTime: c.conntime,
					});
				}
			}

			// sort the connections by its connection time
			data.networkInfo.connections.inbound.sort(connectionTimeComparator);
			data.networkInfo.connections.outbound.sort(connectionTimeComparator);

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

		self.el.blockCount.innerHTML 	  = info.blockCount;
		self.el.blockDifficulty.innerHTML = info.difficulty;
		self.el.memoryUsage.innerHTML	  = prettyBytes(info.memoryUsage);
	}

	// renders network info
	Panel.prototype.renderNetworkInfo = function() {

		var self = this;
		var data = self.dataArchive[this.dataArchive.length - 1];
		var conns = data.networkInfo.connections;

		var inConnCount  = 0;
		var outConnCount = 0;

		var inboundHtml  = "";
		var outboundHtml = "";

		for(var i = 0; i < conns.inbound.length; i++) {

			inConnCount++;
			var c = conns.inbound[i];
			inboundHtml += "<span class=\"badge badge-dark\">" + c.address + " <i>" + prettyUnixTimeDuration(c.connectionTime) + "</i></span> ";
		}

		for(var i = 0; i < conns.outbound.length; i++) {

			outConnCount++;
			var c = conns.outbound[i];
			outboundHtml += "<span class=\"badge badge-dark\">" + c.address + " <i>" + prettyUnixTimeDuration(c.connectionTime) + "</i></span> ";
		}

		self.el.inboundConnections.innerHTML  = inboundHtml;
		self.el.outboundConnections.innerHTML = outboundHtml;
		self.el.sentByteCount.innerHTML 	  = data.networkInfo.bytesSent;
		self.el.recievedByteCount.innerHTML   = data.networkInfo.bytesRecieved;
	};

	// call all render functions
	Panel.prototype.renderAll = function() {

		var self = this;

		// if paused, but the request was already sent
		if(self.paused) {
			return;
		}

		self.renderBlockhainInfo();
		self.renderNetworkInfo();
	};
	
	window.DogePanel = Panel;

})(this);