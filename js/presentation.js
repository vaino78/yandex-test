$(function(){

	// declaring

	// models

	var Slide = Backbone.Model.extend({
		"defaults" : {
			"url"    : null,
			"loaded" : false
		}
	});

	var Presentation = Backbone.Collection.extend({
		"model" : Slide
	});

	var ViewModel = Backbone.Model.extend({
		"defaults" : {
			"presentation" : null,
			"slide"        : null
		}
	});


	// views




	// init

	

	// jQuery plugin

	$.fn.presentationViewer = function(options) {
	}
});