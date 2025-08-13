
        // gather current settings
        async function doAsyncTaskGet() {
            //license details
            const license_status_url = ("../../splunkd/__raw/services/betterpdf?license_status");

            const licenseresult = await fetch(license_status_url)
                .then(response => response.json());

            console.log('Fetched from: ' + license_status_url);
            console.log(licenseresult.entry[0].content);

            //set inputs to current settings
            document.getElementById("licensestatus").innerHTML = "Status: " + licenseresult.entry[0].content.licensestatus;
            document.getElementById("installdate").innerHTML = "Installed on:" + licenseresult.entry[0].content.installdate;
            document.getElementById("cn").innerHTML = "Licensed to: " + licenseresult.entry[0].content.cn;
            document.getElementById("triallicense").innerHTML = "Triallicense: " + licenseresult.entry[0].content.triallicense;
            document.getElementById("validtill").innerHTML = "Valid till: " + licenseresult.entry[0].content.validtill;


            //cairo dependencies check details
            const test_url = ("../../splunkd/__raw/services/betterpdf?test");


            const testresult = await fetch(test_url)
                .then(response => response.json());

            console.log('Fetched from: ' + test_url);
            console.log(testresult.entry[0].content);

            //set inputs to current settings
            document.getElementById("libcairo").innerHTML = "Chart dependencies (libcairo): <b>" + testresult.entry[0].content.libcairo + "</b>";
        }


        doAsyncTaskGet();

$("#install_license").append($("<button class=\"btn btn-primary\" >Install license</button>").click(function() {
    // The require will let us tell the browser to load Modal.js with the name "Modal"
    require(['jquery',
        "/static/app/betterpdf/Modal.js"
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
        myModal.body
            .append($('<p>Please paste the license key below and make sure it includes the \"-----BEGIN LICENSE-----\" and \"-----END LICENSE-----\"</p></br><textarea id=\"licensestring\" name=\"licensestring\" rows=\"25\" cols=\"80\" style=\"height: 500px; width: 700px;\"></textarea>'));
        myModal.footer.append($('<button>').attr({
            type: 'button',
            'data-dismiss': 'modal'
        }).addClass('btn btn-primary').text('Submit').on('click', function() {
            console.log(encodeURIComponent(document.getElementById('licensestring').value));
            $.ajax({
                url: "/splunkd/__raw/services/betterpdf",
                data: {
                    "install_license": encodeURIComponent(document.getElementById('licensestring').value)
                },
                success: function(response) {
                    console.log("success");
                    //Do Something
                },
                error: function(xhr) {
                    console.log("failure");
                    //Do Something to handle error
                }
            });
        }))
        myModal.show(); // Launch it!
    })
}))