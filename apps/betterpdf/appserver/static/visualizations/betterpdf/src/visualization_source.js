/*
 * Visualization source
 */
define([
            'jquery',
            'underscore',
            'api/SplunkVisualizationBase',
            'api/SplunkVisualizationUtils'
            // Add required assets to this list
        ],
        function(
            $,
            _,
            SplunkVisualizationBase,
            //vizUtils,
            SearchManager
        ) {
 
    // Extend from SplunkVisualizationBase
    return SplunkVisualizationBase.extend({
  
        initialize: function() {
            SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
            this.$el = $(this.el);
            this.$el.append('<h3>Loading...</h3>');          
            // Initialization logic goes here
        },

        // Optionally implement to format data returned from search. 
        // The returned object will be passed to updateView as 'data'
        formatData: function(data) {

            // Format data 

            return data;
        },

        // Implement updateView to render a visualization.
        //  'data' will be the data object returned from formatData or from the search
        //  'config' will be the configuration property object
        updateView: function(data, config) {

            //console.log(data.meta.done)
            //console.log(config)
            
            const currentElement = this.el;
            // Using closest to find the first ancestor div with class "splunk_view"
            const parentDiv = currentElement.closest('.splunk-view');
            //const reportname = parentDiv.parentNode.parentNode.querySelector('.dashboard-element-title').innerText; //if we want to read the title of the panel

            if (parentDiv && data && data.meta && data.meta.done) { //we have our parentDiv and the job is done
                const splunkViewId = parentDiv.id;
                //console.log('Splunk View ID:', splunkViewId);
                //console.log('this listenid ID:', this._listenId);
                //mySIDs[this._listenId] = splunkjs.mvc.Components.attributes[splunkViewId].primaryManager.attributes.data.sid
                const mySID = splunkjs.mvc.Components.attributes[splunkViewId].primaryManager.attributes.data.sid
                //console.log("this panels' SID: "+ mySID);
                const charttype = config["display.visualizations.custom.betterpdf.betterpdf.charttype"]
                const chartstyle = config["display.visualizations.custom.betterpdf.betterpdf.chartstyle"]
                const fetchUri = '/splunkd/__raw/services/betterpdf?job=' + mySID + charttype +'&svgfile';
                //console.log(fetchUri);                
                console.log("Splunk View ID: "+ splunkViewId + " this panels' SID: " + mySID + " and charttype: " + charttype + " we feth this URI: " + fetchUri); 
                currentElement.innerHTML = '<h3>Loading...</h3>';

                fetch('/splunkd/__raw/services/betterpdf?job=' + mySID + charttype + chartstyle + '&svgfile&base64') //fetch(fetchUri+"&base64") //get the base64 encoded version for convenience
                    .then(response => {
                        // Check if response is successful
                        if (!response.ok) {
                            currentElement.innerHTML = "<h3>Something went wrong, please check the log.</h3>";
                            throw new Error('Network response was not ok');
                        }
                        // Return response as text
                        return response.text();
                    })
                    .then(reponseContent => {
                        // Set the content as the innerHTML of the container div
                        if (charttype == "&table=true") {
                            console.log(splunkViewId + ": we get a pdf table, size to 100%");
                            currentElement.innerHTML = "<embed src='" + reponseContent +"' width='100%' height='100%'/><br/>";
                            //this.$el.html("<embed src='" + reponseContent +"' width='100%' height='100%'/><br/>");
                            }
                        else {
                            console.log(splunkViewId + ": we get a svg string, size to 90% and add download as PDF link below");
                            currentElement.innerHTML = "<embed src='" + reponseContent +"' width='100%' height='90%'/><br/><a href='/splunkd/__raw/services/betterpdf?job=" + mySID + charttype + chartstyle + "' target='_blank'><img src='/splunkd/__raw/servicesNS/admin/betterpdf/static/appIcon.png'> Download as PDF</a>";
                            //this.$el.html("<embed src='" + reponseContent +"' width='100%' height='90%'/><br/><a href='"+fetchUri+"' target='_blank'><img src='/splunkd/__raw/servicesNS/admin/betterpdf/static/appIcon.png'> Download as PDF</a>");
                            };

                    })
                    .catch(error => {
                        // Handle errors
                        console.error('There was a problem with the fetch operation:', error);
                    });

                //end
            } else {
                console.log('No parent div with class "splunk_view" found or data.meta.done not yet initialized.');
            }
        },

        // Search data params
        getInitialDataParams: function() {
            return ({
                outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
                count: 10000
            });
        },

        // Override to respond to re-sizing events
        reflow: function() {}
    });
});