require(["jquery",
        "splunkjs/mvc", 
        "splunkjs/mvc/simplexml/ready!",
        "/static/app/betterpdf/jquery.imagemapster.js",
        ], 
    function($) {
/*
$('img').mapster({ 
        fillOpacity: 0.4,
        fillColor: "d42e16",
        stroke: true,
        strokeColor: "3320FF",
        strokeOpacity: 0.8,
        strokeWidth: 4,
        singleSelect: true,
        mapKey: 'name',
        listKey: 'name',                 
                 });
*/

/*
$("#tablestyles").click(function(){
                        console.log("imagemap clicked");
                    });
*/


const popable = document.querySelectorAll('.style');
const popup = document.querySelector('.popup');
let lastClicked;

popable.forEach(elem => elem.addEventListener('click', togglePopup));

function togglePopup(e) {
  console.log("imagemap clicked");
  console.log(e.target.getAttribute("name"));
  document.getElementById("tablestyles_setting").value = e.target.getAttribute("name");
}



});