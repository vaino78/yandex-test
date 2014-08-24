$(function(){

	// declaring

	// models

	var Slide = Backbone.Model.extend({
		"defaults" : {
			"url"    : null,
			"loaded" : false
		},

		"constructor" : function(url) {
			if(typeof(url) == 'string')
				url = {"url" : url};

			Backbone.Model.apply(this, arguments);
		}
	});

	var SlideCollection = Backbone.Collection.extend({
		"model" : Slide
	});

	var ViewModel = Backbone.Model.extend({
		"defaults"    : {
			"index"      : 0,
			"slide"      : null,
			"canBack"    : null,
			"canForward" : null,
			"total"      : null,
			"slides"     : new SlideCollection([])
		},

		"initialize"  : function() {
			this.on('change:index',  this.checkState);
			this.on('change:slides', this.checkState);
			this.on('change:slides', this.checkSlides);
			this.trigger('change:slides');
		},

		"checkState"  : function() {
			this.set({
				"total"      : this.total(),
				"slide"      : this.slide(this.attributes.index),
				"canBack"    : (this.attributes.index > 0),
				"canForward" : (this.attributes.index < this.attributes.slides.length - 1)
			});
		},

		"checkSlides" : function() {
			this.listenTo(this.attributes.slides, 'all', this.checkState);
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
			this.template = _.template($.trim($('#presentationInnerTemplate').html()));

			this.model.on('change:canBack',    this._canBack,    this);
			this.model.on('change:canForward', this._canForward, this);
			this.model.on('change:slide',      this._slide,      this);
			this.model.on('change:total',      this._total,      this);

			this.render();

			this._canBack();
			this._canForward();
			this._slide();
			this._total();
		},

		"render"     : function() {
			this.$el.html(this.template({}));
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
			this['$']('.presentation-nav-back, .presentation-nav-begin').attr('disabled', !this.model.get('canBack'));
		},

		"_canForward": function(value) {
			this['$']('.presentation-nav-forw, .presentation-nav-end').attr('disabled', !this.model.get('canForward'));
		},

		"_slide"     : function(value) {
			this.$('.presentation-nav-current').val(this.model.get('index') + 1);
		},

		"_total"     : function(value) {
			this.$('.presentation-nav-total').text(this.model.get('total'));
		}
	});

	var SlideView = Backbone.View.extend({
	});

	// init

	

	// jQuery plugin

	$.fn.presentationViewer = function(options) {
		return this.each(function() {
			var $this         = $(this),
				slides        = new SlideCollection(),
				dataSlides    = $this.data('presentationSlides'),
				dataSlidesUrl = $this.data('presentationSlidesUrl');

			if(dataSlides && dataSlides.length)
				slides.set(dataSlides);
			else if(dataSlidesUrl)
			{
				slides.url = dataSlidesUrl;
				slides.fetch();
			}
			
			var view  = new AppView({
				"el"    : this,
				"model" : new ViewModel({"slides" : slides})
			});

			$this.data('presentationViewer', view);
		});
	}
});