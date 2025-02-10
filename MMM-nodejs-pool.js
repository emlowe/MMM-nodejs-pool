/* Module */

/* Magic Mirror
 * Module: MMM-nodejs-pool
 *
 * By Earle Lowe elowe@elowe.com
 * Apache Licensed.
 */

Module.register("MMM-nodejs-pool",{

	// Default module config.
	defaults: {
		hostname: "",
		initialLoadDelay: 0,
		updateInterval:  10 * 60 * 1000, // every 10 minutes
	},

	// Define start sequence.
	start: function() {
		this.loaded = false;
		this.poolData = null;

		this.sendSocketNotification("CONFIG", this.config);

		this.scheduleUpdate(this.config.initialLoadDelay);
	},

    getStyles: function() {
        return ['font-awesome.css', "MMM-nodejs-pool.css"];
    },

	getData: function() {
		Log.info("MMM-nodejs-pool Getting Data");
		this.sendSocketNotification("GET_DATA");
	},

	socketNotificationReceived: function(notification, payload) {
		if (notification === "POOL_DATA") {
			this.poolData = JSON.parse(payload);
			this.loaded = true;
			this.updateDom();
		} else if (notification === "POOL_ERROR") {
			this.loaded = false;
			this.updateDom();
		}
		this.scheduleUpdate()
	},

	// Override dom generator.
	getDom: function() {

		var wrapper = document.createElement("div");

		if (!this.loaded) {
			wrapper.innerHTML = "Getting Data";
			wrapper.className = "dimmed light small";

			return wrapper;
		}

		wrapper.className = "MMM-nodejs-pool";

		var large = document.createElement("div");
		large.className = "medium light";

		if (this.poolData) {
			poolStatus = this.poolData.circuits[5].isOn;
			spaStatus = this.poolData.circuits[0].isOn;
			var poolString = "";

			var poolTemp = document.createElement("span");

			if (poolStatus == 1) {
				poolTemp.className = "bright poolTemp";
				poolString = "Pool is On: " + this.poolData.temps.bodies[0].temp + "&deg;";
					
			} else if (spaStatus == 1) {
				poolTemp.className = "bright poolTemp";
				spaString = "Spa is On: " + this.poolData.temps.bodies[1].temp + "&deg;";
			} else {
				poolTemp.className = "dimmed poolTemp";
				poolString = "Pool is Off";
			}

			poolTemp.innerHTML = poolString;
			large.appendChild(poolTemp);

			if (poolStatus == 1 || spaStatus == 1) {	
				// Add in Pump Speed
				var pumpWatts = this.poolData.pumps[0].rpm;
				var pumpSpeed = this.poolData.pumps[0].watts;
	
				var pumpInfo= document.createElement("div");
				pumpInfo.className = "bright small pumpInfo";
				pumpInfo.innerHTML = "Pump: " + pumpWatts + " Watts, " + pumpSpeed + " RPM";
					
				large.appendChild(pumpInfo);

/*
				if (this.tempData) {
					// Show Pool heater information
					var heatInfo = document.createElement("div");
					if (this.tempData.temperature.heaterActive == 0) {
						heatInfo.className = "dimmed small heatInfo";
						heatInfo.innerHTML = "Heat is off";
					} else {
						heatInfo.className = "bright small heatInfo";
						heatInfo.innerHTML = "Heat is on";
					}
					large.appendChild(heatInfo);
				}
*/
			}

			var airsolTemp = document.createElement("div");
			airsolTemp.className = "light medium airsolTemp";
			large.appendChild(airsolTemp);

			var airTemp = document.createElement("span");
			airTemp.innerHTML = "Air: " + this.poolData.temps.air + "&deg; ";
			airsolTemp.appendChild(airTemp);

//			var solTemp = document.createElement("span");
//			solTemp.className = "solTemp";
//			solTemp.innerHTML = "Solar: " + this.poolData.temperature.solarTemp + "&deg;";
//			airsolTemp.appendChild(solTemp);
		}

		wrapper.appendChild(large);
		return wrapper;
	},

	notificationReceived: function(notification, payload, sender) {
		if (notification === "DOM_OBJECTS_CREATED") {	
			this.updateDom();
		}
	},

	scheduleUpdate: function(delay) {
		var nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}

		var self = this;
		setTimeout(function() { self.getData(); }, nextLoad);
	},

});

