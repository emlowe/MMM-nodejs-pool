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

    getAllData: function() {
        var url = "http://" + this.config.hostname + "/all";
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
			} else {
				var self=this;
				self.sendSocketNotification("POOL_ERROR", response) ;
			}
        });
    },

	getData: function() {
		this.getAllData();
	},
    
    socketNotificationReceived: function(notification, payload) {
        if (notification === "CONFIG") {
            this.config = payload;
        } else if (notification === "GET_DATA") {
            this.getData();
        }
    }

});

