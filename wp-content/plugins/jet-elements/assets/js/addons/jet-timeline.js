(function ($) {

    "use strict";

    function widgetTimeLine( $scope ) {

        var $target = $scope.find( '.jet-timeline' ),
        instance = null;

        if ( ! $target.length ) {
            return;
        }

        instance = new jetTimeLine( $target );
        instance.init();
    }
    
    class jetTimeLine {

        constructor( $element ) {
    
            var self = this,
    
                $parentPopup = $element.closest(
                    '.jet-popup__container-inner, .elementor-popup-modal .dialog-message'
                ),
    
                inPopup = !! $parentPopup[ 0 ],
    
                $viewport = inPopup ? $parentPopup : $( window ),
    
                viewportOffset = inPopup
                    ? $viewport.offset().top - $( window ).scrollTop()
                    : 0,
    
                $line     = $element.find( '.jet-timeline__line' ),
                $progress = $line.find( '.jet-timeline__line-progress' ),
                $cards    = $element.find( '.jet-timeline-item' ),
                $points   = $element.find( '.timeline-item__point' ),
    
                currentScrollTop      = $viewport.scrollTop(),
                lastScrollTop         = -1,
                currentWindowHeight   = $viewport.height(),
                currentViewportHeight = inPopup
                    ? $viewport.outerHeight()
                    : window.innerHeight,
                lastWindowHeight      = -1,
    
                requestAnimationId = null,
                flag = false;
    
            /**
             * Scroll handler
             */
            self.onScroll = function () {
    
                currentScrollTop = $viewport.scrollTop();
    
                viewportOffset = inPopup
                    ? $viewport.offset().top - $( window ).scrollTop()
                    : 0;
    
                self.updateFrame();
                self.animateCards();
            };
    
            /**
             * Resize handler
             */
            self.onResize = function () {
    
                currentScrollTop    = $viewport.scrollTop();
                currentWindowHeight = $viewport.height();
    
                viewportOffset = inPopup
                    ? $viewport.offset().top - $( window ).scrollTop()
                    : 0;
    
                self.updateFrame();
            };
    
            /**
             * Update window frame
             */
            self.updateWindow = function () {
    
                flag = false;
    
                $line.css( {
                    top: $cards.first().find( $points ).offset().top
                        - $cards.first().offset().top,
    
                    bottom: ( $element.offset().top + $element.outerHeight() )
                        - $cards.last().find( $points ).offset().top
                } );
    
                if ( lastScrollTop !== currentScrollTop ) {
    
                    lastScrollTop   = currentScrollTop;
                    lastWindowHeight = currentWindowHeight;
    
                    self.updateProgress();
                }
            };
    
            /**
             * Update progress line
             */
            self.updateProgress = function () {
    
                var lastCardOffset = $cards.last().find( $points ).offset().top,
    
                    progressFinishPosition = ! inPopup
                        ? lastCardOffset
                        : lastCardOffset
                            + currentScrollTop
                            - viewportOffset
                            - $( window ).scrollTop(),
    
                    progressOffsetTop = ! inPopup
                        ? $progress.offset().top
                        : $progress.offset().top
                            + currentScrollTop
                            - viewportOffset
                            - $( window ).scrollTop(),
    
                    progressHeight =
                        ( currentScrollTop - progressOffsetTop )
                        + ( currentViewportHeight / 2 );
    
                if ( progressFinishPosition <= currentScrollTop + currentViewportHeight / 2 ) {
                    progressHeight = progressFinishPosition - progressOffsetTop;
                }
    
                $progress.css( {
                    height: progressHeight + 'px'
                } );
    
                $cards.each( function () {
    
                    var itemOffset = $( this ).find( $points ).offset().top;
    
                    itemOffset = ! inPopup
                        ? itemOffset
                        : itemOffset
                            + currentScrollTop
                            - viewportOffset
                            - $( window ).scrollTop();
    
                    if ( itemOffset < currentScrollTop + currentViewportHeight * 0.5 ) {
                        $( this ).addClass( 'is--active' );
                    } else {
                        $( this ).removeClass( 'is--active' );
                    }
                } );
            };
    
            /**
             * RAF wrapper
             */
            self.updateFrame = function () {
    
                if ( ! flag ) {
                    requestAnimationId = requestAnimationFrame( self.updateWindow );
                }
    
                flag = true;
            };
    
            /**
             * Animate cards
             */
            self.animateCards = function () {
    
                $cards.each( function () {
    
                    var itemOffset = $( this ).offset().top;
    
                    itemOffset = ! inPopup
                        ? itemOffset
                        : itemOffset
                            + currentScrollTop
                            - viewportOffset
                            - $( window ).scrollTop();
    
                    if (
                        itemOffset <= currentScrollTop + currentViewportHeight * 0.9 &&
                        $( this ).hasClass( 'jet-timeline-item--animated' )
                    ) {
                        $( this ).addClass( 'is--show' );
                    }
                } );
            };
    
            /**
             * Init
             */
            self.init = function () {
    
                $( document ).ready( self.onScroll );
    
                $viewport.on(
                    'scroll.jetTimeline',
                    self.onScroll
                );
    
                $( window ).on(
                    'resize.jetTimeline orientationchange.jetTimeline',
                    JetElementsTools.debounce( 50, self.onResize )
                );
            };
        }
    }
    
    window.widgetTimeLine = widgetTimeLine;

})( jQuery );