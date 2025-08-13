require(["jquery",
        'underscore',
        "splunkjs/mvc", 
        "splunkjs/mvc/utils",
        "splunkjs/mvc/simplexml/ready!"
        ], 
    function($,
          _,
          mvc,
          utils,) {

function installlicense(SconfigData) {
            var service = mvc.createService({ owner: "nobody", app: "betterbdp" });
            service.request("/services/betterpdf","POST", {"action": "install_license"}, null, SconfigData, {'Content-Type': 'application/json'}, function(err, resp) {
         // Handle response    
         if(resp != null){
           if(resp.status == 200){  
             //do something
           } else {
             //do something with status !=200
           }
         }
         // Handle error
         if(err != null){
           //handle error
         }
       });

    }

// set all stati
console.log('set input status')
doAsyncTaskGet();
console.log('set input status done')

//save settings
function submitconfig() {
    // Store Splunk conf key/value pairs
    var service = mvc.createService({ owner: "nobody", app: "betterpdf" });
    service.request(
                "configs/conf-onedrive/Splunk Betterpdf OneDrive AlertAction",
                "POST",
                null,
                null,
                { 
                    clientid: document.getElementById("clientid").value,
                    domain: document.getElementById("domain").value
                },
                {"Content-Type": "application/json"},
                function(err, response) {
                    if (err != null) {
                        console.log("buhu")
                    }
                    else {
                        console.log("juhu")
                    }

            });

    var storagePasswords = service.storagePasswords();
    // Create a new secret
    storagePasswords.create({
        name: "onedrive_alert", 
        realm: "Splunk Betterspdf OneDrive AlertAction", 
        password: document.getElementById("password").value}, 
        function(err, storagePassword) {
        if (err) 
            {console.warn(err);}
        else {
        // Secret was created successfully
        console.log(storagePassword.properties());
        }
    });
}


$("#install_license").append($("<button class=\"btn btn-primary\" >Install license</button>").click(function() {
    // The require will let us tell the browser to load Modal.js with the name "Modal" v2
    require(['jquery',
        "/static/app/betterpdf/Modal.js",
    ], function($,
        Modal) {
        // Now we initialize the Modal itself
        var myModal = new Modal("install_license", {
            title: "Install license",
            backdrop: 'static',
            keyboard: false,
            destroyOnHide: true,
            type: 'wide'
        });
        $(myModal.$el).on("hide", function() {
            // Not taking any action on hide, but you can if you want to!
        })
        myModal.body.append($('<p>Please paste the license key below and make sure it includes the \"-----BEGIN LICENSE-----\" and \"-----END LICENSE-----\"</p></br><textarea id=\"licensestring\" name=\"licensestring\" rows=\"25\" cols=\"80\" style=\"height: 500px; width: 700px;\"></textarea>'));
        myModal.footer.append($('<button>').attr({
            type: 'button',
            'data-dismiss': 'modal'
        }).addClass('btn btn-primary').text('Submit').on('click', function() {
            console.log( encodeURIComponent(document.getElementById('licensestring').value) );
            /*
            $.ajax({
                url: "../../splunkd/__raw/services/spreadsheet",
                data: {"install_license": encodeURIComponent(document.getElementById('licensestring').value) },
                success: function(response) {
                    console.log("success");
                    //Do Something
                },
                error: function(xhr) {
                   console.log("failure");
                   //Do Something to handle error
                }
            });
            */
            installlicense( document.getElementById('licensestring').value );
        }))
        myModal.show(); // Launch it!
    })
}))

$("#update_onedrive_settings").append($("<button class=\"btn btn-primary\" >Update onedrive settings</button>").click(function() {
    //save settings
    submitconfig();
    // The require will let us tell the browser to load Modal.js with the name "Modal"
    require(['jquery',
        "/static/app/betterpdf/Modal.js",
    ], function($,
        Modal) {
        // Now we initialize the Modal itself
        var myModal = new Modal("modal1", {
            title: "Settings saved...",
            backdrop: 'static',
            keyboard: false,
            destroyOnHide: true,
            type: 'normal'
        });
        myModal.body
            .append($('<p>You have saved your settings.'));
        myModal.footer.append($('<button>').attr({
            type: 'button',
            'data-dismiss': 'modal'
        }).addClass('btn btn-primary').text('Close').on('click', function() {
            //doAsyncTaskGet(); // refresh
        }))
        myModal.show(); // Launch it!
    })
}))

})

// gather current settings
async function doAsyncTaskGet() {
  //license details
  const license_status_url = ( "../../splunkd/__raw/services/betterpdf?license_status");

  const licenseresult = await fetch(license_status_url)
    .then(response => response.json());

  console.log('Fetched from: ' + license_status_url);
  console.log(licenseresult.entry[0].content);
    
  //set inputs to current settings
  document.getElementById("licensestatus").innerHTML = "Status: " + licenseresult.entry[0].content.licensestatus;
  document.getElementById("installdate").innerHTML = "Installed on:" + licenseresult.entry[0].content.installdate;
  document.getElementById("cn").innerHTML = "Licensed to: " +licenseresult.entry[0].content.cn;
  document.getElementById("triallicense").innerHTML = "Triallicense: " + licenseresult.entry[0].content.triallicense;
  document.getElementById("validtill").innerHTML = "Valid till: " + licenseresult.entry[0].content.validtill;


  //onedrive details
  const onedrive_config_url = ( "../../splunkd/__raw/services/betterpdf?get_onedriveconfig" );


  const onedriveresult = await fetch(onedrive_config_url)
    .then(response => response.json());

  console.log('Fetched from: ' + onedrive_config_url);
  console.log(onedriveresult.entry[0].content);

  //set inputs to current settings
  document.getElementById("clientid").value = onedriveresult.entry[0].content.clientid;
  document.getElementById("domain").value = onedriveresult.entry[0].content.domain;
}