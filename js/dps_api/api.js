//Main object that holds functions that utilize the Adobe DPS API and allow elements...
//to interact with the back end of the app.
var api = {

  /**
  * Opt into the Adobe DPS (2015) advanced contract
  * @param elementList - The single or list of HTML elements
  */
  disableNavDropdown: function(elementList) {
    try {
      adobeDPS.Gesture.disableNavigation(elementList);
    } catch (error) {
      console.log('error', error);
    }
  }

};
