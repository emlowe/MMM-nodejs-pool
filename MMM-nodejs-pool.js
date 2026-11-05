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
		updateInterval: 2 * 60 * 1000, // every 2 minutes
		tempMin: 40, // left end of the temperature bar
		tempMax: 110, // right end of the temperature bar
	},

	// Define start sequence.
	start: function() {
		this.loaded = false;
		this.poolData = null;

		this.sendSocketNotification("CONFIG", this.config);

		this.scheduleUpdate(this.config.initialLoadDelay);
	},

	getStyles: function() {
		return ["font-awesome.css", "MMM-nodejs-pool.css"];
	},

	getData: function() {
		Log.info("MMM-nodejs-pool Getting Data");
		this.sendSocketNotification("GET_DATA", this.config);
	},

	socketNotificationReceived: function(notification, payload) {
		if (notification === "POOL_DATA") {
			try {
				this.poolData = JSON.parse(payload);
				this.loaded = true;
			} catch (e) {
				Log.error("MMM-nodejs-pool: could not parse pool data: " + e.message);
				this.loaded = false;
			}
			this.updateDom();
		} else if (notification === "POOL_ERROR") {
			this.loaded = false;
			this.updateDom();
		}
		this.scheduleUpdate();
	},

	// Create an element with a class and optional text.
	el: function(tag, className, text) {
		var node = document.createElement(tag);
		if (className) {
			node.className = className;
		}
		if (text !== undefined) {
			node.textContent = text;
		}
		return node;
	},

	// Pressure cleaner: a debris bag above two wheels.
	cleanerIcon: function() {
		var ns = "http://www.w3.org/2000/svg";
		var icon = document.createElementNS(ns, "svg");
		icon.setAttribute("class", "pool-cleaner-icon");
		icon.setAttribute("viewBox", "0 0 24 24");
		icon.setAttribute("aria-hidden", "true");

		var add = function(tag, className, attributes) {
			var shape = document.createElementNS(ns, tag);
			shape.setAttribute("class", className);
			Object.keys(attributes).forEach(function(name) {
				shape.setAttribute(name, attributes[name]);
			});
			icon.appendChild(shape);
		};

		add("path", "pool-cleaner-line", { d: "M3.5 2.5H12c2.700 0 4 1.800 4 4.500v2.500h-2V14h-4V9.500H7c-2.200 0-3.500-2-3.500-7z" });
		[6.2, 17.8].forEach(function(x) {
			add("circle", "pool-cleaner-line", { cx: x, cy: 17.5, r: 4.6 });
			add("circle", "pool-cleaner-hub", { cx: x, cy: 17.5, r: 1.2 });
		});
		return icon;
	},

	// Label for a stat, followed by its value: "Air 65°".
	stat: function(label, value, labelFirst) {
		var node = this.el("span");
		var labelNode = this.el("span", "pool-dim", label);
		var valueNode = document.createTextNode(value);
		if (labelFirst) {
			node.appendChild(labelNode);
			node.appendChild(document.createTextNode(" "));
			node.appendChild(valueNode);
		} else {
			node.appendChild(valueNode);
			node.appendChild(document.createTextNode(" "));
			node.appendChild(labelNode);
		}
		return node;
	},

	// Temperature bar with a set point marker.
	tempBar: function(body) {
		var range = this.config.tempMax - this.config.tempMin;
		var percent = function(value, min) {
			return Math.max(0, Math.min(100, ((value - min) / range) * 100));
		};

		var track = this.el("div", "pool-track");
		var fill = this.el("div", "pool-fill");
		fill.style.width = (typeof body.temp === "number" ? percent(body.temp, this.config.tempMin) : 0) + "%";
		track.appendChild(fill);

		if (typeof body.setPoint === "number") {
			var marker = this.el("div", "pool-marker");
			marker.style.left = percent(body.setPoint, this.config.tempMin) + "%";
			track.appendChild(marker);
		}
		return track;
	},

	// Heat status and set point lines for the stack beside the temperature.
	addHeatLines: function(status, body) {
		var heatStatus = body.heatStatus ? body.heatStatus.val : 0;
		var heatMode = body.heatMode ? body.heatMode.val : 0;
		var heatText = "Heat off";
		var heatClass = "pool-dim";
		if (heatStatus !== 0) {
			heatText = "Heating";
			heatClass = "pool-heating";
		} else if (heatMode !== 0) {
			heatText = "Heat on, idle";
		}

		status.appendChild(this.el("div", heatClass, heatText));
		if (typeof body.setPoint === "number") {
			status.appendChild(this.el("div", "pool-setpoint", "Set " + body.setPoint + "°"));
		}
	},

	// Override dom generator.
	getDom: function() {
		var wrapper = document.createElement("div");

		if (!this.loaded || !this.poolData) {
			wrapper.textContent = "Getting Data";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		var data = this.poolData;
		var bodies = (data.temps && data.temps.bodies) || [];
		var findBody = function(type) {
			return bodies.find(function(body) {
				return body.type && body.type.name === type;
			});
		};
		var pool = findBody("pool");
		var spa = findBody("spa");
		var cleaner = (data.circuits || []).find(function(circuit) {
			return circuit.name === "Cleaner";
		});
		var pump = (data.pumps || [])[0];

		// Spa takes priority: on a shared-body system it uses the same pump and heater.
		var active = spa && spa.isOn ? spa : (pool && pool.isOn ? pool : null);
		var isSpa = active !== null && active === spa;

		wrapper.className = "pool-panel" + (isSpa ? " pool-spa" : "") + (active ? "" : " pool-off");

		var head = this.el("div", "pool-head");
		head.appendChild(this.el("span", null, isSpa ? "Spa" : "Pool"));
		if (active) {
			var running = this.el("span", "pool-running");
			running.appendChild(this.el("i", "fa fa-check-circle"));
			running.appendChild(document.createTextNode(" Running"));
			head.appendChild(running);
		}
		wrapper.appendChild(head);

		var status = this.el("div", "pool-status");
		if (cleaner && cleaner.isOn) {
			var cleanerLine = this.el("div", "pool-cleaner");
			cleanerLine.appendChild(this.cleanerIcon());
			cleanerLine.appendChild(document.createTextNode(" Cleaner"));
			status.appendChild(cleanerLine);
		}

		var main = this.el("div", "pool-main");
		if (active) {
			// A body can report no reading, so fall back to a dash rather than "undefined".
			var hasTemp = typeof active.temp === "number";
			main.appendChild(this.el("div", "pool-temp", hasTemp ? active.temp + "°" : "—"));
			this.addHeatLines(status, active);
		} else {
			// The sensor reading goes stale with the pump off, so don't show it.
			main.appendChild(this.el("div", "pool-temp", "Off"));
		}
		main.appendChild(status);
		wrapper.appendChild(main);

		if (active) {
			wrapper.appendChild(this.tempBar(active));
		}

		var stats = this.el("div", "pool-stats");
		stats.appendChild(this.stat("Air", data.temps.air + "°", true));
		if (active && pump) {
			stats.appendChild(this.stat("rpm", String(pump.rpm), false));
			stats.appendChild(this.stat("W", String(pump.watts), false));
		}
		wrapper.appendChild(stats);

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
		clearTimeout(this.updateTimer);
		this.updateTimer = setTimeout(function() { self.getData(); }, nextLoad);
	},

});
