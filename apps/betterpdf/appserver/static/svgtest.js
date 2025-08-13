require(["jquery",
        "splunkjs/mvc", 
        "splunkjs/mvc/simplexml/ready!",
        "/static/app/betterpdf/svg.min.js"
        ], 
    function($) {

splunkjs.mvc.Components.getInstance("submitted").on("change", function(changeEvent) { //change:chart
    
    var submittedTokens = splunkjs.mvc.Components.getInstance("submitted")
    console.log("updating...")
    const url='/splunkd/__raw/services/mini?savedsearch='+submittedTokens.attributes.dataset+submittedTokens.attributes.chart+'&svgfile'
    /*var draw = SVG().addTo('#preview')*/
    var draw = SVG('#preview')
    draw.clear()
    var request = new XMLHttpRequest();

    request.open('GET', url, true);

    request.onload = function() {
    if (request.status >= 200 && request.status < 400) {
        // Success!
        let data = request.responseText;
        //console.log(data); // raw content of the GET request
        draw.svg(data);
    } else {
        // We reached our target server, but it returned an error
        console.error('Server returned an error');
    }
    };

    request.onerror = function() {
    // There was a connection error of some sort
    console.error('Connection error');
    };

    request.send();    
    /* $("#token2listen").html("<p>Token Value: " + changeEvent.changed.token2 + "</p>") */
})

    })