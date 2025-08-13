require(["jquery", "splunkjs/mvc", "splunkjs/mvc/simplexml/ready!"], function (
  $
) {
  // add save button
  $("#headersettings_submit").append(
    $('<button class="btn btn-primary">save settings</button>').click(
      function () {
        //save settings
        submitconfig();
        // The require will let us tell the browser to load Modal.js with the name "Modal"
        require(["jquery", "/static/app/betterpdf/Modal.js"], function (
          $,
          Modal
        ) {
          // Now we initialize the Modal itself
          var myModal = new Modal("modal1", {
            title: "Settings saved...",
            backdrop: "static",
            keyboard: false,
            destroyOnHide: true,
            type: "normal",
          });
          myModal.body.append(
            $(
              '<p>You have saved your settings.<br/>You can test the settings by clicking on the sample report:<br/><br/><b><a href="/en-GB/splunkd/__raw/services/betterpdf?savedsearch=spreadsheet%20examples%20-%20chart%3Dpie&amp;chart=pie&amp;title=Eventcount%20by%20index" target="_blank"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABmJLR0QA/wD/AP+gvaeTAAADe0lEQVRoge2Z+28UVRTHP3e2SzZrt6FuqKGlFkPolq7Y3YxGCNXUKGgCTrZSEImJJgRT5XcT/wYTfzPEABUfaOIj3aVb8TcfBSNofNCaBoOtQR71QWzTNqGtM8cfCkPLPpzp7rLdOJ+f5u4599zzzb1n7t474OHh4VFOVKkCGymj3hKlI0oHdAV6X2eyvtjjVBUaoOOzjqrQZCgilqYDOqJagbhlEV7oJ4UOlANXAoyUERLT12YpaVVKogK6mkAXUYES5fef5BSwPb29VptdERUlOqAL6JZFC0o0BSCqdOvPBTlz2NGbKNWsu0aUnOpPpNqz2bTbncxSUKK25LJVhIB8eALKTcH7gBv6Er3285PJzozfbuWGTz7+PzNgrNvB/o377Par377GlxcH7HbNihoObTtIsCoIQM/QUXrPp4qYanYcC+gfOcHWpsdYW9MEwJ7ILgYunURErrd328lfmLxA30g6I0a2JeFkmeTD8RIyxeTQ4BG73Rhq5IG77gegLljHE/dsA0AQ3vjxMP9YZkGJOcVVEZ/9c5Cvr5xm0+oHAdgd6eLM2Dc8u2Evfs0PwOe/fcHZvwaz9l8WRXxk6E1mzTkAIrXNtDdsoWPNwwBMz03TM/SW25AF4VrA2PTvJBcU54FYN0rN/6V6d/g9xmfGi5edA5a0D3z488c82vQI4UCYan81ACMTI3wy+mnefmUt4oX4tMxu1f6QXQe3kyXNwPPR5wgH5g9cf18bpzawkrrgKrqan+LY8Ps5+y2LIr43HOXxtVsBmDFneP2Hg7Zt5/pOGqqLfuzNiysBfs3PS7FubpzFjv+S5vTYGb7743vb3n3fC8XPMg+ultDTkV00htYAMDU3Re/5JABHf3qb+KoYSilidW081NDOwKWTGf3LWsRNNXezc/3NwT449xGTs1MAjE78yqnLX9m2/Rv3cYc/WFBiTnE0A0opDrS9SJU273712lX6R08s8nln+Bib6zfhUz5qAyt5pmUPhwd7FvmUoogdCRARXh54Ja/P5akrJFJdTsIVlYo/D1TEtQpAujOZNdeKnwFPQLmpFAGZu+J1cr5GxT93562XuwpaKEB0rkIsBFcBjZQRMi2tWSmJclOUjsPr9bILyMbCDxzK0lplXtxmWPyBA5apgKwIyjhurDNNX1wpiQMxlMTTidTqkozn4eHhUTb+BUydE0J6m5sDAAAAAElFTkSuQmCC"></img>Test using a sample report.</a></b></p>',
            ),
          );
          myModal.footer.append(
            $("<button>")
              .attr({
                type: "button",
                "data-dismiss": "modal",
              })
              .addClass("btn btn-primary")
              .text("Close")
              .on("click", function () {
                doAsyncTaskGet(); // refresh
              }),
          );
          myModal.show(); // Launch it!
        });
      },
    ),
  );

  console.log("savebutton done");

  // set all stati
  console.log("set input status");
  doAsyncTaskGet();
  console.log("set input status done");

  getLogo();

  //imagemap
  const popable = document.querySelectorAll(".style");
  let lastClicked;

  popable.forEach((elem) => elem.addEventListener("click", settablestyle));

  function settablestyle(e) {
    console.log("imagemap clicked");
    console.log(e.target.getAttribute("name"));
    document.getElementById("tablestyles_setting").value =
      e.target.getAttribute("name");
  }
});

//save settings
async function submitconfig() {
  const url =
    "/splunkd/__raw/services/betterpdf?update_config&" +
    new URLSearchParams({
      uselogo: document.getElementById("uselogo").checked,
      margins_top: document.getElementById("margins_top").value,
      margins_bottom: document.getElementById("margins_bottom").value,
      margins_left: document.getElementById("margins_left").value,
      margins_right: document.getElementById("margins_right").value,
      paper: document.getElementById("paper").value,
      orientation: document.getElementById("orientation").value,
      font: document.getElementById("font").value,
      fontsize: document.getElementById("fontsize").value,
      output_mode: "json",
    }).toString();

  const result = await fetch(url).then((response) => response.json());

  console.log("Fetched from: " + url);
  console.log(result);
}

// refresh the preview image
function previewFile() {
  console.log("invoke previewFile");
  console.log("done previewFile");
}

// gather current settings
async function doAsyncTaskGet() {
  const url =
    "/splunkd/__raw/services/configs/conf-betterpdfformating?" + // /services/Spreadsheet?get_config
    new URLSearchParams({
      output_mode: "json",
    }).toString();

  const result = await fetch(url).then((response) => response.json());

  console.log("Fetched from: " + url);
  console.log(result.entry[0].content);

  //set inputs to current settings
  if (result.entry[0].content.uselogo == 0) {
    document.getElementById("uselogo").checked = false;
  } else {
    document.getElementById("uselogo").checked = true;
  }
  document.getElementById("margins_top").value =
    result.entry[0].content.margins_top;
  document.getElementById("margins_bottom").value =
    result.entry[0].content.margins_bottom;
  document.getElementById("margins_left").value =
    result.entry[0].content.margins_left;
  document.getElementById("margins_right").value =
    result.entry[0].content.margins_right;
  document.getElementById("paper").value = result.entry[0].content.paper;
  document.getElementById("font").value = result.entry[0].content.font;
  document.getElementById("fontsize").value = result.entry[0].content.fontsize;
  document.getElementById("orientation").value =
    result.entry[0].content.orientation;
}

// fetch current logo
async function getLogo() {
  const logourl = "/splunkd/__raw/services/betterpdf?get_logo";

  const result = await fetch(logourl).then((response) => response.json());

  console.log("Fetched from: " + logourl);
  console.log(result.entry[0].content);

  document.getElementById("currentlogo").src =
    "data:image/png;base64," + result.entry[0].content.img;

  document.getElementById("currentlogo").addEventListener("click", function () {
    upload_logo();
  });
}

function upload_logo() {
  // The require will let us tell the browser to load Modal.js with the name "Modal"
  require(["jquery", "/static/app/betterpdf/Modal.js"], function ($, Modal) {
    // setup file reader
    console.log("set file reader up");
    const reader = new FileReader();
    console.log(reader);
    console.log("set file reader up done");

    // add upload image as logo
    console.log("uploadebutton");

    var filebrowsebutton = document.createElement("input");
    filebrowsebutton.id = "browse";
    filebrowsebutton.name = "browse";
    filebrowsebutton.type = "file";

    // Now we initialize the Modal itself
    var myModal = new Modal("modal1", {
      title: "Select image to upload...",
      backdrop: "static",
      keyboard: false,
      destroyOnHide: true,
      type: "normal",
    });
    myModal.body.append($("<p><div id=imguploader/></p>"));

    myModal.footer.append(
      $("<button>")
        .attr({
          type: "button",
          "data-dismiss": "modal",
        })
        .addClass("btn btn-primary")
        .text("upload")
        .on("click", function () {
          //upload stuff
          console.log("upload pressed");
          const reader = new FileReader();
          console.log("reader");
          console.log(reader);
          console.log("document file 0");
          console.log(document.getElementById("browse").files[0]);
          console.log("read as data url");
          reader.readAsDataURL(document.getElementById("browse").files[0]);
          reader.onload = function (e) {
            var rawLog = reader.result;
            console.log("rawlog ready");
            //console.log(rawLog);
            var base64result = reader.result.split(",")[1];
            //console.log(base64result);
            const url =
              "/splunkd/__raw/services/betterpdf?install_logo=" +
              encodeURIComponent(base64result);
            const result = fetch(url).then((response) => response.json());
            console.log("Fetched from: " + url);
            console.log(result);
            getLogo();
          };
          //refresh img in main view
          getLogo(); // refresh
        })
    );

    myModal.body.append(filebrowsebutton);

    myModal.show(); // Launch it!
  });
}