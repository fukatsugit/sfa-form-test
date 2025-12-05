function openForm(rstr, cid, fid) {
  if(!rstr || !cid || !fid) {
    return false;
  }
  var fname = gfe(fid);
  var m = 'https://local.next-cloud.jp:8010/sfa/forms/replace';
  var cn = 'nsfatr_uc';

  //uc localStorage check
  var p_uc = 0;
  var uc;
  if(localStorage.getItem(cn)) {
    if(uc) {
      p_uc = localStorage.getItem(cn);
    } else {
      uc = localStorage.getItem(cn);
    }
  } else {
    if(!uc) {
      uc = guc();
    }
  }
  localStorage.setItem(cn, uc);

  var head = document.getElementsByTagName('head')
  var script = document.createElement('script')
  script.setAttribute('src', 'https://code.jquery.com/jquery-1.12.4.min.js')
  script.setAttribute('type', 'text/javascript')
  script.addEventListener('load', function() {
    $(function() {
      $.ajax({
        url: m,
        type: 'POST',
        data: {
          'rstr': rstr,
          'cid': cid,
          'fid': fid,
          'host': location.host,
          'href': location.origin + location.pathname,
          'uc': uc,
          'ua': navigator.userAgent
        },
        crossDomain: false,
        cache: false,
        success: function(data){
          if(isJson(data)) {
            var json_data = $.parseJSON(data);
            console.log(json_data);
          } else {
            $("form#" + fname).replaceWith(data);
          }
        },
        error: function(data){
          console.log(data);
        },
      });
    })
  })
  document.head.appendChild(script)
};
function isJson(arg) {
  arg = (typeof(arg) == "function") ? arg() : arg;
  if(typeof(arg) != "string"){return false;}
  try{arg = (!JSON) ? eval("(" + arg + ")") : JSON.parse(arg);return true;}catch(e){return false;}
}
function guc(){
  var strong = 1000;
  return new Date().getTime().toString(16)  + Math.floor(strong*Math.random()).toString(16)
}
function gfe(fid) { 
  return "sfaForm_" + fid;
}
