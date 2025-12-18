// GitHub用フォーム送信スクリプト
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
          } else {
            $("form#" + fname).replaceWith(data);
            setupFormSubmit(fid);
          }
        },
        error: function(xhr, status, error){
          alert('フォームの読み込みに失敗しました。');
        },
      });
    })
  })
  document.head.appendChild(script)
}

// フォーム送信処理のセットアップ
function setupFormSubmit(form_id) {
  var common_url = "https://local.next-cloud.jp:8010/sfa/forms/";
  
  // 送信ボタンのクリックイベント
  var buttonSelector = "button[sfa-button-element-name='submit'][sfa-submit-button-id='" + form_id + "']";
  
  $(document).on('click', buttonSelector, function(event) {
    event.preventDefault();
    
    var $button = $(this);
    $button.attr('disabled', true);
    
    var form_element = "#sfaForm_" + form_id;
    var form_lable_button = "span[sfa-button-label-name='" + form_id + "']";
    var form_sending_lable_button = "span[sfa-button-sending-label-name='" + form_id + "']";
    
    // バリデーションチェック
    var validate_result = true;
    
    // validationEngineが読み込まれている場合のみ実行
    if(typeof $.fn.validationEngine !== 'undefined') {
      validate_result = $(form_element).validationEngine('validate');
    } else {
      // 必須項目の簡易チェック
      var hasError = false;
      $(form_element).find('[class*="required"]').each(function() {
        if(!$(this).val()) {
          alert($(this).attr('name') + 'は必須項目です');
          hasError = true;
          return false;
        }
      });
      validate_result = !hasError;
    }
    
    if(validate_result) {
      // 送信中表示
      if($(form_sending_lable_button).length > 0) {
        $(form_lable_button).css('display', 'none');
        $(form_sending_lable_button).css('display', 'block');
      }
      
      var $form = $(form_element);
      var formData = new FormData($form[0]);
      
      // host と href を追加
      formData.append('host', location.host);
      formData.append('href', location.origin + location.pathname);
      
      // フォーム送信
      $.ajax({
        type: 'post',
        url: common_url + 'regist',
        data: formData,
        processData: false,
        contentType: false,
        crossDomain: false,
        cache: false,
        success: function(data){
          var result = $.parseJSON(data);
          
          if(result.result){
            // サンクスページ取得
            $.ajax({
              type: 'post',
              url: common_url + 'thanks',
              data: {
                'rstr': result.random_str,
                'cid': result.cid,
                'fid': result.fid,
                'host': location.host,
                'href': location.origin + location.pathname,
              },
              crossDomain: false,
              cache: false,
              success: function(html){
                $("div[sfa-form-area='" + form_id + "']").replaceWith(html);
              },
              error: function(data){
                alert('送信は完了しましたが、完了画面の表示に失敗しました。');
                $button.attr('disabled', false);
              },
            });
          } else {
            alert('送信に失敗しました: ' + (result.message || '不明なエラー'));
            $button.attr('disabled', false);
            if($(form_sending_lable_button).length > 0) {
              $(form_lable_button).css('display', 'block');
              $(form_sending_lable_button).css('display', 'none');
            }
          }
        },
        error: function(xhr, status, error){
          alert('送信に失敗しました。もう一度お試しください。');
          $button.attr('disabled', false);
          if($(form_sending_lable_button).length > 0) {
            $(form_lable_button).css('display', 'block');
            $(form_sending_lable_button).css('display', 'none');
          }
        },
      });
    } else {
      // バリデーションエラー
      setTimeout(function(){
        $button.attr('disabled', false);
      }, 1000);
    }
    
    return false;
  });
}

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
