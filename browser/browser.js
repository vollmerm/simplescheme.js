
$(function() {
  var scheme = require('simplescheme');
  var change_code = function(s) { editor.setValue(s); }
  $.get("samples/default.scm", change_code);
  $('#input').submit(function(e) {
    var input_text = $('#input_text').val()
    var output_text = scheme.parse(input_text,true);
    $('#output').html(output_text);
    e.preventDefault();
    return false;
  });
  $("#Samples").change(function() {
 var selected = $("#Samples").val();
    var file = "samples/" + ($("#Samples option:selected").text() + ".scm").toLowerCase();
    $.get(file, change_code);
  });
});

