// GitHub用フォーム送信スクリプト
function openForm(rstr, cid, fid) {
  console.log('=== openForm 開始 ===');
  console.log('rstr:', rstr, 'cid:', cid, 'fid:', fid);
  
  if(!rstr || !cid || !fid) {
    console.error('パラメータが不足しています');
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
    console.log('jQuery読み込み完了');
    $(function() {
      console.log('フォーム取得開始:', m);
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
          console.log('フォーム取得成功');
          if(isJson(data)) {
            var json_data = $.parseJSON(data);
            console.log('JSONレスポンス:', json_data);
          } else {
            console.log('フォームHTML取得、置き換え開始');
            $("form#" + fname).replaceWith(data);
            console.log('フォーム置き換え完了、送信イベント設定開始');
            setupFormSubmit(fid);
            console.log('送信イベント設定完了');
          }
        },
        error: function(xhr, status, error){
          console.error('フォーム取得エラー:', status, error);
          console.error('レスポンス:', xhr);
        },
      });
    })
  })
  document.head.appendChild(script)
}

// フォーム送信処理のセットアップ
function setupFormSubmit(form_id) {
  console.log('=== setupFormSubmit 開始 ===');
  console.log('form_id:', form_id);
  
  var common_url = "https://local.next-cloud.jp:8010/sfa/forms/";
  
  // 送信ボタンのクリックイベント
  var buttonSelector = "button[sfa-button-element-name='submit'][sfa-submit-button-id='" + form_id + "']";
  console.log('送信ボタンセレクタ:', buttonSelector);
  console.log('送信ボタン要素数:', $(buttonSelector).length);
  
  $(document).on('click', buttonSelector, function(event) {
    console.log('=== 送信ボタンクリック ===');
    event.preventDefault();
    
    var $button = $(this);
    $button.attr('disabled', true);
    
    var form_element = "#sfaForm_" + form_id;
    var form_lable_button = "span[sfa-button-label-name='" + form_id + "']";
    var form_sending_lable_button = "span[sfa-button-sending-label-name='" + form_id + "']";
    
    // バリデーションチェック
    console.log('バリデーション開始');
    var validate_result = true;
    
    // validationEngineが読み込まれている場合のみ実行
    if(typeof $.fn.validationEngine !== 'undefined') {
      validate_result = $(form_element).validationEngine('validate');
      console.log('バリデーション結果:', validate_result);
    } else {
      console.warn('validationEngineが読み込まれていないため、バリデーションをスキップします');
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
      console.log('フォーム送信開始:', common_url + 'regist');
      console.log('送信データ:', formData);
      
      $.ajax({
        type: 'post',
        url: common_url + 'regist',
        data: formData,
        processData: false,
        contentType: false,
        crossDomain: false,
        cache: false,
        success: function(data){
          console.log('=== 送信成功 ===');
          console.log('レスポンスデータ:', data);
          var result = $.parseJSON(data);
          console.log('パース結果:', result);
          
          if(result.result){
            console.log('送信結果OK、サンクスページ取得開始');
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
                console.log('サンクスページ取得成功');
                $("div[sfa-form-area='" + form_id + "']").replaceWith(html);
              },
              error: function(data){
                console.log('サンクスページ取得エラー:', data);
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
          console.log('送信エラー:', xhr, status, error);
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
