var spath = "node_modules/sscheme/";
$(function() {
  require.load([spath+'hash.js',spath+'simplescheme.js'], function(err) {
    if (err) alert(err);
    var scheme = require(spath+'simplescheme').SScheme;
    var change_code = function(s) { editor.setValue(s); }
    $.get("samples/default.scm", change_code);
    $('#input').submit(function(e) {
      var input_text = $('#input_text').val()
      var output_array = scheme.parse(input_text);
      var output_text = '';
      $.each(output_array, function(index, value) {
        output_text += value + "<br>";
      });
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
});

