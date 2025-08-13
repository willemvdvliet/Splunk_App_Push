require(["jquery", 
        "splunkjs/mvc", 
        "splunkjs/mvc/simplexml/ready!"], 
    function($, mvc) {
    var defaultTokenModel = mvc.Components.get("default");
    var submitTokenModel = mvc.Components.get("submitted");
    $(document).on("change","#html_ta_licensestring",function(){
        var strComment=$(this).val();
        var strtokLicense=defaultTokenModel.get("tokLicense");
        if(strComment!=="" && strComment!==undefined){
            if(strtokLicense!==undefined || strtokLicense!==strComment){
                defaultTokenModel.set("tokLicense",strComment);
                submitTokenModel.set("tokLicense",strComment);
            }
        }else{
            defaultTokenModel.unset("tokLicense");
            submitTokenModel.unset("tokLicense");
        }
    });
});