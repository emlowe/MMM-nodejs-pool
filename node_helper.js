/* Magic Mirror
 * 
 * Node Helper for MMM-nodejs-pool module
 *
 * Earle Lowe elowe@elowe.com
 * Apache License
 */
const NodeHelper = require('node_helper');
const request = require('request');

module.exports = NodeHelper.create({
        
    start: function() {
        console.log("Starting module: " + this.name);
    },

    getPoolData: function() {
        var url = "http://" + this.config.hostname + "/circuit";
        request({
            url: url,
            method: 'GET',
            headers: {
                'User-Agent': 'MagicMirror/1.0'
            }
        }, (error, response, body) => {
            if (!error && response.statusCode == 200) {
				var self=this;
				self.sendSocketNotification("POOL_DATA", body) ;
			}
        });
    },

	getTempData: function() {
        var url = "http://" + this.config.hostname + "/temperature";
        request({
            url: url,
            method: 'GET',
            headers: {
                'User-Agent': 'MagicMirror/1.0'
            }
        }, (error, response, body) => {
            if (!error && response.statusCode == 200) {
				var self=this;
				self.sendSocketNotification("TEMP_DATA", body);
			}
        });
	},
    
	getPumpData: function() {
        var url = "http://" + this.config.hostname + "/pump";
        request({
            url: url,
            method: 'GET',
            headers: {
                'User-Agent': 'MagicMirror/1.0'
            }
        }, (error, response, body) => {
            if (!error && response.statusCode == 200) {
				var self=this;
				self.sendSocketNotification("PUMP_DATA", body);
			}
        });
	},
    
	getData: function() {
		this.getPoolData();
		this.getPumpData();
		this.getTempData();
	},
    
    socketNotificationReceived: function(notification, payload) {
        if (notification === "CONFIG") {
            this.config = payload;
        } else if (notification === "GET_DATA") {
            this.getData();
        }
    }

});

