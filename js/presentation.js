$(function(){

	// declaring

	// models

	var Slide = Backbone.Model.extend({
		"defaults" : {
			"url"    : null,
			"loaded" : false
		}
	});

	var SlideCollection = Backbone.Collection.extend({
		"model" : Slide
	});

	var ViewModel = Backbone.Model.extend({
		"defaults"    : {
			"index"  : 0,
			"slides" : new SlideCollection([])
		},

		"total"       : function() {
			return this.attributes.slides.length;
		},

		"slide"       : function(index) {
			return this.attributes.slides.at(index);
		},

		"back"        : function() {
			if(!this.canPrevoius())
				return false;
			this.set('index', (this.attributes.index-1));
			return true;
		},

		"forward"     : function() {
			if(!this.canNext())
				return false;
			this.set('index', (this.attributes.index+1));
			return true;
		},

		"begin"       : function() {
			if(!this.canBegin())
				return false;
			this.set('index', 0);
			return true;
		},

		"end"         : function() {
			if(!this.canEnd())
				return false;
			this.set('index', this.total()-1);
			return true;
		},

		"canNext"     : function() {
			return (this.attributes.index < this.total()-1);
		},

		"canPrevious" : function() {
			return (this.attributes.index > 0);
		},

		"canBegin"    : function() {
			return this.canPrevious();
		},

		"canEnd"      : function() {
			return this.canNext();
		}
	});


	// views

	var AppView = Backbone.View.extend({
		
	});

	var SlideView = Backbone.View.extend({
	});

	// init

	

	// jQuery plugin

	$.fn.presentationViewer = function(options) {
	}
});