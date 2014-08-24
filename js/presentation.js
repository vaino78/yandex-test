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
			"index"      : 0,
			"slide"      : null,
			"canBack"    : false,
			"canForward" : false,
			"total"      : null,
			"slides"     : new SlideCollection([])
		},

		"initialize"  : function() {
			this.on('change:index', this.checkState);
		},

		"checkState"  : function() {
			this.set({
				"slide"      : this.attributes.slides.at(this.attributes.index),
				"canBack"    : (this.attributes.index > 0),
				"canForward" : (this.attributes.index < this.attributes.slides.length - 1)
			});
		},

		"total"       : function() {
			return this.attributes.slides.length;
		},

		"slide"       : function(index) {
			return this.attributes.slides.at(index);
		},

		"back"        : function() {
			if(!this.attributes.canBack)
				return false;
			this.set('index', (this.attributes.index-1));
			return true;
		},

		"forward"     : function() {
			if(!this.attributes.canForward)
				return false;
			this.set('index', (this.attributes.index+1));
			return true;
		},

		"begin"       : function() {
			if(!this.attributes.canBack)
				return false;
			this.set('index', 0);
			return true;
		},

		"end"         : function() {
			if(!this.attributes.canForward)
				return false;
			this.set('index', this.total()-1);
			return true;
		}
	});


	// views

	var AppView = Backbone.View.extend({
		"events"     : {
			"click .presentation-nav-back"  : "back",
			"click .presentation-nav-forw"  : "forward",
			"click .presentation-nav-begin" : "begin",
			"click .presentation-nav-end"   : "end"
		},

		"initialize" : function() {
			this.template = $.trim($('#presentationInnerTemplate').html());

			this.model.on('change:canBack',    this._canBack);
			this.model.on('change:canForward', this._canForward);
			this.model.on('change:slide',      this._slide);

			this.model.checkState();

			this.render();
		},

		"render"     : function() {
			this.$el.html(_.template(this.template, {}));
		},

		"back"       : function() {
			this.model.back();
		},

		"forward"    : function() {
			this.model.forward();
		},

		"begin"      : function() {
			this.model.begin();
		},

		"end"        : function() {
			this.model.end();
		},

		"_canBack"   : function(value) {
			this.$('.presentation-nav-back, .presentation-nav-begin').attr('disabled', !value);
		},

		"_canForward": function(value) {
			this.$('.presentation-nav-forw, .presentation-nav-end').attr('disabled', !value);
		},

		"_slide"     : function(value) {
		}
	});

	var SlideView = Backbone.View.extend({
	});

	// init

	

	// jQuery plugin

	$.fn.presentationViewer = function(options) {
		return this.each(function() {
			var $this = $(this),
				model = new ViewModel(),
				view  = new AppView({
					"el"    : this,
					"model" : model
				});

			$this.data('presentationViewer', view);
		});
	}
});