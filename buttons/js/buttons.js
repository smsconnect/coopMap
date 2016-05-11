//depends on '_buttons.scss' to set initial button width(%) and styles

//depends on the following elements in the index.html file:
//- a [div] with the class 'button nav'
//- a [div] with the class 'button help'
//- a [div] with the class 'button description'



//Main object that holds functions to create, set size, and bind evens to the...
//default app buttons (currently a description, a help, and a nav button).
var buttons = {



  //object to hold button measurements for dynamic sizing that can be used in...
  //other areas of the vis by accessing the 'buttons' object.
  measurements: {},



  /**
   * createButtons ********NAME SHOULD BE CHANGED*************
   *   Initializes the various buttons by selecting them and dynamically setting...
   *   their height, and binding touch events to allow for 'active' states to be...
   *   applied through css ids. (other event listeners are bound elsewhere, such...
   *   as 'api.js'(binds '.button.nav') and 'description.js'(binds '.button.description')).
   *
   */
  createButtons: function(){
    var buttonNav = d3.select(".button.nav"); //*********SHOULD BE CHANGED TO TAKE OUT D3************
    var buttonHelp = d3.select(".button.help"); //*********SHOULD BE CHANGED TO TAKE OUT D3************
    var buttonDescription = d3.select(".button.description"); //*********SHOULD BE CHANGED TO TAKE OUT D3************

    //gets width that is dynamically set as a percentage of device width in...
    //'_buttons.scss' to then dynamically set the height of the buttons so that...
    //they are perfect circles.
    var buttonWidth = buttons.measurements.buttonWidth = buttonNav.style("width");

    $( ".button img" ).innerWidth(buttonWidth); //*********SHOULD BE CHANGED TO TAKE OUT JQUERY************

    buttonDescription.style("height", buttonWidth);
    buttonNav.style("height", buttonWidth);
    buttonHelp.style("height", buttonWidth);

    buttonNav.on("touchstart", function(){d3.select(this).attr("id", "active");})
             .on("touchend",   function(){d3.select(this).attr("id", null);});

    //buttonHelp.on("touchstart", function(){d3.select(this).attr("id", "active");})
    //          .on("touchend",   function(){d3.select(this).attr("id", null);});
  }
}
