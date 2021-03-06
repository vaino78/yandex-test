$(function(){

	// declaring

	// models

	/**
	 * Модель слайда презентации
	 */
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

		/**
		 * Вычисляет тип масштабирования картинки для размеров контейнера
		 */
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

	/**
	 * Коллекция слайдов презентации
	 */
	var SlideCollection = Backbone.Collection.extend({
		"model" : Slide
	});

	/**
	 * Модель состояния виджета презентации
	 */
	var ViewModel = Backbone.Model.extend({
		"defaults"    : {
			"index"      : 0,
			"slide"      : null,
			"canBack"    : null,
			"canForward" : null,
			"total"      : null,
			"slides"     : new SlideCollection([]),
			"fullscreen" : false,
			"playing"    : false
		},

		"initialize"  : function() {
			this.on('change:index',   this.checkState);
			this.on('change:slides',  this.checkState);
			this.on('change:slides',  this.checkSlides);
			this.on('change:playing', this.checkPlaying);
			this.trigger('change:slides');
		},

		/**
		 * Пересчитывает данные состояния виджета
		 */
		"checkState"  : function() {
			this.set({
				"total"      : this.total(),
				"slide"      : this.slide(this.attributes.index),
				"canBack"    : (this.attributes.index > 0),
				"canForward" : (this.attributes.index < this.attributes.slides.length - 1)
			});
		},

		/**
		 * Осуществляет подписку на события коллекции
		 */
		"checkSlides" : function() {
			this.listenTo(this.attributes.slides, 'all', this.checkState);
		},

		/**
		 * Обработка режима проигрывания презентации
		 */
		"checkPlaying": function() {
			if(this.get('playing'))
			{
				this.playingInterval = setInterval(
					(function(that){ 
						return function() { 
							that.forward(); 
						} 
					})(this),
					5000
				);
			}
			else if(this.playingInterval)
				clearInterval(this.playingInterval);
		},

		/**
		 * Подсчитывает количество слайдов
		 */
		"total"       : function() {
			return this.attributes.slides.length;
		},

		/**
		 * Возвращает слайд по индексу
		 */
		"slide"       : function(index) {
			return this.attributes.slides.at(index);
		},

		/*"validate"    : function(attrs) {
			if(!attrs.total)
				return "Пустая презентация";

			if(attrs.index > attrs.total-1)
				return "Некорректный номер слайда";
		},*/

		/**
		 * Осуществляет переход к предыдущему слайду
		 */
		"back"        : function() {
			if(!this.attributes.canBack)
				return false;
			this.set('index', (this.attributes.index-1));
			return true;
		},

		/**
		 * Осуществляет переход к следующему слайду
		 */
		"forward"     : function() {
			if(!this.attributes.canForward)
			{
				if(this.attributes.playing)
					this.set('playing', false);
				if(this.attributes.fullscreen)
					this.set('fullscreen', false);
				return false;
			}
			this.set('index', (this.attributes.index+1));
			return true;
		},

		/**
		 * Осуществляет переход к первому слайду
		 */
		"begin"       : function() {
			if(!this.attributes.canBack)
				return false;
			this.set('index', 0);
			return true;
		},

		/**
		 * Осуществляет переход к последнему слайду
		 */
		"end"         : function() {
			if(!this.attributes.canForward)
				return false;
			this.set('index', this.total()-1);
			return true;
		},

		"fullscreen"  : function(mode) {
			this.set('fullscreen', mode);
		}
	});


	// views


	/**
	 * Отображение виджета
	 */
	var AppView = Backbone.View.extend({
		"events"     : {
			"click .presentation-nav-back"      : "back",
			"click .presentation-nav-forw"      : "forward",
			"click .presentation-nav-begin"     : "begin",
			"click .presentation-nav-end"       : "end",
			"keydown .presentation-nav-current" : "onCurrentInput",
			"keyup .presentation-nav-current"   : "onCurrentEnter",
			"click .presentation-nav-full"      : "toggleFullscreen",
			"click .presentation-nav-play"      : "togglePlaying",
			"keydown .presentation-pane"        : "onKeyNav"
		},

		"initialize" : function() {
			this.template = _.template($.trim($('#presentationInnerTemplate').html()));

			this.model.on('change:canBack',    this._canBack,    this);
			this.model.on('change:canForward', this._canForward, this);
			this.model.on('change:slide',      this._slide,      this);
			this.model.on('change:total',      this._total,      this);
			this.model.on('change:fullscreen', this._fullscreen, this);
			this.model.on('change:playing',    this._playing,    this);

			this.render();

			this.$playingControl = this.$('.presentation-nav-play');
			this.$pane           = this.$('.presentation-pane');
			this.$error          = this.$('.presentation-error');
			this.$errorText      = this.$('.presentation-error-text');
			this.$backControl    = this['$']('.presentation-nav-back, .presentation-nav-begin');
			this.$forwardControl = this['$']('.presentation-nav-forw, .presentation-nav-end');
			this.$currentControl = this.$('.presentation-nav-current');
			this.$totalControl   = this.$('.presentation-nav-total');
			this.$view           = this.$('.presentation-view');

			this._canBack();
			this._canForward();
			this._slide();
			this._total();
			this._playing();
		},

		/**
		 * Эти методы принимают события окружения и меняют состояние модели
		 */

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
			var keyCode = ev.keyCode || ev.which;
			if(
				(keyCode >= 48 && keyCode <= 57)    // digits
				||
				(keyCode >= 96 && keyCode <= 105)   // numpad
				||
				keyCode == 8                        // backspace
				||
				keyCode == 46                       // delete
				||
				keyCode == 13                       // enter
				||
				(keyCode == 37 || keyCode == 39)    // arrows
			)
				return true;
			
			ev.preventDefault();
		},

		"onCurrentEnter" : function(ev) {
			if(ev.keyCode != 13)
				return;
			var ind = parseInt(ev.target.value);
			if(ind > this.model.get('total'))
			{
				ev.preventDefault();
				return;
			}
			this.model.set('index', (ind-1), {"validate" : true});
			ev.stopPropagation();
		},

		"onKeyNav"       : function(ev) {
			var keyCode = ev.keyCode || ev.which;

			switch(keyCode)
			{
				case 13:
				case 32:
				case 39:
				case 40:
					this.model.forward();
					ev.preventDefault();
					break;
				case  8:
				case 37:
				case 38:
					this.model.back();
					ev.preventDefault();
					break;
				case 36:
					this.model.begin();
					ev.preventDefault();
					break;
				case 35:
					this.model.end();
					ev.preventDefault();
					break;
				case 27:
					if(this.model.get('fullscreen')) {
						this.model.set('fullscreen', false);
						break;
					}

					if(this.model.get('playing'))
						this.model.set('playing', false);
					ev.preventDefault();
					break;
			}
		},

		"toggleFullscreen" : function() {
			this.model.set('fullscreen', !this.model.get('fullscreen'));
		},

		"togglePlaying"    : function() {
			this.model.set('playing', !this.model.get('playing'));
		},

		/**
		 * Эти методы являются обработчиками событий, связанных с изменением состояния модели
		 */

		"_playing"    : function() {
			this.$playingControl.html(
				this.model.get('playing')
				? '&#x25FC'
				: '&#9658;'
			);
		},

		"_fullscreen" : function() {

			var fullScreenEnabled = (
				document.documentElement.requestFullscreen
				||
				document.documentElement.mozRequestFullScreen
				||
				document.documentElement.webkitRequestFullscreen
			);

			if(this.model.get('fullscreen'))
			{
				if(
					fullScreenEnabled
					&&
					!document.fullsreenElement
					&&
					!document.mozFullScreenElement
					&&
					!document.webkitFullscreenElement
				)
				{
					if (document.documentElement.requestFullscreen)
						this.el.requestFullscreen();
					else if (document.documentElement.mozRequestFullScreen)
						this.el.mozRequestFullScreen();
					else if (document.documentElement.webkitRequestFullscreen)
						this.el.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
				}

				if(!fullScreenEnabled || (fullScreenEnabled && window.opera))
				{
					this.$pane.addClass('presentation-pane-fullscreen');
				}
			}
			else
			{
				if(fullScreenEnabled)
				{
					if (document.cancelFullScreen)
						document.cancelFullScreen();
					else if (document.mozCancelFullScreen)
						document.mozCancelFullScreen();
					else if (document.webkitCancelFullScreen)
						document.webkitCancelFullScreen();
				}

				if(!fullScreenEnabled || (fullScreenEnabled && window.opera))
					this.$pane.removeClass('presentation-pane-fullscreen');
			}

			this.model.get('slides').each(function(el){ el.trigger('change'); });
		},

		"_error"     : function() {
			if(this.model.isValid())
			{
				this.$error.hide();
				this.$errorText.text('');
			}
			else
			{
				this.$errorText.text(this.model.validationError);
				this.$error.show();
			}
		},

		"_canBack"   : function(value) {
			this.$backControl.attr('disabled', !this.model.get('canBack'));
		},

		"_canForward": function(value) {
			this.$forwardControl.attr('disabled', !this.model.get('canForward'));
		},

		"_slide"     : function(value) {
			this.$currentControl.val(this.model.get('index') + 1);

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
			this.$totalControl.text(this.model.get('total'));
		},

		"_getByModel": function(m) {
			if(!m)
				return null;

			var element = this.$('#' + m.get('id')).get(0);
			if(!element)
			{
				element = new SlideView({ "model" : m }).render().el;
				this.$view.append(element);
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

	/**
	 * Отображение конкретного слайда
	 */
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