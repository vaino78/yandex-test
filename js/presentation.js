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

			url.id = _.uniqueId('slides_');

			Backbone.Model.apply(this, arguments);
		},

		"needScaling" : function(w, h) {
			if(!this.attributes.loaded)
				return 0;

			if(this.attributes.width <= w && this.attributes.height <= h)
				return 0;

			return (this.attributes.width >= this.attributes.height)
				? ((w > this.attributes.width && h < this.attributes.height) ? -1 : 1)
				: -1;
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

		/*"validate"    : function(attrs) {
			if(!attrs.total)
				return "Пустая презентация";

			if(attrs.index > attrs.total-1)
				return "Некорректный номер слайда";
		},*/

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
			"click .presentation-nav-back"      : "back",
			"click .presentation-nav-forw"      : "forward",
			"click .presentation-nav-begin"     : "begin",
			"click .presentation-nav-end"       : "end",
			"keydown .presentation-nav-current" : "onCurrentInput",
			"click .presentation-nav-full"      : "toggleFullscreen",
			"keyup .presentation-nav-current"   : "onCurrentEnter"
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
			return this;
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

		"onCurrentInput" : function(ev) {
			if(
				(ev.keyCode >= 48 && ev.keyCode <= 57) // digits
				||
				(ev.keyCode >= 96 && ev.keyCode <= 105)// numpad
				||
				ev.keyCode == 8                        // backspace
				||
				ev.keyCode == 46                       // delete
				||
				ev.keyCode == 13                       // enter
				||
				(ev.keyCode == 37 || ev.keyCode == 39) // arrows
			)
				return true;
			
			ev.preventDefault();
		},

		"onCurrentEnter" : function(ev) {
			if(ev.keyCode != 13)
				return;
			this.model.set('index', (parseInt(ev.target.value)-1), {"validate" : true});
		},

		"onKeyNav"       : function(ev) {
			console.log(ev);
		},

		"toggleFullscreen" : function() {
			if(
				!document.fullsreenElement
				&&
				!document.mozFullScreenElement
				&&
				!document.webkitFullscreenElement
				&&
				!this.$('.presentation-pane').hasClass('presentation-pane-fullscreen')
			)
			{
				this.$('.presentation-pane').addClass('presentation-pane-fullscreen');

				if (document.documentElement.requestFullscreen)
					this.el.requestFullscreen();
				else if (document.documentElement.mozRequestFullScreen)
					this.el.mozRequestFullScreen();
				else if (document.documentElement.webkitRequestFullscreen)
					this.el.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
			}
			else
			{
				this.$('.presentation-pane').removeClass('presentation-pane-fullscreen');

				if (document.cancelFullScreen)
					document.cancelFullScreen();
				else if (document.mozCancelFullScreen)
					document.mozCancelFullScreen();
				else if (document.webkitCancelFullScreen)
					document.webkitCancelFullScreen();
				
			}

			this.model.get('slides').each(function(el){ el.trigger('change'); });
		},

		"_error"     : function() {
			if(this.model.isValid())
			{
				this.$('.presentation-error').hide();
				this.$('.presentation-error-text').text('');
			}
			else
			{
				this.$('.presentation-error-text').text(this.model.validationError);
				this.$('.presentation-error').show();
			}
		},

		"_canBack"   : function(value) {
			this['$']('.presentation-nav-back, .presentation-nav-begin').attr('disabled', !this.model.get('canBack'));
		},

		"_canForward": function(value) {
			this['$']('.presentation-nav-forw, .presentation-nav-end').attr('disabled', !this.model.get('canForward'));
		},

		"_slide"     : function(value) {
			this.$('.presentation-nav-current').val(this.model.get('index') + 1);

			if(this.model.get('slide'))
			{
				var element = this._getByModel(this.model.get('slide')), 
					prev    = this._getByModel(this.model.previous('slide'));
				if(prev)
					this.$(prev).removeClass('presentation-slide-active');
				this.$(element).addClass('presentation-slide-active');

				this._siblings();
			}
		},

		"_total"     : function(value) {
			this.$('.presentation-nav-total').text(this.model.get('total'));
		},

		"_getByModel": function(m) {
			if(!m)
				return null;

			var element = this.$('#' + m.get('id')).get(0);
			if(!element)
			{
				element = new SlideView({ "model" : m }).render().el;
				this.$('.presentation-view').append(element);
			}

			return element;
		},

		"_siblings" : function() {
			var sib = this.model.get('slides').slice(
				this.model.get('index')+1, 
				this.model.get('index')+4
			);

			_.each(sib, function(m) { this._getByModel(m) }, this);
		}
	});

	var SlideView = Backbone.View.extend({
		"className" : "presentation-slide",
		"template"  : _.template($.trim($('#presentationSlide').html())),

		"initialize": function() {
			this.$el.data('backbonePresentationView', this);

			this.model.on('change', this.scale, this);
		},

		"attributes": function() {
			return {"id" : this.model.get('id')};
		},

		"render"    : function() {
			this.$el.html(this.template(this.model.attributes));

			var that = this;

			this.$('img').on('load', function(){
				that.model.set({
					"loaded" : true,
					"width"  : $(this).width(),
					"height" : $(this).height()
				});
			});

			return this;
		},

		"scale"     : function() {
			this.$el.removeClass('scale-by-width scale-by-height');
			var scale = this.model.needScaling(this.$el.width(), this.$el.height());
			if(scale)
			{
				this.$el.addClass(
					(scale > 0) 
					? 'scale-by-width'
					: 'scale-by-height'
				);
			}
		}
	});

	// init

	

	// jQuery plugin as controller

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