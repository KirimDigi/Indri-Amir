( function( $, elementor ) {

	"use strict";

	var JetElements = {

		callWidget: function ( fnName ) {

            return function ( $scope ) {

                if ( typeof window[fnName] !== 'function' ) {
                    return;
                }

                window[fnName]( $scope );
            };
        },
		
		addedScripts: {},

		addedStyles: {},

		addedAssetsPromises: [],

		init: function() {
			
			var widgets = {
                'jet-carousel.default': JetElements.callWidget( 'widgetCarousel' ),
                'jet-circle-progress.default': JetElements.callWidget( 'widgetProgress' ),
                'jet-map.default': JetElements.callWidget( 'widgetMap' ),
                'jet-countdown-timer.default': JetElements.callWidget( 'widgetCountdown' ),
                'jet-brands.default': JetElements.callWidget( 'widgetBrands' ),
                'jet-posts.default': JetElements.callWidget( 'widgetPosts' ),
                'jet-animated-text.default': JetElements.callWidget( 'widgetAnimatedText' ),
                'jet-animated-box.default': JetElements.callWidget( 'widgetAnimatedBox' ),
                'jet-images-layout.default': JetElements.callWidget( 'widgetImagesLayout' ),
                'jet-slider.default': JetElements.callWidget( 'widgetSlider' ),
                'jet-testimonials.default': JetElements.callWidget( 'widgetTestimonials' ),
                'jet-image-comparison.default': JetElements.callWidget( 'widgetImageComparison' ),
                'jet-instagram-gallery.default': JetElements.callWidget( 'widgetInstagramGallery' ),
                'jet-scroll-navigation.default': JetElements.callWidget( 'widgetScrollNavigation' ),
                'jet-subscribe-form.default': JetElements.callWidget( 'widgetSubscribeForm' ),
                'jet-progress-bar.default': JetElements.callWidget( 'widgetProgressBar' ),
                'jet-portfolio.default': JetElements.callWidget( 'widgetPortfolio' ),
                'jet-timeline.default': JetElements.callWidget( 'widgetTimeLine' ),
                'jet-table.default': JetElements.callWidget( 'widgetTable' ),
                'jet-dropbar.default': JetElements.callWidget( 'widgetDropbar' ),
                'jet-video.default': JetElements.callWidget( 'widgetVideo' ),
                'jet-audio.default': JetElements.callWidget( 'widgetAudio' ),
                'jet-horizontal-timeline.default': JetElements.callWidget( 'widgetHorizontalTimeline' ),
                'mp-timetable.default': JetElements.callWidget( 'widgetTimeTable' ),
                'jet-pie-chart.default': JetElements.callWidget( 'widgetPieChart' ),
                'jet-bar-chart.default': JetElements.callWidget( 'widgetBarChart' ),
                'jet-line-chart.default': JetElements.callWidget( 'widgetLineChart' ),
                'jet-lottie.default': JetElements.callWidget( 'widgetLottie' ),
                'jet-pricing-table.default': JetElements.callWidget( 'widgetPricingTable' ),
            };

            $.each(widgets, function ( widget, callback ) {
                elementorFrontend.hooks.addAction(
                    'frontend/element_ready/' + widget,
                    callback
                );
            });

            elementorFrontend.hooks.addAction(
                'frontend/element_ready/section',
                JetElements.elementorSection
            );

            elementorFrontend.hooks.addAction(
                'frontend/element_ready/container',
                JetElements.elementorSection
            );

			// Re-init widgets in nested tabs
			window.elementorFrontend.elements.$window.on(
				'elementor/nested-tabs/activate',
				( event, content ) => {

					const $content = $( content );										
					requestAnimationFrame(() => {
						JetElements.reinitSlickSlider( $content );
						JetElements.initWidgetsHandlers( $content );
					});
				}
			);

			elementorFrontend.hooks.addAction( 'frontend/element_ready/loop-carousel.post', function ( $scope ) {
					
				var $loopCarousel = $scope.find('.swiper');
		
				if ( !$loopCarousel.length ) return;
		
				var swiperEl = $loopCarousel[0];
				var checkSwiper = setInterval(function () {
					if ( !swiperEl.swiper ) return;
		
					clearInterval( checkSwiper );
					var swiperInstance = swiperEl.swiper;
		
					var $audioControls = $scope.find(
						'.mejs-time-slider, .mejs-horizontal-volume-slider, .mejs-volume-button'
					);
		
					if ( $audioControls.length ) {
						// Fix swiper loop glitch when audio progress is active
						if ( swiperInstance.params.loop && swiperInstance.params.slidesPerView === 1 ) {
							swiperInstance.on('slideChangeTransitionEnd.audioFix', function () {
								this.loopFix();
							});
						}
		
						// Disable swipe on audio interaction
						$audioControls.off('.audioSwipe').on('pointerdown.audioSwipe', function ( event ) {
								if ( event.button !== 0 ) return;
								swiperInstance.allowTouchMove = false;
								event.stopPropagation();
							});
		
						// Re-enable swipe
						$audioControls.on( 'pointerup.audioSwipe pointercancel.audioSwipe', function ( event ) {
							if ( event.button !== 0 ) return;
							setTimeout( function () {
								swiperInstance.allowTouchMove = true;
							}, 200 );
							event.stopPropagation();
						});
					}
				}, 50);
			}
		);

		// Handle slider inside nested accordion
		elementorFrontend.hooks.addAction( 'frontend/element_ready/nested-accordion.default', function ( $scope ) {
			
			$scope.find('.e-n-accordion-item').each(function() {
				const item = this;
				new MutationObserver(function(mutations) {
					mutations.forEach(function(mutation) {
						if ( mutation.type === 'attributes' && mutation.attributeName === 'open' && item.hasAttribute('open') ) {
							$( item ).find('.slider-pro').each(function () {
								$( this ).sliderPro('update');
							});
						}
					});
				}).observe(item, {
					attributes: true,
					attributeFilter: ['open']
				});
			});
		} );
		},	

		reinitSlickSlider: function( $scope ) {

			var $sliders = $scope.find(`
				[data-widget_type="jet-carousel.default"] .slick-initialized,
				[data-widget_type="jet-testimonials.default"] .slick-initialized,
				[data-widget_type="jet-image-comparison.default"] .slick-initialized,
				[data-widget_type="jet-posts.default"] .slick-initialized,
				[data-widget_type="jet-brands.default"] .slick-initialized
			`);

			if ( $sliders.length ) {
				$sliders.each( function() {
					$( this ).slick('unslick');
				} );
			}
		},

		loadScriptAsync: function( script, uri ) {

			if ( JetElements.addedScripts.hasOwnProperty( script ) ) {
				return script;
			}

			if ( !uri ) {
				return;
			}

			JetElements.addedScripts[ script ] = uri;

			return new Promise( function( resolve, reject ) {
				var tag = document.createElement( 'script' );

				tag.src    = uri;
				tag.async  = true;
				tag.onload = function() {
					resolve( script );
				};

				document.head.appendChild( tag );
			});
		},

		loadStyle: function( style, uri ) {


			if ( JetElements.addedStyles.hasOwnProperty( style ) && JetElements.addedStyles[ style ] ===  uri) {
				return style;
			}

			if ( !uri ) {
				return;
			}

			JetElements.addedStyles[ style ] = uri;

			return new Promise( function( resolve, reject ) {
				var tag = document.createElement( 'link' );

				tag.id      = style;
				tag.rel     = 'stylesheet';
				tag.href    = uri;
				tag.type    = 'text/css';
				tag.media   = 'all';
				tag.onload  = function() {
					resolve( style );
				};

				document.head.appendChild( tag );
			});
		},

		initWidgetsHandlers: function( $selector ) {

			$selector.find( '.elementor-widget-jet-slider, .elementor-widget-jet-testimonials, .elementor-widget-jet-carousel, .elementor-widget-jet-portfolio, .elementor-widget-jet-horizontal-timeline, .elementor-widget-jet-image-comparison, .elementor-widget-jet-posts, .elementor-widget-jet-brands, .jet-parallax-section' ).each( function() {
				
				var $this       = $( this ),
					elementType = $this.data( 'element_type' );

				if ( !elementType ) {
					return;
				}

				if ( 'widget' === elementType ) {
					elementType = $this.data( 'widget_type' );
					window.elementorFrontend.hooks.doAction( 'frontend/element_ready/widget', $this, $ );
				}

				window.elementorFrontend.hooks.doAction( 'frontend/element_ready/global', $this, $ );
				window.elementorFrontend.hooks.doAction( 'frontend/element_ready/' + elementType, $this, $ );

			} );
		},

		initElementsHandlers: function( $selector ) {
			$selector.find( '[data-element_type]' ).each( function() {
				var $this       = $( this ),
					elementType = $this.data( 'element_type' );

				if ( !elementType ) {
					return;
				}

				if ( 'widget' === elementType ) {
					elementType = $this.data( 'widget_type' );
					window.elementorFrontend.hooks.doAction( 'frontend/element_ready/widget', $this, $ );
				}

				window.elementorFrontend.hooks.doAction( 'frontend/element_ready/global', $this, $ );
				window.elementorFrontend.hooks.doAction( 'frontend/element_ready/' + elementType, $this, $ );

			} );
		},

		observer: function( $elements, callback, options = {} ) {
			// Default options: activate a section when at least 50% of it is visible
			const defaultOptions = {
				threshold: 0.5,      // Activate when the element is more than half visible
				triggerOnce: false,  // Continuously observe the element
			};
		
			// Merge custom options with defaults
			options = jQuery.extend( defaultOptions, options );

			const observerOptions = {
				root: null,         // Use the browser viewport as the container
				rootMargin: '0px',  // No margin adjustment, relying solely on threshold
				threshold: options.threshold
			};
		
			// To determine scroll direction, store the previous Y-coordinate for each element
			const previousY = new WeakMap();
		
			const observer = new IntersectionObserver(( entries ) => {
				// First, determine the scroll direction for each entry
				entries.forEach( entry => {
					const currentY = entry.boundingClientRect.y;
					const prevY = previousY.get( entry.target ) || currentY;
					// Add a new property "direction" to the entry object
					entry.direction = currentY < prevY ? 'down' : 'up';
					previousY.set( entry.target, currentY );
				});
		
				// Filter entries with an intersection ratio greater or equal to the threshold (e.g., 50%)
				const visibleEntries = entries.filter( entry => entry.intersectionRatio >= options.threshold );
		
				// If there are visible entries, choose the one with the highest intersection ratio
				if ( visibleEntries.length > 0 ) {
					visibleEntries.sort(( a, b ) => b.intersectionRatio - a.intersectionRatio );
					callback.call( visibleEntries[0].target, visibleEntries[0].direction, visibleEntries[0] );
				}
			}, observerOptions );
		
			// Attach the observer to every element in the collection
			$elements.each( function() {
				observer.observe( this );
			});
		
			return observer;
		},

		prepareWaypointOptions: function( $scope, waypointOptions ) {
			var options = waypointOptions || {},
				$parentPopup = $scope.closest( '.jet-popup__container-inner, .elementor-popup-modal .dialog-message' );

			if ( $parentPopup[0] ) {
				options.context = $parentPopup[0];
			}

			return options;
		},

		widgetTimeTable: function( $scope ) {

			var $mptt_shortcode_wrapper = $scope.find( '.mptt-shortcode-wrapper' );

			if ( ( typeof typenow ) !== 'undefined' ) {
				if ( pagenow === typenow ) {
					switch ( typenow ) {

						case 'mp-event':
							Registry._get( 'Event' ).init();
							break;

						case 'mp-column':
							Registry._get( 'Event' ).initDatePicker();
							Registry._get( 'Event' ).columnRadioBox();
							break;

						default:
							break;
					}
				}
			}

			if ( $mptt_shortcode_wrapper.length ) {

				Registry._get( 'Event' ).initTableData();
				Registry._get( 'Event' ).filterShortcodeEvents();
				Registry._get( 'Event' ).getFilterByHash();

				$mptt_shortcode_wrapper.show();
			}

			if ( $( '.upcoming-events-widget' ).length || $mptt_shortcode_wrapper.length ) {
				Registry._get( 'Event' ).setColorSettings();
			}
		},

		elementorSection: function( $scope ) {
			var $target   = $scope,
				instance  = null,
				editMode  = Boolean( elementor.isEditMode() );

				instance = new jetSectionParallax( $target );
				instance.init();
		},

		initCarousel: function( $target, options ) {

			var	defaultOptions,
				slickOptions,
				responsive        = [],
				eTarget           = $target.closest( '.elementor-widget' ),
				breakpoints       = JetElementsTools.getElementorElementSettings( eTarget ),
				activeBreakpoints = elementor.config.responsive.activeBreakpoints,
				dotsEnable        = options.dots,
				accessibility     = true,
				prevDeviceToShowValue,
				prevDeviceToScrollValue,
				slidesCount,
				jetListing        = eTarget.closest( '.jet-listing-grid' ).hasClass( 'jet-listing' ),
				jetListingItem    = eTarget.closest( '.jet-listing-grid__item' ),
				jetnextArrow      = eTarget.find( '.prev-arrow' ),
				jetprevArrow      = eTarget.find( '.next-arrow' ),
				isMobileCheck     = JetElementsTools.mobileAndTabletcheck();

			// Compatibility slick carousel with jet listing
			if ( jetListing && jetListingItem ){

				options.nextArrow = false;
				options.prevArrow = false;

				jetListingItem.find( jetnextArrow ).on( 'click', function () {
					$target.slick( 'slickPrev' );
				});

				jetListingItem.find( jetprevArrow ).on( 'click', function () {
					$target.slick( 'slickNext' );
				});
			}

			if ( $target.hasClass( 'jet-image-comparison__instance' ) ) {
				accessibility = false;
				setTimeout( function() {
					$target.on( 'beforeChange', function() {
						var _this = $( this );

						_this.find( '.slick-slide' ).each( function() {
							$( this ).find( '.jx-controller' ).attr( 'tabindex', '' );
							$( this ).find( '.jx-label').attr( 'tabindex', '' );
						} );
					} );

					$target.on( 'afterChange', function() {
						var _this = $(this);

						_this.find( '.slick-slide.slick-active' ).each( function() {
							$( this ).find( '.jx-controller' ).attr( 'tabindex', '0' );
							$( this ).find( '.jx-label').attr( 'tabindex', 0 );
						} );
					} );

				}, 100 );
			}

			if ( $target.hasClass( 'jet-posts' ) && $target.parent().hasClass( 'jet-carousel' ) ) {
				function renameKeys( obj, newKeys ) {
					const keyValues = Object.keys( obj ).map( key => {
						const newKey = newKeys[key] || key;
						return { [newKey]: obj[key] };
					} );
					return Object.assign( {}, ...keyValues );
				}

				var newBreakpointsKeys = {
					columns: "slides_to_show",
					columns_widescreen: "slides_to_show_widescreen",
					columns_laptop: "slides_to_show_laptop",
					columns_tablet_extra: "slides_to_show_tablet_extra",
					columns_tablet: "slides_to_show_tablet",
					columns_mobile_extra: "slides_to_show_mobile_extra",
					columns_mobile: "slides_to_show_mobile"
				};

				breakpoints = renameKeys( breakpoints, newBreakpointsKeys );
				slidesCount = $( '> div.jet-posts__item', $target ).length;
			} else {
				slidesCount = $( '> div', $target ).length;
			}

			options.slidesToShow   = +breakpoints.slides_to_show;
			options.slidesToScroll = breakpoints.slides_to_scroll ? +breakpoints.slides_to_scroll : 1;

			Object.keys( activeBreakpoints ).forEach( function( breakpointName ) {
				if ( 'widescreen' === breakpointName ) {
					options.slidesToShow = ( "slides_to_show_widescreen" in breakpoints ) && '' != breakpoints.slides_to_show_widescreen ? +breakpoints.slides_to_show_widescreen : +breakpoints.slides_to_show;

					if ( ( "slides_to_scroll_widescreen" in breakpoints ) && '' != breakpoints.slides_to_scroll_widescreen ) {
						options.slidesToScroll = +breakpoints.slides_to_scroll_widescreen;
					} else {
						if ( options.slidesToShow > +breakpoints.slides_to_scroll ) {
							options.slidesToScroll = +breakpoints.slides_to_scroll;
						} else {
							options.slidesToScroll = options.slidesToShow;
						}
					}
				}
			} );

			if ( options.slidesToShow >= slidesCount ) {
				options.dots = false;
			}

			prevDeviceToShowValue   = options.slidesToShow;
			prevDeviceToScrollValue = options.slidesToScroll;

			setTimeout( function() {
				$( '.slick-slide', $target ).each( function () {
					if ( $(this).attr('aria-describedby') != undefined ) {
						$( this ).attr('id', $( this ).attr( 'aria-describedby' ) );
					}
				} );

				$( '.jet-slick-dots', $target ).removeAttr( 'role' );

				$( '.jet-slick-dots li', $target ).each( function() {
					$( this ).removeAttr( 'role' );
					$( this ).attr( 'tabindex', '0' );
				} );
			}, 100 );

			$target.on( 'init reInit', function() {
				$( '.jet-slick-dots', $target ).removeAttr( 'role' );

				$( '.jet-slick-dots li', $( this ) ).each( function() {
					$( this ).removeAttr( 'role' );
					$( this ).attr( 'tabindex', '0' );
				} );

				$( '.jet-slick-dots li', $( this ) ).keydown( function( e ) {
					var $this   = $( this ),
						$which  = e.which || e.keyCode;

					if ( $which == 13 || $which == 32 ) {
						$this.click();
					}

					if ( $which == 37 ) {
						if ( 0 != $this.prev().length ) {
							$this.prev().focus();
							$this.prev().click();
						}
					}

					if ( $which == 39 ) {
						if ( 0 != $this.next().length ) {
							$this.next().focus();
							$this.next().click();
						}
					}
				} );

				$( '.jet-arrow', eTarget ).attr( 'tabindex', 0 );

				$( '.jet-arrow', eTarget ).keydown( function( e ) {
					var $this  = $( this ),
						$which = e.which || e.keyCode;

					if ( $which == 13 || $which == 32 ) {
						$this.click();
					}

					if ( $which == 37 ) {
						if ( 0 != $this.prev().length && $this.prev().hasClass( 'slick-arrow' ) ) {
							$this.prev().focus();
						}
					}

					if ( $which == 39 && $this.next().hasClass( 'slick-arrow' ) ) {
						if ( 0 != $this.next().length ) {
							$this.next().focus();
						}
					}
				} );

				if ( $target.hasClass( 'jet-image-comparison__instance' ) ) {
					setTimeout( function() {
						$target.find( '.slick-slide.slick-active' ).each( function() {
							$( this ).find( '.jx-controller' ).attr( 'tabindex', '0' );
							$( this ).find( '.jx-label').attr( 'tabindex', '0' );
						} );
					}, 100 );
				}

				//fix lazyload image loading
				var slidesTrack = $( '.slick-track', $target );

				slidesTrack.find( '.slick-slide' ).each( function() {

					var _this   = $( this ),
						itemImg = $( '.jet-carousel__item-img', _this );

					var observer = new IntersectionObserver( function( entries ) {
						if ( entries[0].isIntersecting === true ) {

							itemImg.each( function() {
								var attr = $( this ).attr( 'loading' );

								if ( typeof attr !== 'undefined' && attr !== false ) {
									if ( 0  === $( this ).width() ) {
										$( this ).attr( 'loading', "" );
									}
								}
							} )
							observer.unobserve( entries[0].target );
						}
					}, { threshold: [0] } );

					observer.observe( _this[0] );
				} );

				if ( options.infinite ) {
					var $items        = $( this ),
						$clonedSlides = $( '> .slick-list > .slick-track > .slick-cloned.jet-carousel__item', $items );

					if ( !$clonedSlides.length ) {
						return;
					}

					JetElements.initElementsHandlers( $clonedSlides );
				}
			} );

			if ( $target.hasClass( 'slick-initialized' ) ) {
				$target.not('.slick-initialized').slick('refresh', true );
				return;
			}

			Object.keys( activeBreakpoints ).reverse().forEach( function( breakpointName ) {

				if ( breakpoints['slides_to_show_' + breakpointName] || breakpoints['slides_to_scroll_' + breakpointName] ) {

					var breakpointSetting = {
						breakpoint: null,
						settings: {}
					}

					breakpointSetting.breakpoint = 'widescreen' != breakpointName ? activeBreakpoints[breakpointName].value : activeBreakpoints[breakpointName].value - 1;

					if ( 'widescreen' === breakpointName ) {
						breakpointSetting.settings.slidesToShow   = +breakpoints['slides_to_show'];
						breakpointSetting.settings.slidesToScroll = +breakpoints['slides_to_scroll'] ? +breakpoints['slides_to_scroll']: 1;

					} else {
						breakpointSetting.settings.slidesToShow = breakpoints['slides_to_show_' + breakpointName] ? +breakpoints['slides_to_show_' + breakpointName] : prevDeviceToShowValue;

						breakpointSetting.settings.slidesToScroll = breakpoints['slides_to_scroll_' + breakpointName] ? +breakpoints['slides_to_scroll_' + breakpointName] : prevDeviceToScrollValue;
					}

					if ( breakpointSetting.settings.slidesToShow >= slidesCount ) {
						breakpointSetting.settings.dots = false;
					} else {
						if ( dotsEnable ) {
							breakpointSetting.settings.dots = true;
						}
					}

					prevDeviceToShowValue   = breakpointSetting.settings.slidesToShow;
					prevDeviceToScrollValue = breakpointSetting.settings.slidesToScroll

					responsive.push( breakpointSetting );
				}
			} );

			options.responsive = responsive;

			if ( options.slidesToShow >= slidesCount ) {
				options.dots = false;
			}

			// Disable variableWidth on mobile if it was requested

			if ( isMobileCheck && options.variableWidth ) {
				options.variableWidth = false;
				options.centerMode = false;
				options.slidesToScroll = 1;
				options.slidesToShow = 1;
			}

			// Enable centerMode when variableWidth is active on desktop

			else if ( options.variableWidth ) {
				options.slidesToShow = 1;
				options.centerMode = true;
			}

			defaultOptions = {
				customPaging: function(slider, i) {
					return $( '<span />' ).text( i + 1 );
				},
				dotsClass: 'jet-slick-dots',
				accessibility: accessibility
			};

			slickOptions = $.extend( {}, defaultOptions, options );

			$target.slick( slickOptions );

			if ( $target.hasClass( 'jet-image-comparison__instance' ) ) {
				let juxtaposeSlidersLength = window.juxtapose.sliders.length;

				for ( let i = 0; i < juxtaposeSlidersLength; i++ ) {
					window.juxtapose.sliders[i].setWrapperDimensions();
				}
			}
		},
	};

	window.JetElements = JetElements;

	$( window ).on( 'elementor/frontend/init', JetElements.init );

	var JetElementsTools = {

		getElementPercentageSeen: function( $element, offset ) {
			var offsetSettings      = offset || {},
				startOffset         = offsetSettings.start || 0,
				endOffset           = offsetSettings.end || 0,
				viewportHeight      = $( window ).height(),
				viewportStartOffset = viewportHeight * startOffset / 100,
				viewportEndOffset   = viewportHeight * endOffset / 100,
				scrollTop           = $( window ).scrollTop(),
				elementOffsetTop    = $element.offset().top,
				elementHeight       = $element.height(),
				percentage;

			percentage = (scrollTop + viewportHeight + viewportStartOffset - elementOffsetTop) / (viewportHeight + viewportStartOffset + viewportEndOffset + elementHeight);
			percentage = Math.min( 100, Math.max( 0, percentage * 100 ) );

			return parseFloat( percentage.toFixed( 2 ) );
		},

		isRTL: function() {
			return $( 'body' ).hasClass( 'rtl' );
		},

		inArray: function( needle, haystack ) {
			return -1 < haystack.indexOf( needle );
		},

		debounce: function( threshold, callback ) {
			var timeout;

			return function debounced( $event ) {
				function delayed() {
					callback.call( this, $event );
					timeout = null;
				}

				if ( timeout ) {
					clearTimeout( timeout );
				}

				timeout = setTimeout( delayed, threshold );
			};
		},

		getObjectNextKey: function( object, key ) {
			var keys      = Object.keys( object ),
				idIndex   = keys.indexOf( key ),
				nextIndex = idIndex += 1;

			if( nextIndex >= keys.length ) {
				//we're at the end, there is no next
				return false;
			}

			var nextKey = keys[ nextIndex ];

			return nextKey;
		},

		getObjectPrevKey: function( object, key ) {
			var keys      = Object.keys( object ),
				idIndex   = keys.indexOf( key ),
				prevIndex = idIndex -= 1;

			if ( 0 > idIndex ) {
				//we're at the end, there is no next
				return false;
			}

			var prevKey = keys[ prevIndex ];

			return prevKey;
		},

		getObjectFirstKey: function( object ) {
			return Object.keys( object )[0];
		},

		getObjectLastKey: function( object ) {
			return Object.keys( object )[ Object.keys( object ).length - 1 ];
		},

		getObjectValues: function( object ) {
			var values;

			if ( !Object.values ) {
				values = Object.keys( object ).map( function( e ) {
					return object[e]
				} );

				return values;
			}

			return Object.values( object );
		},

		validateEmail: function( email ) {
			var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

			return re.test( email );
		},

		mobileAndTabletcheck: function() {
			var check = false;

			(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);

			return check;
		},

		addThousandCommaSeparator: function ( nStr, separator ) {

			var nStr      = nStr + '',
				separator = separator.toString().replace(/[0-9]/g, ''),
				x         = nStr.split('.'),
				x1        = x[0],
				x2        = x.length > 1 ? '.' + x[1] : '',
				rgx       = /(\d+)(\d{3})/;

			if ( '' === separator )	{
				return nStr;
			}

			while ( rgx.test(x1) ) {
				x1 = x1.replace(rgx, '$1' + separator + '$2');
			}

			return x1 + x2;
		},

		getElementorElementSettings: function( $scope ) {

			if ( window.elementorFrontend && window.elementorFrontend.isEditMode() && $scope.hasClass( 'elementor-element-edit-mode' ) ) {
				return JetElementsTools.getEditorElementSettings( $scope );
			}

			return $scope.data( 'settings' ) || {};
		},

		getEditorElementSettings: function( $scope ) {
			var modelCID = $scope.data( 'model-cid' ),
				elementData;

			if ( ! modelCID ) {
				return {};
			}

			if ( ! elementor.hasOwnProperty( 'config' ) ) {
				return {};
			}

			if ( ! elementor.config.hasOwnProperty( 'elements' ) ) {
				return {};
			}

			if ( ! elementor.config.elements.hasOwnProperty( 'data' ) ) {
				return {};
			}

			elementData = elementor.config.elements.data[ modelCID ];

			if ( ! elementData ) {
				return {};
			}

			return elementData.toJSON();
		}
	}

	window.JetElementsTools = JetElementsTools;

	/**
	 * jetSectionParallax Class
	 *
	 * @return {void}
	 */
	window.jetSectionParallax = function( $target ) {
		var self             = this,
			sectionId        = $target.data('id'),
			settings         = false,
			editMode         = Boolean( elementor.isEditMode() ),
			$window          = $( window ),
			$body            = $( 'body' ),
			scrollLayoutList = [],
			mouseLayoutList  = [],
			winScrollTop     = $window.scrollTop(),
			winHeight        = $window.height(),
			requesScroll     = null,
			requestMouse     = null,
			tiltx            = 0,
			tilty            = 0,
			isSafari         = !!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/),
			platform         = navigator.platform;

		/**
		 * Init
		 */
		self.init = function() {

			if ( ! editMode ) {
				settings = $target.data('settings') || false;
				settings = false != settings ? settings['jet_parallax_layout_list'] : false;
			} else {
				settings = self.generateEditorSettings( $target );
			}

			if ( ! settings ) {
				return false;
			}

			self.generateLayouts();

			$window.on( 'resize.jetSectionParallax orientationchange.jetSectionParallax', JetElementsTools.debounce( 30, self.generateLayouts ) );

			if ( 0 !== scrollLayoutList.length ) {
				$window.on( 'scroll.jetSectionParallax resize.jetSectionParallax', self.scrollHandler );
			}

			if ( 0 !== mouseLayoutList.length ) {
				$target.on( 'mousemove.jetSectionParallax resize.jetSectionParallax', self.mouseMoveHandler );
				$target.on( 'mouseleave.jetSectionParallax', self.mouseLeaveHandler );
			}

			self.scrollUpdate();
		};

		self.generateEditorSettings = function( $target ) {
			var editorElements      = null,
				sectionsData        = {},
				sectionData         = {},
				sectionParallaxData = {},
				settings            = [];

			if ( ! window.elementor.hasOwnProperty( 'elements' ) ) {
				return false;
			}

			sectionData = JetElementsTools.getElementorElementSettings( $target );

			if ( ! sectionData.hasOwnProperty( 'jet_parallax_layout_list' ) || 0 === Object.keys( sectionData ).length ) {
				return false;
			}

			sectionParallaxData = sectionData[ 'jet_parallax_layout_list' ];

			$.each( sectionParallaxData, function( index, obj ) {
				settings.push( obj );
			} );

			if ( 0 !== settings.length ) {
				return settings;
			}

			return false;
		};

		self.generateLayouts = function() {

			$( '.jet-parallax-section__layout', $target ).remove();

			$.each( settings, function( index, layout ) {
				var imageData      = layout['jet_parallax_layout_image'],
					speed          = layout['jet_parallax_layout_speed']['size'] || 50,
					zIndex         = layout['jet_parallax_layout_z_index'],
					animProp       = layout['jet_parallax_layout_animation_prop'] || 'bgposition',
					deviceMode     = elementorFrontend.getCurrentDeviceMode(),
					activeBreakpoints = elementor.config.responsive.activeBreakpoints,
					activeBreakpointsArray = [],
					bgX            = layout['jet_parallax_layout_bg_x'],
					bgY            = layout['jet_parallax_layout_bg_y'],
					type           = layout['jet_parallax_layout_type'] || 'none',
					direction      = layout['jet_parallax_layout_direction'] || '1',
					fxDirection    = layout['jet_parallax_layout_fx_direction'] || 'fade-in',
					device         = layout['jet_parallax_layout_on'] || ['desktop', 'tablet'],
					_id            = layout['_id'],
					$layout        = null,
					layoutData     = {},
					safariClass    = isSafari ? ' is-safari' : '',
					macClass       = 'MacIntel' == platform ? ' is-mac' : '';

				if ( -1 === device.indexOf( deviceMode ) ) {
					return false;
				}
			
				
				for ( var [key, value] of Object.entries( activeBreakpoints ) ) {
					if ( 'widescreen' === key ) {
						activeBreakpointsArray.push( 'desktop' );
						activeBreakpointsArray.push( key );
					} else {
						activeBreakpointsArray.push( key );
					}
					
				}

				if ( -1 === activeBreakpointsArray.indexOf( 'widescreen' ) ) {
					activeBreakpointsArray.push( 'desktop' );
				}

				activeBreakpointsArray = activeBreakpointsArray.reverse();

				var breakpoints = [ 'widescreen', 'desktop', 'laptop', 'tablet_extra', 'tablet', 'mobile_extra', 'mobile'],
					i = 0,
					prevDevice,
					layoutBreakpoinntsSettings = [];

				breakpoints.forEach( function( item ) {

					if ( -1 != activeBreakpointsArray.indexOf( item ) ) {

						layoutBreakpoinntsSettings[i] = [];

						if ( 'widescreen' === item ) {
							layoutBreakpoinntsSettings[i][item] = {
								'bgX' : '' != layout['jet_parallax_layout_bg_x_' + item] ? layout['jet_parallax_layout_bg_x'] : 0,

								'bgY' : '' != layout['jet_parallax_layout_bg_y_' + item] ? layout['jet_parallax_layout_bg_y'] : 0,

								'layoutImageData' : '' != layout['jet_parallax_layout_image_' + item] ? layout['jet_parallax_layout_image_' + item] : ''
							};
						} else if ( 'desktop' === item ) {
							layoutBreakpoinntsSettings[i][item] = {
								'bgX' : '' != layout['jet_parallax_layout_bg_x'] ? layout['jet_parallax_layout_bg_x'] : 0,

								'bgY' : '' != layout['jet_parallax_layout_bg_y'] ? layout['jet_parallax_layout_bg_y'] : 0,

								'layoutImageData' : imageData['url'] || layout['jet_parallax_layout_image']['url']
							};
						} else {
							layoutBreakpoinntsSettings[i][item] = {
								'bgX': ( layout['jet_parallax_layout_bg_x_' + item] && '' != layout['jet_parallax_layout_bg_x_' + item] ) ? layout['jet_parallax_layout_bg_x_' + item] : layoutBreakpoinntsSettings[i-1][prevDevice].bgX,

								'bgY' : ( layout['jet_parallax_layout_bg_y_' + item] && '' != layout['jet_parallax_layout_bg_y_' + item] ) ? layout['jet_parallax_layout_bg_y_' + item] : layoutBreakpoinntsSettings[i-1][prevDevice].bgY,

								'layoutImageData' : ( layout['jet_parallax_layout_image_' + item] && '' != layout['jet_parallax_layout_image_' + item]['url'] ) ? layout['jet_parallax_layout_image_' + item]['url'] : layoutBreakpoinntsSettings[i-1][prevDevice].layoutImageData
							};
						}

						if ( deviceMode === item ) {
							bgX    = layoutBreakpoinntsSettings[i][item].bgX;
							bgY    = layoutBreakpoinntsSettings[i][item].bgY;
							imageData = layoutBreakpoinntsSettings[i][item].layoutImageData;
						}

						prevDevice = item;

						i++;
					}

				} );

				if ( ! $target.hasClass( 'jet-parallax-section' ) ) {
					$target.addClass( 'jet-parallax-section' );
				}

				$layout = $( '<div class="jet-parallax-section__layout elementor-repeater-item-' + _id + ' jet-parallax-section__' + type +'-layout' + macClass + '"><div class="jet-parallax-section__image"></div></div>' )
					.prependTo( $target )
					.css( {
						'z-index': zIndex
					} );

				var imageCSS = {
					'background-position-x': bgX + '%',
					'background-position-y': bgY + '%',
					'background-image': 'url(' + imageData + ')'
				};

				$( '> .jet-parallax-section__image', $layout ).css( imageCSS );

				layoutData = {
					selector: $layout,
					prop: animProp,
					type: type,
					device: device,
					xPos: bgX,
					yPos: bgY,
					direction: +direction,
					fxDirection: fxDirection,
					speed: 2 * ( speed / 100 )
				};

				if ( 'none' !== type ) {
					if ( JetElementsTools.inArray( type, ['scroll', 'h-scroll', 'zoom', 'rotate', 'blur', 'opacity'] ) ) {
						scrollLayoutList.push( layoutData );
					}

					if ( 'mouse' === type ) {
						mouseLayoutList.push( layoutData );
					}
				}

			} );

		};

		self.scrollHandler = function( event ) {
			winScrollTop = $window.scrollTop();
			winHeight    = $window.height();

			self.scrollUpdate();
		};

		self.scrollUpdate = function() {
			$.each( scrollLayoutList, function( index, layout ) {

				var $this      = layout.selector,
					$image     = $( '.jet-parallax-section__image', $this ),
					speed      = layout.speed,
					offsetTop  = $this.offset().top,
					thisHeight = $this.outerHeight(),
					prop       = layout.prop,
					type       = layout.type,
					dir        = layout.direction,
					fxDir      = layout.fxDirection,
					posY       = ( winScrollTop - offsetTop + winHeight ) / thisHeight * 100,
					device     = elementorFrontend.getCurrentDeviceMode();

				if ( -1 === layout.device.indexOf( device ) ) {
					$image.css( {
						'transform': 'translateX(0) translateY(0)',
						'background-position-y': layout.yPos,
						'background-position-x': layout.xPos,
						'filter': 'none',
						'opacity': '1'
					} );

					return false;
				}

				if ( winScrollTop < offsetTop - winHeight ) posY = 0;
				if ( winScrollTop > offsetTop + thisHeight) posY = 200;

				posY = parseFloat( speed * posY ).toFixed(1);

				switch( type ) {
					case 'scroll':
						if ( 'bgposition' === prop ) {
							$image.css( {
								'background-position-y': 'calc(' + layout.yPos + '% + ' + (posY * dir) + 'px)'
							} );
						} else {
							$image.css( {
								'transform': 'translateY(' + (posY * dir) + 'px)'
							} );
						}
						break;
					case 'h-scroll':
						if ( 'bgposition' === prop ) {
							$image.css( {
								'background-position-x': 'calc(' + layout.xPos + '% + ' + (posY * dir) + 'px)'
							} );
						} else {
							$image.css( {
								'transform': 'translateX(' + (posY * dir) + 'px)'
							} );
						}
						break;
					case 'zoom':
						var deltaScale = ( winScrollTop - offsetTop + winHeight ) / winHeight,
							scale      = deltaScale * speed;

						scale = scale + 1;

						$image.css( {
							'transform': 'scale(' + scale + ')'
						} );
						break;
					case 'rotate':
						var rotate = posY;

						$image.css( {
							'transform': 'rotateZ(' + (rotate * dir) + 'deg)'
						} );
						break;
					case 'blur':
						var blur = 0;

						switch ( fxDir ) {
							case 'fade-in':
								blur = posY / 40;
								break;

							case 'fade-out':
								blur = (5 * speed) - (posY / 40);
								break
						}

						$image.css( {
							'filter': 'blur(' + blur + 'px)'
						} );
						break;
					case 'opacity':
						var opacity = 1;

						switch ( fxDir ) {
							case 'fade-in':
								opacity = 1 - (posY / 400);
								break;

							case 'fade-out':
								opacity = (1 - (0.5 * speed)) + (posY / 400);
								break
						}

						$image.css( {
							'opacity': opacity
						} );
						break;
				}

			} );
		};

		self.mouseMoveHandler = function( event ) {
			var windowWidth  = $window.width(),
				windowHeight = $window.height(),
				cx           = Math.ceil( windowWidth / 2 ),
				cy           = Math.ceil( windowHeight / 2 ),
				dx           = event.clientX - cx,
				dy           = event.clientY - cy;

			tiltx = -1 * ( dx / cx );
			tilty = -1 * ( dy / cy );

			self.mouseMoveUpdate();
		};

		self.mouseLeaveHandler = function( event ) {

			$.each( mouseLayoutList, function( index, layout ) {
				var $this  = layout.selector,
					$image = $( '.jet-parallax-section__image', $this );

				switch( layout.prop ) {
					case 'transform3d':
						TweenMax.to(
							$image[0],
							1.2, {
								x: 0,
								y: 0,
								z: 0,
								rotationX: 0,
								rotationY: 0,
								ease:Power2.easeOut
							}
						);
					break;
				}

			} );
		};

		self.mouseMoveUpdate = function() {
			$.each( mouseLayoutList, function( index, layout ) {
				var $this   = layout.selector,
					$image  = $( '.jet-parallax-section__image', $this ),
					speed   = layout.speed,
					prop    = layout.prop,
					posX    = parseFloat( tiltx * 125 * speed ).toFixed(1),
					posY    = parseFloat( tilty * 125 * speed ).toFixed(1),
					posZ    = layout.zIndex * 50,
					rotateX = parseFloat( tiltx * 25 * speed ).toFixed(1),
					rotateY = parseFloat( tilty * 25 * speed ).toFixed(1),
					device  = elementorFrontend.getCurrentDeviceMode();

				if ( -1 == layout.device.indexOf( device ) ) {
					$image.css( {
						'transform': 'translateX(0) translateY(0)',
						'background-position-x': layout.xPos,
						'background-position-y': layout.yPos
					} );

					return false;
				}

				switch( prop ) {
					case 'bgposition':

						var bgPosX = layout.xPos + ( posX / $image[0].offsetWidth ) * 100,
							bgPosY = layout.yPos + ( posY / $image[0].offsetHeight ) * 100;

						TweenMax.to(
							$image[0],
							1, {
								backgroundPositionX: bgPosX,
								backgroundPositionY: bgPosY,
								ease:Power2.easeOut
							}
						);
					break;

					case 'transform':
						TweenMax.to(
							$image[0],
							1, {
								x: posX,
								y: posY,
								ease:Power2.easeOut
							}
						);
					break;

					case 'transform3d':
						TweenMax.to(
							$image[0],
							2, {
								x: posX,
								y: posY,
								z: posZ,
								rotationX: rotateY,
								rotationY: -rotateX,
								ease:Power2.easeOut
							}
						);
					break;
				}

			} );
		};

	}

}( jQuery, window.elementorFrontend ) );
