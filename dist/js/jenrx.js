var localhost = "https://demo1.client.jeniosolutions.com";
var server = 'https://' + getStorage("settingsServer");
var directory_html = localhost + '/';
var directory_templates = directory_html + 'templates/';
var directory_php = localhost + '/php/';
var directory_py = server + '/';
var directory_db = localhost + '/db/database.db';
var rest_api_prosynapses = "https://api.prosynapses.org/";
var rest_api_jenrx = "https://api.jeniosolutions.com/";
var spinner = '<span class="col-xs-4 col-xs-offset-4"><center><p class="fa fa-refresh fa-spin spinner"></p></center></span>';
var spinner_placeholder = '<i class="fa fa-refresh fa-spin"></i>';

function loader(htmlID, loaderType, script, data, css, spin) {
  if (spin == true) {
    $('#' + htmlID).html(spinner);
  }
  else {

  }
  $('#' + htmlID).attr("class", css);
  logsLoader(htmlID, loaderType, script, data);
  if (loaderType == "templates") {
    var url = directory_templates + script + ".html";
    var dataType = "html";
    var type = "GET";
  }
  else if (loaderType == "php") {
    return (false);
    var url = directory_php + script + ".php";
    var dataType = "json";
    var type = "POST";
    if (script == "speech" && ($.parseJSON(getStorage("settingsAppVoiceResponse")) == false || $.parseJSON(getStorage("jenrxLicense")) != true)) {
      return (false);
    }
    else {

    }
  }
  else if (loaderType == "py") {
    var url = directory_py + script + '/';
    var dataType = "json";
    var type = "POST";
    if (script.toLowerCase().includes("backups")) {
      return (false);
    }
    if (script.toLowerCase().includes("license")) {
      url = localhost + ':7380/' + script + "/";
    }
  }
  else if (loaderType == "html") {
    var url = directory_html + script + ".html";
    var dataType = "html";
    var type = "GET";
    $(window).attr("location", url);
  }
  else if (loaderType == "popup") {
    var url = directory_templates + script + ".html";
    var dataType = "text html";
    var type = "GET";
  }
  else if (loaderType == "db") {
    return SQLDBQueryLoader(script, data, htmlID);
  }
  else if (loaderType == "api-prosynapses") {
    var url = rest_api_prosynapses + script + '/';
    var dataType = "json";
    var type = "POST";
  }
  else if (loaderType == "api-jenrx") {
    var url = rest_api_jenrx + script + '/';
    var dataType = "json";
    var type = "POST";
  }
  else {

  }
  scriptLoader(type, url, data, dataType, htmlID);
}

function scriptLoader(type, url, data, dataType, htmlID) {
  $.ajax({
    type: type,
    url: url,
    data: data,
    dataType: dataType,
    beforeSend: function() {
    },
    success: function(result) {
      resultHandler(dataType, result, htmlID);
    },
    error: function(xhr) {
      if (xhr.status == 0) {
        xhr.responseText = "Server Error.";
      }
      errorHandler(xhr, htmlID);
    },
    complete: function() {
      $("button").removeAttr("disabled");
      settingsApply();
    }
  });
}

function fileUploader(type, script, data, dataType, htmlID, spin) {
  if (spin == true) {
    $('#' + htmlID).html(spinner);
  }
  else {

  }
  var log_data = {}
  for ([key, value] of data.entries()) {
    log_data.file = value.name;
  }
  logsLoader(htmlID, "py", script, log_data);
  backupsLoader(script);
  var url = directory_py + script + '/';
  $.ajax({
    type: type,
    url: url,
    data: data,
    dataType: dataType,
    cache: false,
    contentType: false,
    processData: false,
    beforeSend: function() {
    },
    success: function(result) {
      resultHandler(dataType, result, htmlID);
    },
    error: function(xhr) {
      if (xhr.status == 0) {
        xhr.responseText = "Server Error.";
      }
      errorHandler(xhr, htmlID);
    },
    complete: function() {
      $("button").removeAttr("disabled");
      settingsApply();
    }
  });
}

function placeholder(htmlID) {
  $('#' + htmlID).html(spinner_placeholder);
  $('.' + htmlID).html(spinner_placeholder);
}

function SQLDBQueryHandler(query, script, data, htmlID) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", directory_db, true);
  xhr.responseType = "arraybuffer";
  xhr.onload = function(e) {
    var uInt8Array = new Uint8Array(this.response);
    var db = new SQL.Database(uInt8Array);
    var result = db.exec(query);
    if (script == "fetchAPI") {
      loadAPIOptions(result);
    }
    else if (script == "checkOD") {
      var a = 0;
      var oddata = Array();
      for (var i = 0; i < data.length; i++) {
        var listquery = 'SELECT single_dose, daily_dose FROM api WHERE api = "' + data[i].value + '"';
        var listresults = db.exec(listquery);
        if (listresults[0].values[0][0]) {
          if (data[i].single_dose > listresults[0].values[0][0]) {
            oddata[a] = '<i class="fa fa-ambulance text-danger"></i> Potential Drug Overdose Found in the Single Dose <code>' + data[i].single_dose + ' <small>(mg or ml)</small></code> of <code>' + data[i].name + ' (' + data[i].value + ')' + '</code><br> Recommended Maximum Single Dose: <code>' + listresults[0].values[0][0] + ' <small>(mg or ml)</small></code>';
            a++;
          }
        }
        if (listresults[0].values[0][1]) {
          if (data[i].daily_dose > listresults[0].values[0][1]) {
            oddata[a] = '<i class="fa fa-ambulance text-danger"></i> Potential Drug Overdose Found in the Daily Dose <code>' + data[i].daily_dose + ' <small>(mg or ml)</small></code> of <code>' + data[i].name + ' (' + data[i].value + ')' + '</code><br> Recommended Maximum Daily Dose: <code>' + listresults[0].values[0][1] + ' <small>(mg or ml)</small></code>';
            a++;
          }
        }
      }
      loadODResults(data, oddata);
    }
    else if (script == "checkDDI") {
      var a = 0;
      var b = 0;
      var c = 0;
      var ddidata = Array();
      var ddilist = Array();
      var diidata = Array();
      for (var i = 0; i < data.length; i++) {
        var listquery = 'SELECT ddi FROM api WHERE api = "' + data[i].value + '"';
        var listresults = db.exec(listquery);
        ddilist[b] = Array();
        ddilist[b]["drug"] = data[i].value;
        ddilist[b]["ddi"] = listresults[0].values[0][0];
        b++;
        for (var j = 0; j < data.length; j++) {
          if (data.length == 1 || i != j) {
            var ddiquery = 'SELECT api, ddi FROM api WHERE api = "' + data[i].value + '" AND ddi LIKE "%' + data[j].value + '%"';
            var ddiresults = db.exec(ddiquery);
            if (ddiresults.length > 0) {
              ddidata[a] = '<i class="fa fa-ambulance text-danger"></i> Potential Drug Interaction Found between <code>' + data[i].value + '</code> and <code>' + data[j].value + '</code>';
              a++;
            }
            var diiquery = 'SELECT title, severity, information FROM dii WHERE (title LIKE "%' + data[i].value + '%" AND title LIKE "%' + data[j].value + '%") OR information LIKE "%' + data[i].value + '%"';
            var diiresults = db.exec(diiquery);
            if (diiresults.length > 0) {
              for (var k = 0; k < diiresults[0].values.length; k++) {
                if (dii_title_check == undefined || dii_title_check != diiresults[0].values[k][0]) {
                  diidata[c] = Array();
                  diidata[c]["title"] = diiresults[0].values[k][0];
                  diidata[c]["severity"] = diiresults[0].values[k][1];
                  diidata[c]["information"] = diiresults[0].values[k][2];
                  c++;
                }
                var dii_title_check = diiresults[0].values[k][0];
              }
            }
          }
        }
      }
      loadDDIResults(data, ddidata, ddilist, diidata);
    }
    else if (script == "searchSTG") {
      var data_ = data[0].value;
      var split_data = data_.split(",");
      for (var i = 0; i < split_data.length; i++) {
        var data__ = split_data[i];
        var stgsearchquery = 'SELECT disease_classification, disease, introduction, clinical_features, differential_diagnoses, complications, investigations, treatment_objectives, drug_treatment, nondrug_treatment, adr_caution, prevention FROM stg WHERE disease_classification LIKE "%' + data__ + '%" OR disease LIKE "%' + data__ + '%" OR introduction LIKE "%' + data__ + '%" OR clinical_features LIKE "%' + data__ + '%" OR differential_diagnoses LIKE "%' + data__ + '%" OR complications LIKE "%' + data__ + '%" OR investigations LIKE "%' + data__ + '%" OR treatment_objectives LIKE "%' + data__ + '%" OR drug_treatment LIKE "%' + data__ + '%" OR nondrug_treatment LIKE "%' + data__ + '%" OR adr_caution LIKE "%' + data__ + '%" OR prevention LIKE "%' + data__ + '%"';
        var stgsearchresults = db.exec(stgsearchquery);
        if (data[0].type == "all" && i == split_data.length - 1) {
          var data__ = data_.replace(/,/g,'%');
          var combo = Array();
          for (var x = 0; x < split_data.length; x++) {
            combo_ =  '%' + split_data[x]  + '%';
            for (var y = 0; y < split_data.length; y++) {
              if (x != y) {
                combo_ += split_data[y] + '%';
              }
            }
            combo.push(combo_);
          }
          for (var x = 0; x < split_data.length; x++) {
            combo_ =  '%' + split_data[x]  + '%';
            for (var y = split_data.length - 1; y >= 0; y--) {
              if (x != y) {
                combo_ += split_data[y] + '%';
              }
            }
            combo.push(combo_);
          }
          var column = Array('disease_classification', 'disease', 'introduction', 'clinical_features', 'differential_diagnoses', 'complications', 'investigations', 'treatment_objectives', 'drug_treatment', 'nondrug_treatment', 'adr_caution', 'prevention');
          combo_query = " WHERE ";
          for (var a = 0; a < column.length; a++) {
            for (var b = 0; b < combo.length; b++) {
              combo_query += column[a] + ' LIKE "' + combo[b] + '"';
              if (b == combo.length - 1 && a == column.length - 1) {
                combo_query += "";
              }
              else {
                combo_query += " OR ";
              }
            }
          }
          var stgsearchquery = 'SELECT disease_classification, disease, introduction, clinical_features, differential_diagnoses, complications, investigations, treatment_objectives, drug_treatment, nondrug_treatment, adr_caution, prevention FROM stg' + combo_query;
          var stgsearchresults = db.exec(stgsearchquery);
        }
        loadSTGSearchResults(stgsearchresults, data, i);
      }
    }
    else {
      jQuery.globalEval(script);
    }
    return result;
  };
  xhr.onerror = function () {
    var xh = {};
    xh["statusText"] = "error";
    xh["responseText"] = "Database Error.";
    if (htmlID == "") {
      htmlID = "xh-content";
    }
    errorHandler(xh, htmlID);
  };
  xhr.send();
}

function SQLDBQueryLoader(script, data, htmlID) {
  if (script == "fetchAPI") {
    var query = "SELECT api FROM api ORDER BY api ASC";
  }
  else if (script == "checkOD") {
    var query = "";
    var reportData = { script: script, data: data, date: new Date(), app: getStorage("jenrxApp"), version: getStorage("jenrxVersion") };
    sendUsageReport(reportData);
  }
  else if (script == "checkDDI") {
    var query = "";
    var reportData = { script: script, data: data, date: new Date(), app: getStorage("jenrxApp"), version: getStorage("jenrxVersion") };
    sendUsageReport(reportData);
  }
  else if (script == "searchSTG") {
    var query = "";
    var reportData = { script: script, data: data, date: new Date(), app: getStorage("jenrxApp"), version: getStorage("jenrxVersion") };
    sendUsageReport(reportData);
  }
  else {

  }
  return SQLDBQueryHandler(query, script, data, htmlID);
}

function resultHandler(dataType, result, htmlID) {
  if (dataType == "html") {
    $('#' + htmlID).hide().html(result).fadeIn(1000);
  }
  else if (dataType == "json") {
    if (result.type == "text") {
      popupModal(result.status, result.response, "info", htmlID);
    }
    else if (result.type == "json") {
      if (result.status == "success") {
        popupModal(result.status, result.response, "success", htmlID);
      }
      else if (result.status == "failure") {
        xhr = result;
        xhr.statusText = result.status;
        xhr.responseText = result.response;
        errorHandler(xhr, htmlID);
      }
      else if (result.status == "background") {

      }
      else {

      }
    }
    else if (result.type == "background") {
      if (result.status == "failure") {
        xhr = result;
        xhr.statusText = result.status;
        xhr.responseText = result.response;
        errorHandler(xhr, htmlID);
      }
      else {
        $('#' + htmlID).hide().html("").fadeIn(1000);
      }
    }
    else {

    }
  }
  else if (dataType == "text html") {
    popupModal("", result, "default", htmlID);
  }
  else {

  }
  if (result.script !== undefined) {
    jQuery.globalEval(result.script);
  }
  else {

  }
  if (result.file !== undefined) {
    downloadFile(result.file);
  }
  else {

  }
}

function errorHandler(xhr, htmlID) {
  if (htmlID != "rep-content") {
    popupModal(xhr.statusText, xhr.responseText, "error", htmlID);
  }
}

function popupModal(head, content, type, htmlID) {
  var random_ID = Math.floor(Math.random() * 1000);
  var modalCloseButton = "btn-outline";
  var modalSize = "";
  if (type == "error") {
    var modalHeadClass = "modal-danger";
  }
  else if (type == "default") {
    var modalHeadClass = "";
    var modalCloseButton = "btn-default";
    var modalSize = "modal-lg";
  }
  else {
    var modalHeadClass = 'modal-' + type;
  }
  var modalHTML = '<div id="popupModal-' + htmlID + '-' + random_ID + '" class="modal fade ' + modalHeadClass + '" role="dialog">' +
                    '<div class="modal-dialog ' + modalSize + '">' +
                      '<div class="modal-content">' +
                        '<div class="modal-header">' +
                          '<button type="button" class="close" data-dismiss="modal" onclick="$(\'.modal-backdrop\').remove();"><span aria-hidden="true">&times;</span></button>' +
                          '<h4 class="modal-title">' + head.toUpperCase() + '</h4>' +
                        '</div>' +
                        '<div class="modal-body">' +
                          content +
                        '</div>' +
                        '<div class="modal-footer">' +
                          '<button type="button" class="btn ' + modalCloseButton + '" onclick="$(\'.modal-backdrop\').remove();$(\'#popupModal-' + htmlID + '-' + random_ID + '\').modal(\'hide\');">Close</button>' +
                        '</div>' +
                      '</div>' +
                    '</div>' +
                  '</div>';
  $('#' + htmlID).html("");
  $('#' + htmlID).append($('<div />').attr('id', htmlID + "-" + random_ID));
  $('#' + htmlID + "-" + random_ID).html(modalHTML);
  $('#popupModal-' + htmlID + '-' + random_ID).hide().modal("toggle").fadeIn(1000);
}

function flatAlert(head, content, type, dismiss) {
  if (type == "error") {
    var alertHeadClass = "alert-danger";
    var alertHeadIcon = "icon fa fa-warning";
  }
  else {
    var alertHeadClass = 'alert-' + type;
    var alertHeadIcon = "icon fa fa-thumbs-up";
  }
  if (dismiss == true) {
    var dismissButton = '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button>';
  }
  else {
    var dismissButton = "";
  }
  var flatAlertHTML = '<div class="alert ' + alertHeadClass + ' alert-dismissible">' +
                        dismissButton +
                        '<h4><i class="' + alertHeadIcon + '"></i> ' + head + '</h4>' +
                        content +
                      '</div>';
  return flatAlertHTML;
}

function navigate(htmlID) {
  $("#nav-dashboard").removeClass("active");
  $("#nav-sales").removeClass("active");
  $("#nav-accounts").removeClass("active");
  $("#nav-backups").removeClass("active");
  $("#nav-customers").removeClass("active");
  $("#nav-expenses").removeClass("active");
  $("#nav-inventory").removeClass("active");
  $("#nav-logs").removeClass("active");
  $("#nav-payroll").removeClass("active");
  $("#nav-staff").removeClass("active");
  $("#nav-suppliers").removeClass("active");
  $("#nav-profile").removeClass("active");
  $("#nav-settings").removeClass("active");
  $("#nav-license").removeClass("active");
  $('#' + htmlID).addClass("active");
  return false;
}

function setStorage(parameter, value) {
  localStorage.setItem(parameter, value);
}

function getStorage(parameter) {
  return localStorage.getItem(parameter);
}

function clearStorage(parameter) {
  return localStorage.removeItem(parameter);
}

function usageReport() {
  setStorage("shareUsageReport", $("#share-usage-report").is(":checked"));
  $("#share-usage-report").prop("checked", $.parseJSON(getStorage("shareUsageReport")));
}

function sendUsageReport(reportData) {
  if (getStorage("compileReportData") === null) {
    var compileReportData = Array();
  }
  else {
    var compileReportData = $.parseJSON(getStorage("compileReportData"));
  }
  compileReportData.push(reportData);
  setStorage("compileReportData", JSON.stringify(compileReportData));
  if ($.parseJSON(getStorage("shareUsageReport")) == true) {
    if (getStorage("settingsBusinessEmail")) {
      loader("rep-content", "api-prosynapses", "report", { email: getStorage("settingsBusinessEmail"), data: getStorage("compileReportData") }, "", false);
      loader("rep-content", "php", "logs", { email: getStorage("settingsBusinessEmail"), type: "report" }, "", false);
    }
  }
}

function navigateURL(url) {
  window.open(url, "_blank");
}

function downloadFile(file) {
  window.location = file;
}

function scroll(htmlID) {
  $("html, body").animate({ scrollTop: $('#' + htmlID).offset().top }, 1000);
}

function signIn(user) {
  setStorage("sessionUserID", user.userID);
  setStorage("sessionUserAccess", user.userAccess);
  setStorage("sessionUserUsername", user.userUsername);
}

function signOut() {
  clearStorage("sessionUserID");
  clearStorage("sessionUserAccess");
  clearStorage("sessionUserUsername");
}

function loadProfile(user) {
  $(".userAccess").html(user.userAccess);
  $(".userTitle").html(user.userTitle);
  $(".userFirstname").html(user.userFirstname);
  $(".userLastname").html(user.userLastname);
  $(".userGender").html(user.userGender);
  $(".userDateofbirth").html(user.userDateofbirth);
  $(".userAddress").html(user.userAddress);
  $(".userPhone").html(user.userPhone);
  $(".userEmail").html(user.userEmail);
  $(".userUsername").html(user.userUsername);
  $(".userPassword").html("*****");
  $(".userStatus").html(user.userStatus);
  $(".userCreated").html(user.userCreated);
  $(".userUpdated").html(user.userUpdated);
}

function loadUser(user) {
  $("#userAccess").val(user.userAccess);
  $("#userTitle").val(user.userTitle);
  $("#userFirstname").val(user.userFirstname);
  $("#userLastname").val(user.userLastname);
  $("#userGender").val(user.userGender);
  $("#userDateofbirth").val(user.userDateofbirth);
  $("#userAddress").val(user.userAddress);
  $("#userPhone").val(user.userPhone);
  $("#userEmail").val(user.userEmail);
  $("#userUsername").val(user.userUsername);
  $("#userPassword").val(user.userPassword);
  $("#userStatus").val(user.userStatus);
  $("#userCreated").val(user.userCreated);
  $("#userUpdated").val(user.userUpdated);
}

function userSessionCheck() {
  if (getStorage("sessionUserID") === null || getStorage("sessionUserAccess") === null) {
    loader("body", "html", "index", "", "", true);
  }
}

function userAccessSetup() {
  $(".userAccess").html(getStorage("sessionUserAccess"));
  if (getStorage("sessionUserAccess") == "admin") {
    $('.admin-access').show();
  }
  else if (getStorage("sessionUserAccess") == "clerk") {
    $('.admin-access').hide();
  }
  else {

  }
}

function userAccessCheck() {
  if (getStorage("sessionUserAccess") != "admin") {
    loader("page-content", "templates", "dashboard", "", "content-wrapper", true);
  }
  else {

  }
}

function settingsGeneral(data) {
  if (data[0].data) {
    data = $.parseJSON(data[0].data);
    if (data.settingsBusinessName) {
      setStorage("settingsBusinessName", data.settingsBusinessName);
    }
    if (data.settingsBusinessAddress) {
      setStorage("settingsBusinessAddress", data.settingsBusinessAddress);
    }
    if (data.settingsBusinessEmail) {
      setStorage("settingsBusinessEmail", data.settingsBusinessEmail);
    }
    if (data.settingsBusinessPhone) {
      setStorage("settingsBusinessPhone", data.settingsBusinessPhone);
    }
    if (data.settingsSalesCurrency) {
      setStorage("settingsSalesCurrency", data.settingsSalesCurrency);
    }
    if (data.settingsSalesDiscountType) {
      setStorage("settingsSalesDiscountType", data.settingsSalesDiscountType);
    }
    if (data.settingsSalesDiscount) {
      setStorage("settingsSalesDiscount", data.settingsSalesDiscount);
    }
    if (data.settingsSalesTax) {
      setStorage("settingsSalesTax", data.settingsSalesTax);
    }
    if (data.settingsSalesTaxType) {
      setStorage("settingsSalesTaxType", data.settingsSalesTaxType);
    }
    if (data.settingsSalesInfo) {
      setStorage("settingsSalesInfo", data.settingsSalesInfo);
    }
    if (data.settingsReceiptText) {
      setStorage("settingsReceiptText", data.settingsReceiptText);
    }
    if (data.settingsReceiptsCustomer) {
      setStorage("settingsReceiptsCustomer", data.settingsReceiptsCustomer);
    }
    if (data.settingsReceiptsStaff) {
      setStorage("settingsReceiptsStaff", data.settingsReceiptsStaff);
    }
    if (data.settingsReceiptsDiscount) {
      setStorage("settingsReceiptsDiscount", data.settingsReceiptsDiscount);
    }
    if (data.settingsReceiptsPaid) {
      setStorage("settingsReceiptsPaid", data.settingsReceiptsPaid);
    }
    if (data.settingsReceiptsPayment) {
      setStorage("settingsReceiptsPayment", data.settingsReceiptsPayment);
    }
    if (data.settingsReceiptsTax) {
      setStorage("settingsReceiptsTax", data.settingsReceiptsTax);
    }
    if (data.settingsReceiptsBalance) {
      setStorage("settingsReceiptsBalance", data.settingsReceiptsBalance);
    }
    if (data.settingsReceiptsInfo) {
      setStorage("settingsReceiptsInfo", data.settingsReceiptsInfo);
    }
    if (data.settingsReceiptsPrintPOSWidth) {
      setStorage("settingsReceiptsPrintPOSWidth", data.settingsReceiptsPrintPOSWidth);
    }
    if (data.settingsReceiptsPrintPOSFontSize) {
      setStorage("settingsReceiptsPrintPOSFontSize", data.settingsReceiptsPrintPOSFontSize);
    }
    if (data.settingsReceiptsPrintPOSAlignTop) {
      setStorage("settingsReceiptsPrintPOSAlignTop", data.settingsReceiptsPrintPOSAlignTop);
    }
    if (data.settingsReceiptsPrintPOSAlignLeft) {
      setStorage("settingsReceiptsPrintPOSAlignLeft", data.settingsReceiptsPrintPOSAlignLeft);
    }
    if (data.settingsBackupsNumberLimit) {
      setStorage("settingsBackupsNumberLimit", data.settingsBackupsNumberLimit);
    }
    if (data.settingsInventoryExpiryNotification) {
      setStorage("settingsInventoryExpiryNotification", data.settingsInventoryExpiryNotification);
    }
    if (data.settingsPayroll) {
      setStorage("settingsPayroll", data.settingsPayroll);
    }
    if (data.settingsAppProFeature) {
      setStorage("settingsAppProFeature", data.settingsAppProFeature);
    }
    if (data.settingsAppClinicalFeature) {
      setStorage("settingsAppClinicalFeature", data.settingsAppClinicalFeature);
    }
    if (data.settingsAppVoiceResponse) {
      setStorage("settingsAppVoiceResponse", data.settingsAppVoiceResponse);
    }
  }
  inventoryQuery();
}

function settingsApply() {
  if ($(".pro-feature").is(":hidden") || getStorage("settingsAppProFeature") == "false") {
    $(".pro-feature").toggle($.parseJSON(getStorage("settingsAppProFeature")));
  }
  if ($(".clinical-feature").is(":hidden") || getStorage("settingsAppClinicalFeature") == "false") {
    $(".clinical-feature").toggle($.parseJSON(getStorage("settingsAppClinicalFeature")));
  }
  $("#receipt-settingsBusinessName").html(getStorage("settingsBusinessName"));
  $("#receipt-settingsBusinessAddress").html(getStorage("settingsBusinessAddress"));
  $("#receipt-settingsBusinessEmail").html(getStorage("settingsBusinessEmail"));
  $("#receipt-settingsBusinessPhone").html(getStorage("settingsBusinessPhone"));
  $("#receipt-settingsReceiptText").html(getStorage("settingsReceiptText"));
  if ($("#settings-receipt-customer").is(":hidden") || getStorage("settingsReceiptsCustomer") == "false") {
    $("#settings-receipt-customer").toggle($.parseJSON(getStorage("settingsReceiptsCustomer")));
  }
  if ($("#settings-receipt-staff").is(":hidden") || getStorage("settingsReceiptsStaff") == "false") {
    $("#settings-receipt-staff").toggle($.parseJSON(getStorage("settingsReceiptsStaff")));
  }
  if ($("#settings-receipt-discount").is(":hidden") || getStorage("settingsReceiptsDiscount") == "false") {
    $("#settings-receipt-discount").toggle($.parseJSON(getStorage("settingsReceiptsDiscount")));
  }
  if ($("#settings-receipt-paid").is(":hidden") || getStorage("settingsReceiptsPaid") == "false") {
    $("#settings-receipt-paid").toggle($.parseJSON(getStorage("settingsReceiptsPaid")));
  }
  if ($("#settings-receipt-payment").is(":hidden") || getStorage("settingsReceiptsPayment") == "false") {
    $("#settings-receipt-payment").toggle($.parseJSON(getStorage("settingsReceiptsPayment")));
  }
  if ($("#settings-receipt-tax").is(":hidden") || getStorage("settingsReceiptsTax") == "false") {
    $("#settings-receipt-tax").toggle($.parseJSON(getStorage("settingsReceiptsTax")));
  }
  if ($("#settings-receipt-balance").is(":hidden") || getStorage("settingsReceiptsBalance") == "false") {
    $("#settings-receipt-balance").toggle($.parseJSON(getStorage("settingsReceiptsBalance")));
  }
  if ($("#settings-receipt-info").is(":hidden") || getStorage("settingsReceiptsInfo") == "false") {
    $("#settings-receipt-info").toggle($.parseJSON(getStorage("settingsReceiptsInfo")));
  }
  $("#label-settingsBusinessName").html(getStorage("settingsBusinessName"));
  $("#label-settingsBusinessAddress").html(getStorage("settingsBusinessAddress"));
  $("#label-settingsBusinessEmail").html(getStorage("settingsBusinessEmail"));
  $("#label-settingsBusinessPhone").html(getStorage("settingsBusinessPhone"));
  $("#payroll-settingsBusinessName").html(getStorage("settingsBusinessName"));
  $("#payroll-settingsBusinessAddress").html(getStorage("settingsBusinessAddress"));
  $("#payroll-settingsBusinessEmail").html(getStorage("settingsBusinessEmail"));
  $("#payroll-settingsBusinessPhone").html(getStorage("settingsBusinessPhone"));
  $("#license-settingsBusinessName").html(getStorage("settingsBusinessName"));
  userAccessSetup();
  if ($.parseJSON(getStorage("jenrxLicense")) != true) {
    $(".pro-feature a").removeAttr("onclick");
    $(".clinical-feature a").removeAttr("onclick");
    $(".pro-feature a").attr("onclick", 'loader("license-content", "popup", "license-jenrx-pro", "", "", false);');
    $(".clinical-feature a").attr("onclick", 'loader("license-content", "popup", "license-jenrx-pro", "", "", false);');
    $(".clinical-feature input").attr("readonly", "readonly");
    $(".clinical-feature select").attr("readonly", "readonly");
    $(".clinical-feature textarea").attr("readonly", "readonly");
  }
}

function inventoryQueryExpired(data) {
  $(".inventoryExpiredCount").html(data.length);
  var notifications = "";
  for (var i = 0; i < data.length; i++) {
    notifications = notifications + '<li>' +
        '<a href="#">' +
          '<i class="fa fa-warning text-red"></i> ' +
          '<span title="' + data[i].name + ' (' + data[i].quantity + ' ' + data[i].packaging + ') expired ' + data[i].expirydate + '">' +
            data[i].name + ' (' + data[i].quantity + ' ' + data[i].packaging + ') expired ' + data[i].expirydate +
          '</span>' +
        '</a>' +
      '</li>';
  }
  $(".inventoryExpiredList").html(notifications);
}

function inventoryQueryAboutToExpire(data) {
  $(".inventoryAboutToExpireCount").html(data.length);
  var notifications = "";
  for (var i = 0; i < data.length; i++) {
    notifications = notifications + '<li>' +
        '<a href="#">' +
          '<i class="fa fa-warning text-yellow"></i> ' +
          '<span title="' + data[i].name + ' (' + data[i].quantity + ' ' + data[i].packaging + ') expires ' + data[i].expirydate + '">' +
            data[i].name + ' (' + data[i].quantity + ' ' + data[i].packaging + ') expires ' + data[i].expirydate +
          '</span>' +
        '</a>' +
      '</li>';
  }
  $(".inventoryAboutToExpireList").html(notifications);
}

function inventoryQueryReorder(data) {
  $(".inventoryReorderCount").html(data.length);
  var notifications = "";
  for (var i = 0; i < data.length; i++) {
    notifications = notifications + '<li>' +
        '<a href="#">' +
          '<i class="fa fa-warning text-aqua"></i> ' +
          '<span title="' + data[i].name + ' (' + data[i].quantity + ' ' + data[i].packaging + ') below ' + data[i].reorderlevel + ' ' + data[i].packaging + '">' +
            data[i].name + ' (' + data[i].quantity + ' ' + data[i].packaging + ') below ' + data[i].reorderlevel + ' ' + data[i].packaging +
          '</span>' +
        '</a>' +
      '</li>';
  }
  $(".inventoryReorderList").html(notifications);
}

function inventoryQuery() {
  loader("py-content", "py", "inventory/query", { queryType: "inventoryQueryReorder", queryData: "", responseType: "notification" }, "", false);
  loader("py-content", "py", "inventory/query", { queryType: "inventoryQueryAboutToExpire", queryData: getStorage("settingsInventoryExpiryNotification"), responseType: "notification" }, "", false);
  loader("py-content", "py", "inventory/query", { queryType: "inventoryQueryExpired", queryData: "", responseType: "notification" }, "", false);
}

function select2Search(type, htmlID) {
  var url_add = "";
  if (type == "inventory") {
    var placeholder = "Inventory";
  }
  else if (type == "customers") {
    var placeholder = "Customers";
  }
  else if (type == "users") {
    var placeholder = "Staff";
  }
  else if (type == "suppliers") {
    var placeholder = "Suppliers";
  }
  else if (type == "inventory-inactive") {
    var placeholder = "Inventory";
    type = "inventory";
    url_add = "inactive/";
  }
  else if (type == "customers-inactive") {
    var placeholder = "Customers";
    type = "customers";
    url_add = "inactive/";
  }
  else if (type == "users-inactive") {
    var placeholder = "Staff";
    type = "users";
    url_add = "inactive/";
  }
  else if (type == "suppliers-inactive") {
    var placeholder = "Suppliers";
    type = "suppliers";
    url_add = "inactive/";
  }
  else {

  }
  var url = directory_py + type + '/search/' + url_add;
  $('#' + htmlID).select2({
    placeholder: 'Search ' + placeholder,
    minimumInputLength: 1,
    ajax: {
      url: function (params) {
        return url + params.term + '/';
      },
      dataType: 'json',
      processResults: function (data) {
        return {
          results: $.map(data, function (obj) {
            if (type == "inventory") {
              return {
                id: obj.inventory_id,
                text: 'Name: ' + obj.name + '; Quantity: ' + obj.quantity + ' ' + obj.packaging + '; Selling Price: ' + getStorage("settingsSalesCurrency") + obj.sellingprice.toString().replace(/\B(?=(\d{3})+(?!\d))/g,",") + '; Barcode: ' + obj.barcode
              }
            }
            else if (type == "customers") {
              return {
                id: obj.customer_id,
                text: 'Name: ' + obj.title + ' ' + obj.firstname + ' ' + obj.lastname
              }
            }
            else if (type == "users") {
              return {
                id: obj.user_id,
                text: 'Name: ' + obj.title + ' ' + obj.firstname + ' ' + obj.lastname + '; Username: ' + obj.username
              }
            }
            else if (type == "suppliers") {
              return {
                id: obj.supplier_id,
                text: 'Name: ' + obj.title + ' ' + obj.firstname + ' ' + obj.lastname + '; Company: ' + obj.company
              }
            }
            else {

            }
          })
        };
      }
    }
  });
}

function dataTablesButtons(htmlID, titleAttr) {
  $('#' + htmlID).DataTable({
    dom: "Bfrtip",
    stateSave: true,
    lengthMenu: [
      [10, 25, 50, -1],
      ['10 Rows', '25 Rows', '50 Rows', 'Show All']
    ],
    buttons: [
      {
        extend: "pageLength",
        text: "<i class='fa fa-table'></i> &nbsp; Row Length",
        titleAttr: "Row Length"
      },
      {
        extend: "colvis",
        text: "<i class='fa fa-eye-slash'></i> &nbsp; Show/Hide Columns",
        titleAttr: "Show/Hide Columns"
      },
      {
        extend: "copyHtml5",
        text: "<i class='fa fa-files-o'></i> &nbsp; Copy",
        titleAttr: 'Copy - ' + titleAttr,
        exportOptions: {
          columns: ":visible"
        }
      },
      {
        extend: "csvHtml5",
        text: "<i class='fa fa-file-text-o'></i> &nbsp; CSV",
        title: 'Download CSV - ' + titleAttr,
        titleAttr: 'Download CSV - ' + titleAttr,
        exportOptions: {
          columns: ":visible"
        }
      },
      {
        extend: "excelHtml5",
        text: "<i class='fa fa-file-excel-o'></i> &nbsp; Excel",
        title: 'Download Excel - ' + titleAttr,
        sheetName: 'Download Excel - ' + titleAttr,
        titleAttr: 'Download Excel - ' + titleAttr,
        autoFilter: true,
        exportOptions: {
          columns: ":visible"
        }
      },
      {
        text: "JSON",
        text: "<i class='fa fa-file-code-o'></i> &nbsp; JSON",
        action: function (e, dt, button, config) {
          var data = dt.buttons.exportData();
          $.fn.dataTable.fileSave(
            new Blob([JSON.stringify(data)]),
            'Download JSON - ' + titleAttr + '.json'
          );
        },
        titleAttr: 'Download JSON - ' + titleAttr,
        exportOptions: {
          columns: ":visible"
        }
      },
      {
        extend: "pdfHtml5",
        text: "<i class='fa fa-file-pdf-o'></i> &nbsp; PDF",
        title: 'Download PDF - ' + titleAttr,
        titleAttr: 'Download PDF - ' + titleAttr,
        orientation: "landscape",
        exportOptions: {
          columns: ":visible"
        }
      }
    ]
  }).draw();
}

function salesSetup(salesID) {
  $("#form-complete-transaction #discountType").val(getStorage("settingsSalesDiscountType"));
  $("#form-complete-transaction #discount").val(getStorage("settingsSalesDiscount"));
  $("#form-complete-transaction #tax").val(getStorage("settingsSalesTax"));
  $("#form-complete-transaction #info").val(getStorage("settingsSalesInfo"));
  $(".salesID").val(salesID);
  $(".salesID").html(salesID);
  $(".userID").val(getStorage("sessionUserID"));
  loader("sales-receipt-loader", "templates", "print-receipt", "", "", false);
}

function salesReceipt(data) {
  var receipt_list = "";
  var id = 1;
  var total = 0;
  for (var i = 0; i < data.length; i++) {
    if (data[i].cart_id) {
      var quantity = data[i].cart_quantity;
      var dose = data[i].dose;
      var regimen = data[i].regimen;
      if (data[i].regimen == "") {
        regimen = regimen;
      }
      if (data[i].regimen == "0") {
        regimen = "When Needed";
      }
      if (data[i].regimen == "1") {
        regimen = "One (1) Time Daily";
      }
      if (data[i].regimen == "2") {
        regimen = "Two (2) Times Daily";
      }
      if (data[i].regimen == "3") {
        regimen = "Three (3) Times Daily";
      }
      if (data[i].regimen == "4") {
        regimen = 'Four (4) Times Daily';
      }
      if (data[i].regimen == "5") {
        regimen = "Five (5) Times Daily";
      }
      if (data[i].regimen == "6") {
        regimen = "Six (6) Times Daily";
      }
      if (data[i].regimen == "7") {
        regimen = "Seven (7) Times Daily";
      }
      if (data[i].regimen == "8") {
        regimen = "Eight (8) Times Daily";
      }
      if (data[i].regimen == "9") {
        regimen = "Nine (9) Times Daily";
      }
      if (data[i].regimen == "10") {
        regimen = "Ten (10) Times Daily";
      }
      var label_data = {
        invoice: data[i].sales_id,
        date: data[i].sales_time,
        inventory: data[i].name,
        quantity: data[i].cart_quantity,
        dose: data[i].dose,
        regimen: data[i].regimen,
        label: data[i].label.replace(/'/g, "&#39;").replace(/"/g, "&#39;&#39;"),
        customerTitle: data[i].customers_title,
        customerFirstname: data[i].customers_firstname,
        customerLastname: data[i].customers_lastname
      }
      var label = '<button type="button" class="btn btn-info btn-xs clinical-feature" title="Inventory Label" onclick=\'printLabel(' + JSON.stringify(JSON.stringify(label_data)) + ');\'><i class="fa fa-sticky-note"></i></button>';
      receipt_list = receipt_list + '<tr>' +
          '<td>' + label + id + '</td>' +
          '<td>' + data[i].name + '</td>' +
          '<td>' + quantity + '</td>' +
          '<td class="clinical-feature">' + dose + '</td>' +
          '<td class="clinical-feature">' + regimen + '</td>' +
          '<td>' + data[i].price.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g,",") + '</td>' +
          '<td>' + data[i].cart_total.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g,",") + '</td>' +
        '</tr>';
      total = total + data[i].cart_total;
      id++;
    }
  }
  $("#receipt-list").html(receipt_list);
  $("#receipt-date").html(data[0].sales_time);
  $(".receipt-invoice").html(data[0].sales_id);
  $("#receipt-status").html(data[0].status.toUpperCase());
  if (data[0].status == "pending") {
    $("#receipt-status").attr("class", "btn btn-warning btn-sm");
  }
  else if (data[0].status == "complete") {
    $("#receipt-status").attr("class", "btn btn-success btn-sm");
  }
  else if (data[0].status == "refund") {
    $("#receipt-status").attr("class", "btn btn-danger btn-sm");
    $("#receipt-refund-date").html(data[0].updated);
    $("#set-receipt-refund-date").show();
  }
  else {
    $("#receipt-status").attr("class", "btn btn-sm");
  }
  var balance = parseFloat(data[0].paid) - parseFloat(data[0].total);
  var discount_value = (parseFloat(data[0].discount) / 100) * total;
  var tax_value = (parseFloat(data[0].tax) / 100) * (total - discount_value);
  var totalD = total - discount_value;
  if (data[0].total == totalD) {
    var tax_type = "inclusive";
  }
  else {
    var tax_type = "exclusive";
  }
  if (data[0].customers_title !== null && data[0].customers_firstname !== null && data[0].customers_lastname !== null) {
    $("#receipt-customer").html(data[0].customers_title + ' ' + data[0].customers_firstname + ' ' + data[0].customers_lastname);
  }
  $("#receipt-staff").html(data[0].users_title + ' ' + data[0].users_firstname + ' ' + data[0].users_lastname);
  $("#receipt-discount").html(data[0].discount.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g,","));
  $("#receipt-discount-value").html(getStorage("settingsSalesCurrency") + discount_value.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g,","));
  $("#receipt-paid").html(getStorage("settingsSalesCurrency") + data[0].paid.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g,","));
  $("#receipt-payment").html(data[0].payment.toUpperCase());
  $("#receipt-tax").html(data[0].tax.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g,","));
  $("#receipt-tax-type").html(tax_type.toUpperCase());
  $("#receipt-tax-value").html(getStorage("settingsSalesCurrency") + tax_value.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g,","));
  $("#receipt-total").html(getStorage("settingsSalesCurrency") + total.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g,","));
  $("#receipt-totalDT").html(getStorage("settingsSalesCurrency") + data[0].total.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g,","));
  $("#receipt-balance").html(getStorage("settingsSalesCurrency") + balance.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g,","));
  $("#receipt-info").html(data[0].info);
  settingsApply();
  popupModal("Receipt", $("#receipt-prepare").html(), "default", "receipt-content");
}

function refundTransaction(htmlID, data) {
  if (typeof data == "string") {
    data = $.parseJSON(data);
  }
  loader(htmlID, "py", 'sales/complete/' + data.salesID, data, "", true);
  inventoryQuery();
}

function printJSMethod(htmlID, type) {
  var styleSheets = Array();
  for (var i = 0; i < document.styleSheets.length; i++) {
    if (document.styleSheets[i].href) {
      styleSheets.push(document.styleSheets[i].href);
    }
  }
  var style = "";
  if (type == "POS") {
    var style = '@media print { @page { margin-top: ' + getStorage("settingsReceiptsPrintPOSAlignTop") + '; margin-left: ' + getStorage("settingsReceiptsPrintPOSAlignLeft") + '; } }</style>';
  }
  printJS({
    printable: htmlID,
    type: "html",
    css: styleSheets,
    style: style
  });
}

function printSection(htmlID) {
  $("body *").css("visibility", "hidden");
  $('#' + htmlID + ' *').css("visibility", "visible");
  printJSMethod(htmlID, "");
  $("body *").css("visibility", "visible");
}

function printSectionPOS(htmlID) {
  $("body *").css("visibility", "hidden");
  $('#' + htmlID + ' *').css("visibility", "visible");
  $('#' + htmlID).addClass("print-section-pos");
  $('#' + htmlID + ' *').css("margin", 0);
  $('#' + htmlID + ' *').css("padding", 0);
  $('#' + htmlID).css("width", getStorage("settingsReceiptsPrintPOSWidth"));
  $('#' + htmlID + ' *').css("font-size", getStorage("settingsReceiptsPrintPOSFontSize"));
  printJSMethod(htmlID, "POS");
  $('#' + htmlID + ' *').css("font-size", "");
  $('#' + htmlID).css("width", "auto");
  $('#' + htmlID + ' *').css("padding", "");
  $('#' + htmlID + ' *').css("margin", "");
  $('#' + htmlID).removeClass("print-section-pos");
  $("body *").css("visibility", "visible");
}

function dateTime() {
  $(".dateTime").html(new Date());
  setTimeout(dateTime, 1000);
}

function logsLoader(htmlID, loaderType, script, data) {
  if ((loaderType != "php" && script != "logs")) {
    if (Array.isArray(data)) {
      var data_ = JSON.parse(JSON.stringify(data));
      for (var i = 0; i < data_.length; i++) {
        if (data_[i].name && data_[i].name.toLowerCase().includes("password")) {
          data_[i].value = "*****";
        }
      }
    }
    else {
      var data_ = data;
    }
    var date = new Date();
    date = date.getFullYear() + '-' + (date.getMonth() + 1).toString().padStart(2, "0") + '-' + date.getDate().toString().padStart(2, "0") + ' ' + date.getHours().toString().padStart(2, "0") + ':' + date.getMinutes().toString().padStart(2, "0") + ':' + date.getSeconds().toString().padStart(2, "0");
    var data__ = { date: date, type: "html", staff: getStorage("sessionUserUsername"), ID: htmlID, loader: loaderType, module: script, data: JSON.stringify(data_) };
    loader("logs-content", "php", "logs", data__, "", false);
  }
  else {

  }
}

function loadLicenseCheck(license) {
  setStorage("jenrxLicense", license.s);
  $(".expirationDate").html(license.e);
  $(".activationDate").html(license.a);
  if (license.s == false) {
    var license_statement = "Expired License";
    var popup_type = "error";
    var label_color = "label-danger";
    var fa_icon = "text-red";
  }
  else if (license.s == "invalid") {
    var license_statement = "Invalid License";
    var popup_type = "error";
    var label_color = "label-danger";
    var fa_icon = "text-red";
  }
  else if (license.s == true) {
    var license_statement = 'License Expiration Date: ' + license.e;
    var popup_type = "success";
    var label_color = "label-success";
    var fa_icon = "text-green";
    var thirtydays = new Date();
    thirtydays.setDate(thirtydays.getDate() + 30);
    if (new Date(license.e) <= thirtydays) {
      var popup_type = "warning";
      var label_color = "label-warning";
      var fa_icon = "text-yellow";
    }
  }
  else {

  }
  popupModal("Notification", license_statement, popup_type, "license-content");
  loader("speech-content", "php", "speech", { type: "normal", text: license_statement }, "", false);
  $(".licenseNotificationCount").html(1);
  $(".licenseNotificationCount").first().removeClass("label-danger");
  $(".licenseNotificationCount").first().removeClass("label-success");
  $(".licenseNotificationCount").first().removeClass("label-warning");
  $(".licenseNotificationCount").first().addClass(label_color);
  var notifications = '<li>' +
      '<a href="#">' +
        '<i class="fa fa-clipboard ' + fa_icon + '"></i> ' +
        '<span title="' + license_statement + '">' +
          license_statement +
        '</span>' +
      '</a>' +
    '</li>';
  $(".licenseNotificationList").html(notifications);
  $("#form-license-activate-loader").html("");
  settingsApply();
}

window.onerror = function (message, url, line, column, error) {
  var date = new Date();
  date = date.getFullYear() + '-' + (date.getMonth() + 1).toString().padStart(2, "0") + '-' + date.getDate().toString().padStart(2, "0") + ' ' + date.getHours().toString().padStart(2, "0") + ':' + date.getMinutes().toString().padStart(2, "0") + ':' + date.getSeconds().toString().padStart(2, "0");
  var data = { date: date, type: "js", message: message, url: url, line: line, column: column, error: JSON.stringify(error) };
  loader("error-content", "php", "error", data, "", false);
  return false;
};
