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
                  this.sendSocketNotification("POOL_ERROR", err.message);
                });
    },

        getData: function() {
                this.getAllData();
        },
    
    socketNotificationReceived: function(notification, payload) {
        // Config is sent with CONFIG and with every GET_DATA, so the helper
        // never depends on CONFIG having arrived first.
        if (payload && payload.hostname) {
            this.config = payload;
        }
        if (notification === "GET_DATA") {
            if (!this.config || !this.config.hostname) {
                Log.error("MMM-nodejs-pool: no hostname configured yet");
                return;
            }
            this.getData();
        }
    }

});

