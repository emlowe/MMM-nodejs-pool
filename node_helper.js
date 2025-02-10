/* Magic Mirror
 * 
 * Node Helper for MMM-nodejs-pool module
 *
 * Earle Lowe elowe@elowe.com
 * Apache License
 */
const NodeHelper = require('node_helper');
const Log = require("logger");
const http = require('http');

module.exports = NodeHelper.create({
        
    start: function() {
                Log.log(`Starting node helper for: ${this.name}`);
    },

    getAllData: function() {
        var url = "http://" + this.config.hostname + "/state/all";

                http.get(url, (res) => {
                  let data = '';
                  res.on('data', (chunk) => {
                    data += chunk;
                  });
                  res.on('end', () => {
                        var self=this;
                        self.sendSocketNotification("POOL_DATA", data) ;
                  });
                
                }).on('error', (err) => {
                  Log.error(`Got error: ${err.message}`);
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

