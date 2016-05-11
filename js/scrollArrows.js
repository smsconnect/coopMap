var scrollArrows = {

  elements: {},

  arrowSVGUp: '<?xml version="1.0" encoding="utf-8"?><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 100 50" style="enable-background:new 0 0 100 50;" xml:space="preserve"><style type="text/css">.st0{fill:#FFFFFF;}</style><g><g><path class="st0" d="M4.8,48.4c15.7-13.9,31.3-27.8,47-41.7c2.4-2.1-1.1-5.7-3.5-3.5C32.6,17,16.9,30.9,1.2,44.9C-1.2,47,2.4,50.5,4.8,48.4L4.8,48.4z"/></g></g><g><g><path class="st0" d="M98.8,44.9C83.1,30.9,67.4,17,51.8,3.1c-2.4-2.1-5.9,1.4-3.5,3.5c15.7,13.9,31.3,27.8,47,41.7C97.6,50.5,101.2,47,98.8,44.9L98.8,44.9z"/></g></g></svg>',
  arrowSVGDown: '<?xml version="1.0" encoding="utf-8"?><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 100 50" style="enable-background:new 0 0 100 50;" xml:space="preserve"><style type="text/css">.st0{fill:#FFFFFF;}</style><g><g><path class="st0" d="M1.2,5.8c15.7,13.9,31.3,27.8,47,41.7c2.4,2.1,5.9-1.4,3.5-3.5C36.1,30.1,20.4,16.2,4.8,2.3C2.4,0.1-1.2,3.7,1.2,5.8L1.2,5.8z"/></g></g><g><g><path class="st0" d="M95.2,2.3C79.6,16.2,63.9,30.1,48.3,44c-2.4,2.1,1.1,5.7,3.5,3.5c15.7-13.9,31.3-27.8,47-41.7C101.2,3.7,97.6,0.1,95.2,2.3L95.2,2.3z"/></g></g></svg>',

  inProgress: false,

  setUp: function () {
    (function($) {
      $.fn.hasScrollBar = function() {
          return this.get(0) ? this.get(0).scrollHeight > this.innerHeight() : false;
      };
    })(jQuery);
  },

  getScrollArrows: function ( holderString, elString ) {
    var jqHolder = $( '#' + holderString );
    var el = document.getElementById( elString );
    var jqEl = $( '#' + elString );

    if ( jqEl.hasScrollBar() ) {

      scrollArrows.elements[ el.id ] = {};

      scrollArrows.elements[ el.id ].top = jqHolder.find( '#arrowTop' )[0];
      scrollArrows.elements[ el.id ].top.innerHTML = scrollArrows.arrowSVGUp;

      scrollArrows.elements[ el.id ].bottom = jqHolder.find( '#arrowBottom' )[0];
      scrollArrows.elements[ el.id ].bottom.innerHTML = scrollArrows.arrowSVGDown;
      scrollArrows.elements[ el.id ].bottom.style.opacity = 1;
      scrollArrows.elements[ el.id ].bottom.style.top = "3px";

      jqEl.scroll( function() {
        scrollArrows.checkScroll( el );
      });
    }
  },

  checkScroll: function ( el ) {
    var elHeight = el.clientHeight;
    var sHeight = el.scrollHeight;
    var sAmount = el.scrollTop;
    var maxAmount = el.scrollHeight - el.clientHeight;

    if( sAmount <= 5 ) {
      console.log("at Top");
      scrollArrows.showOrHideArrows( el, "top" );
    } else if ( sAmount >= maxAmount - 5 ) {
      console.log("at Bottom");
      scrollArrows.showOrHideArrows( el, "bottom" );
    } else {
      console.log(elHeight + " " + sHeight + " " + sAmount + " " + maxAmount);
      scrollArrows.showOrHideArrows( el, "middle" );
    }
  },

  showOrHideArrows: function ( el, pos ){
    if ( pos === "top" ) {
      $( scrollArrows.elements[ el.id ].top ).stop().animate({
        opacity: 0
      }, 250);
      scrollArrows.inProgress = false;
    } else if ( pos === "bottom" ) {
      $( scrollArrows.elements[ el.id ].bottom ).stop().animate({
        opacity: 0
      }, 250);
      scrollArrows.inProgress = false;
    } else {
      if ( !scrollArrows.inProgress ) {
        scrollArrows.inProgress = true;
        $(scrollArrows.elements[ el.id ].top).stop().animate({
          opacity: 1
        }, 250);

        $(scrollArrows.elements[ el.id ].bottom).stop().animate({
          opacity: 1
        }, 250, function(){
          scrollArrows.inProgress = false;
        });
      }
    }
  },
};
