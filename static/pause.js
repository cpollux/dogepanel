(function(window) { 

	function PauseButton(id) {

		var self = this;
		self.button = document.getElementById(id);
		
		if(self.button === null) {
			self.failCallback("Could not find element with id '" + id + "'.");
			return;
		}

		// callbacks
		self.successCallback = function(){};
		self.failCallback 	 = function(){};
		self.clickCallback   = function(){};

		self.button.addEventListener("click", self.clickCallback);
	}

	PauseButton.prototype.success = function(callback) {
		this.successCallback = callback;
	};

	PauseButton.prototype.fail = function(callback) {
		this.failCallback = callback;
	};

	PauseButton.prototype.onClick = function(callback) {
		var self = this;
		self.clickCallback = callback;
		self.button.addEventListener("click", self.clickCallback);
	};

	PauseButton.prototype.text = function(text) {
		this.button.innerHTML = text;
	};

	window.PauseButton = PauseButton;

})(this);