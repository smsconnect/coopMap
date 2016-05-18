
var SMSMap = {

    //gets the main data object from an external script and binds it to the SMSMap object
    coopData : coopDataMain,

    //color properties
    backgroundColor: "rgba(0,0,0,0.75)",
    textColor: "white",
    effectColor: "#777777",

    //properties to keep track of different states
    filterVisible: false,
    infoDivVisible: false,
    pointClicked: false,
    allMapPoints: false,
    allStates: false,

    //arrays that hold filter options
    pastFiltered: [],
    currentFiltered: [],
    filteredArray: [],
    filteredArrayOriginalLocation: [],

    //google map pin for an unselected map point
    defaultIcon: {
      'url': './images/p5_green.png',
      'size': new google.maps.Size(60, 60),
      'origin': new google.maps.Point(0, 0),
      'anchor': new google.maps.Point(30, 60)
    },

    //google map pin for a selected map point
    selectedIcon: {
      'url': './images/p5_lightblue.png',
      'size': new google.maps.Size(60, 60),
      'origin': new google.maps.Point(0, 0),
      'anchor': new google.maps.Point(30, 60)
    },

    //property that will hold the actual google map instance
    map:{},

    //This is an array that will be used to keep track of the points in the map
    mapPoints:[],



    /**
     *   Called initially to setup the map - there will be no points on the map initially
     **/
    initiateMap: function () {
      var mapOptions,
          markers,
          bounds;

      //create elements that refence the data and add them to DOM
      SMSMap.drawAllFilter();
      SMSMap.drawStateFilters();
      SMSMap.drawIndustryFilters();

      mapOptions = {
        'mapTypeControl': false,
        'navigationControl': false,
        'streetViewControl': false,
        'styles': SMSMap.mapStyle,
        zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER
        },
      };

      //create new google maps object
      SMSMap.map = new google.maps.Map(document.getElementById('sms-map'), mapOptions);

      //waits till document is loaded to call listener binding function
      document.addEventListener("DOMContentLoaded", function(event) {
        SMSMap.addListeners();
      });

      //draw the all map points in the data
      SMSMap.drawMap();

      markers = SMSMap.mapPoints;
      bounds = new google.maps.LatLngBounds();

      for(i=0;i<markers.length;i++) {
        bounds.extend(markers[i].getPosition());
      }

      SMSMap.map.fitBounds(bounds);
      google.maps.event.addListenerOnce(SMSMap.map, 'bounds_changed', function(event) {
        var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;

        if ( width < 475 ) {
          this.setZoom(1);
        }
      });
    },



    /**
     * Gets some page elements already on the DOM and adds some listeners that are
     * necessary for users to interact with the app
     */
    addListeners: function(){
      var closeButton = document.getElementsByClassName("close");
      var filterDisplayButton = document.getElementById("filter-display");
      var filterCalc = SMSMap.filterMainButton = document.getElementById("filter-calc");

      //zoom change event listener for entire map
      google.maps.event.addListener(SMSMap.map, "zoom_changed", function(){
        if(SMSMap.pointClicked){
          SMSMap.map.setCenter(SMSMap.pointClicked.position);
          SMSMap.map.panBy(0, -120);
        }
      });

      //hides page elements when user interacts with other areas of the map
      google.maps.event.addListener(SMSMap.map, "drag", function(){
        SMSMap.hideInfo();
        if(SMSMap.filterVisible === true){
          SMSMap.doFilter();
        }
      });

      //hides page elements when user interacts with other areas of the map
      google.maps.event.addListener(SMSMap.map, "click", function(){
        SMSMap.hideInfo();
        if(SMSMap.filterVisible === true){
          SMSMap.doFilter();
        }
      });

      //click listeners for info and fiilter close buttons
      for( var i = 0; i < closeButton.length; i++){
        if(closeButton[i].className === "close info"){
          closeButton[i].onclick = function () {
            SMSMap.hideInfo();
          };
        }else{
          closeButton[i].onclick = function () {
            SMSMap.doFilter();
          };
        }
      }



      /**
       * Displays the filter selection div and closes the map point info
       */
      filterDisplayButton.onclick = function() {
        SMSMap.doFilter();
        SMSMap.hideInfo();
      };



      /**
       * Runs when user has selected an appropriate filter and pushed the filter button
       * in the filter div
       */
      filterCalc.onclick = function(){
        // Does not run if filter is not allowed. Filter is not allowed if the current
        // filter selection is the same as the last filter selection
        if ( SMSMap.filterAllowed === true ) {

          var tempCurrent = [];
          var current = SMSMap.currentFiltered;

          for(var i = 0; i < current.length; i++){
            tempCurrent.push(current[i].value);
          }

          SMSMap.filter(tempCurrent);

          //store strings to use later...when a point is clicked the companies
          //can me checked against this string to only show filtered industries -- NOT WRITTEN YET CHANGE
          SMSMap.currentFilteredStrings = tempCurrent;

          //if there are no filtered results display a warning message
          if( SMSMap.filterEmpty ) {
            if( SMSMap.filterWarning ) {
              SMSMap.filterWarning.style.opacity = 1;
              SMSMap.changeAllowFilter( SMSMap.filterMainButton, false );
            } else {
              SMSMap.filterWarning = document.getElementsByClassName( 'filter-warning' )[0];
              SMSMap.filterWarning.style.opacity = 1;
              SMSMap.changeAllowFilter( SMSMap.filterMainButton, false );
            }
          } else { //else hide filter interface and draw the filtered points
            SMSMap.filterUpdatePast();
            SMSMap.doFilter();
            SMSMap.drawPoints();
          }
        }
      };

      SMSMap.filterElement = document.getElementById("filter");
      SMSMap.filterDisplayButton = filterDisplayButton;
    },



    /**
     * Clears the last selected elements from the past filtered arr and resets their class
     */
    clearPastFiltered: function(){
      for(var i = SMSMap.pastFiltered.length - 1; i > -1; i--){
        SMSMap.pastFiltered[i].className = "list";
        SMSMap.pastFiltered.pop();
      }
    },



    /**
     * Pushs the current filter selections in to the past filter selections arr
     */
    clearCurrentFilteredPushToPast: function(){
      for(var i = SMSMap.currentFiltered.length - 1; i > -1; i--){
        SMSMap.pastFiltered.push(SMSMap.currentFiltered[i]);
      }
    },



    /**
     * Compares two objects that both have two arrays. Checks for equal length
     * and then checks to see if the elements that are passed to it have a
     * compareVal and if they are equal. Used to see if user is choosing a new filter or not.
     *
     * @return {boolean} Are the filter selections equal?
     */
    compareFilterSelections: function(){
      var objA = SMSMap.currentFiltered;
      var objB = SMSMap.pastFiltered;
      var tempObjA = [];
      var tempObjB = [];

      // if an object doesn't have an array as a property return false
      if(!objA || !objB){
        return false;
      }

      // check if array lengths are different and return false if so
      if(objA.length !== objB.length){
        return false;
      }

      // if the filter selections are there and equal length, push to temp array
      for(var i = 0; i < objA.length; i++){
        tempObjA.push(objA[i].value);
        tempObjB.push(objB[i].value);
      }

      // slice temp arr so we do not effect the original
      // sort makes sure they are in same order
      // join makes it a string so we can do a string compare
      var cA = tempObjA.slice().sort().join(",");
      var cB = tempObjB.slice().sort().join(",");

      return cA === cB;
    },



    /**
     * Hides the informational div that is displayed when a user selects a map point
     */
    hideInfo: function() {
      if (SMSMap.pointClicked) {
        SMSMap.pointClicked.setIcon(SMSMap.defaultIcon);
      }

      SMSMap.pointClicked = false;

      if (SMSMap.infoDivVisible) {
        SMSMap.infoDiv.style.pointerEvents = "none";
        SMSMap.infoDiv.style.opacity = 0;
        SMSMap.infoDivVisible = false;
      }
    },



    /**
     * Displays or hides the filter selection div
     */
    doFilter: function() {
      if(SMSMap.filterVisible) {
        SMSMap.filterElement.style.pointerEvents = "none";
        SMSMap.filterElement.style.opacity = 0;
        SMSMap.filterVisible = false;

        SMSMap.filterDisplayButton.style.opacity = 1;
        SMSMap.filterDisplayButton.style.pointerEvents = "auto";
      } else {
        SMSMap.filterElement.style.pointerEvents = "auto";
        SMSMap.filterElement.style.opacity = 1;
        SMSMap.filterVisible = true;

        SMSMap.filterDisplayButton.style.opacity = 0;
        SMSMap.filterDisplayButton.style.pointerEvents = "none";
      }
    },



    /**
     * Parses through the coopData array and adds points to the map with the help of the drawPoint function.
     **/
    drawMap: function () {
      for (var i = 0; i < SMSMap.coopData.length; i++) {
        //Retrieve marker info due to the deferred callback below
        SMSMap.createPoint(SMSMap.coopData[i].lat, SMSMap.coopData[i].long, i, false);
      }
      SMSMap.drawPoints();
    },



    /**
     * Actually draws a point on the map and adds information about that point to the
     * map. Also sets up an onclick listener to enable the viewing of the information in the map
     *
     * @param {number}  lat           The latitude of the point you would like to draw
     * @param {number}  long          The longitude of the point you would like to draw
     * @param {number}  arrayLocation The location in the coopArray you are pulling this point from
     * @param {boolean} bounds        Indicates whether the points should be bounded into the map display or not.
     **/
    createPoint: function (lat, long, arrayLocation, bounds) {
      var point = {
        'position': new google.maps.LatLng(lat,long),
        'bounds': bounds,
        'animation': google.maps.Animation.DROP,
        'icon': SMSMap.defaultIcon,
      };

      var googlePoint = new google.maps.Marker( point );

      //things that should happen when a user selects a point
      google.maps.event.addListener(googlePoint,'click',function(){
        var currentZoom = SMSMap.map.getZoom();

        //deselect the last selected point
        if(SMSMap.pointClicked){
          SMSMap.pointClicked.setIcon(SMSMap.defaultIcon);
        }

        if(SMSMap.filterVisible){
          SMSMap.doFilter();
        }

        //record the selected point and change its icon to the selected icon
        SMSMap.pointClicked = this;
        this.setIcon(SMSMap.selectedIcon);

        //choose a zoom level based on the current zoom level and center the map
        SMSMap.map.setZoom(currentZoom < 6 ? 6 : currentZoom);
        SMSMap.map.setCenter(new google.maps.LatLng(lat, long));
        //because the info div takes up most of the top of the screen we offset
        //the point further towards the bottom so it appears more balanced
        SMSMap.map.panBy(0, -120);

        //create the info div for this specific map point
        SMSMap.drawInfoDiv(arrayLocation);
      });

      SMSMap.mapPoints.push(googlePoint);
    },



    /**
     * Draw all the available map points in the data
     */
    drawPoints: function(){
      for( var i=0; i<SMSMap.mapPoints.length; i++ ){
          SMSMap.mapPoints[i].setMap(SMSMap.map);
      }
    },



    /**
     *   Actually draws the information regarding each city. This function specifically handles the creation of
     *   the box and the associated styling
     *
     *   @param arrayLoc The array location within coopData array that we are going to display on the screen
     **/
    drawInfoDiv: function (arrayLoc) {
        //make local variable to make shorter
        var infoDiv = document.getElementById("info-div");
        var cityHolder = document.getElementById("city-holder");
        var companiesHolder = document.getElementById("companies-holder");

        //make sure replacable elements in infoDiv are clear of any previously
        //displayed content (i.e. the city name and company list)
        var replace = document.getElementsByClassName("replace")
        for (var i = 0; i < replace.length; i++){
          replace[i].innerHTML = "";
        }

        //set reference to infoDiv as property of main object for later use
        SMSMap.infoDiv = infoDiv;

        //make infoDiv visible (default css opacity is 0)
        //infoDiv.style.zIndex = 1;
        SMSMap.infoDiv.style.pointerEvents = "auto";
        infoDiv.style.opacity = 1;

        //record the fact that infoDiv is now visible in the main object property
        SMSMap.infoDivVisible = true;

        //infoDiv.appendChild(SMSMap.createInfoClose());
        cityHolder.appendChild(SMSMap.createCityName(arrayLoc));

        //checks for the presence of companies at the selected array location in the data
        //object, and adds them to the companiesHolder div, or displays a default message if
        //no companies are available
        if (SMSMap.coopData[arrayLoc].companies.length > 0) {

            for (var a = 0; a < SMSMap.coopData[arrayLoc].companies.length; a++) {
                var companyLink = document.createElement("a");
                var companyIndustry = document.createElement("p");
                companyLink.className = "company-link";
                companyLink.target = "_blank";
                companyLink.href = SMSMap.coopData[arrayLoc].companies[a].website;
                companyLink.appendChild(document.createTextNode(SMSMap.coopData[arrayLoc].companies[a].name));

                if ( SMSMap.coopData[arrayLoc].companies[a].industry ) {
                  companyIndustry.className = "company-industry";
                  companyIndustry.innerHTML = SMSMap.coopData[arrayLoc].companies[a].industry + " Industry";
                  companyLink.appendChild(companyIndustry);
                }
                //SMSMap.addTextTouchEffect(companyLink);
                companiesHolder.appendChild(companyLink);
            }
        } else {
            var defaultPara = document.createElement("p");
            defaultPara.style.textAlign = "center";
            defaultPara.appendChild(document.createTextNode(
                "We're sorry, we can't find the company names, but someone did go on co-op in this city!"));
            infoDiv.appendChild(defaultPara);
        }
    },



    /**
     *   Extracts the city and state information from the coopData array and creates
     *   an element suitable for placement within the info div
     *
     *   @param {number} arrayLoc The array location within the coopData array that we are going to get the city information from
     *   @return {object}         DOM h1 element with suitable string created by this funtion
     **/
    createCityName: function (arrayLoc) {
      var cityName = document.createElement("h1");
      var city = SMSMap.coopData[arrayLoc].city;
      var state = SMSMap.coopData[arrayLoc].state;
      var country = SMSMap.coopData[arrayLoc].country;
      var cityString = city;

      //checks for the presence of different locations and adds to string if in data
      if (state) {
          cityString += ", " + state;
      } else if (country) {
          cityString += ", " + country;
      }

      cityName.appendChild(document.createTextNode(cityString));

      return cityName;
    },



    /**
     * Function that dispatches different filter functions based on the filter options
     * selected by the user. Checks for most general filter first, and then moves
     * to most specific filter option (1.all points --> 2.all states --> 3.has atleast one state --> 4.only industry)
     *
     * @param {object} currentStrings Array of filter strings the user has selected
     **/
    filter: function (currentStrings) {
      var currentFilterStatus = SMSMap.filterDetermineFilter( currentStrings );

      //filter is not currently empty if this function was successfully called
      SMSMap.filterEmpty = false;

      //empty array that will hold final filtered points
      SMSMap.filteredArray = [];

      //empty array that will hold a reference to the location of the original data object of the filtered point
      SMSMap.filteredArrayOriginalLocation = [];

      if( currentFilterStatus === "all" ) {
        SMSMap.filterAllMapPoints();

      } else if ( currentFilterStatus === "allStates" ) {
        SMSMap.filterAllStates( currentStrings );

      } else if ( currentFilterStatus === "hasStates" ) {
        SMSMap.filterByState( currentStrings );

      } else {
        SMSMap.filterByIndustry( currentStrings );
      }
    },



    /**
     * Checks the current filtered strings for the presence of certain strings that determine
     * which functions should be dispatched to handle the current filter
     *
     * @param  {object} currentStrings Array of filter strings the user has selected
     * @return {string}                String describing the current filter options
     */
    filterDetermineFilter: function( currentStrings ) {
      if ( currentStrings.indexOf("All Map Points") != -1 ) {
        return "all";

      } else if ( currentStrings.indexOf("All States") != -1 ) {
        return "allStates";

      } else if ( SMSMap.filterMatchStateString( currentStrings ) === true ) {
        return "hasStates";
      }
    },



    /**
     * Compares all the current filter strings with the original state name array
     * to determine if a state is present.
     *
     * @param  {object} currentStrings Array of filter strings the user has selected
     * @return {boolean}               Whether the current filtered arr contains a state
     */
    filterMatchStateString: function( currentStrings ) {
      //array of all posible state options
      var arr = SMSMap.stateArray;

      //checks if any of the current filtered strings are present in the original state arr
      for ( var i = 0; i < currentStrings.length; i++ ){
        if ( arr.indexOf( currentStrings[i] ) != -1 ) {
          return true;
        }
      }

      return false;
    },



    /**
     * Compares all the current filter strings with the original industry array
     * to determine if an industry is present in the filter selection
     *
     * @param  {object} currentStrings Array of filter strings the user has selected
     * @return {boolean}               Whether the current filtered arr contains an industry
     */
    filterMatchIndustryString: function( currentStrings ) {
      //array of all posible industry options
      var arr = SMSMap.industryArray;

      //checks if any of the current filtered strings are present in the original industry arr
      for ( var i = 0; i < currentStrings.length; i++ ){
        if ( arr.indexOf( currentStrings[i] ) != -1 ) {
          return true;
        }
      }

      return false;
    },



    /**
     * If 'all points' was selected as the filter, redraw all points and reset map poition
     */
    filterAllMapPoints: function() {
      SMSMap.drawMap();
      SMSMap.filterPosition();
    },



    /**
     * If 'all states' was selected as the filter, redraw all of the states map points
     *
     * @param  {object} currentStrings Array of filter strings the user has selected
     */
    filterAllStates: function ( currentStrings ) {
      //go through all of the map points and push the name and data location to arrays if it is a state
      for ( var a = 0; a < SMSMap.coopData.length; a++) {
        if ( SMSMap.coopData[a].state ) {
            SMSMap.filteredArray.push( SMSMap.coopData[a] );
            SMSMap.filteredArrayOriginalLocation.push( a );
        }
      }

      //if the string is greater than one we have to check if any industry filters
      //were applied in addition to the 'all states' filter selection
      if ( currentStrings.length > 1 ) {
        SMSMap.filterCheckIndustry( currentStrings, SMSMap.filteredArray, SMSMap.filteredArrayOriginalLocation );
      }

      //create the final filtered points
      SMSMap.filterCreatePoints( SMSMap.filteredArray, SMSMap.filteredArrayOriginalLocation );
    },



    /**
     * Finds the states in the current strings and pushs a reference to their location
     * in the main data object into the final filtered arrays
     *
     * @param  {object} currentStrings Array of filter strings the user has selected
     */
    filterByState: function ( currentStrings ) {
      var data = SMSMap.coopData;

      //find each state in the data object and see if it is in the current selected filter
      for ( var a = 0; a < data.length; a++) {
        if ( currentStrings.indexOf( data[a].state ) != -1 ) {
          SMSMap.filteredArray.push( SMSMap.coopData[a] );
          SMSMap.filteredArrayOriginalLocation.push( a );
        }
      }

      //if industry filters are present we still have to apply them
      if ( SMSMap.filterMatchIndustryString( currentStrings ) === true ) {
        SMSMap.filterCheckIndustry( currentStrings, SMSMap.filteredArray, SMSMap.filteredArrayOriginalLocation );
      }

      //create the final filtered points
      SMSMap.filterCreatePoints( SMSMap.filteredArray, SMSMap.filteredArrayOriginalLocation );
    },



    /**
     * Goes through each company in each data point and checks to see if their industry
     * is present in the current selected filter -- only runs if no states filter is applied! -- otherwise
     * the 'filterCheckIndustry' function is called after the states have been filtered
     *
     * @param  {object} currentStrings Array of filter strings the user has selected
     */
    filterByIndustry: function ( currentStrings ) {
      var data = SMSMap.coopData;

      for ( var i = 0; i < data.length; i++) {
        for ( var a = 0; a < data[i].companies.length; a++ ) {
          if ( currentStrings.indexOf( data[i].companies[a].industry ) != -1) {
            SMSMap.filteredArray.push( data[i] );
            SMSMap.filteredArrayOriginalLocation.push( i );
          }
        }
      }

      //create the final filtered points
      SMSMap.filterCreatePoints( SMSMap.filteredArray, SMSMap.filteredArrayOriginalLocation );
    },



    /**
     * Called when a state filter has already been applied - filters the filtered array again, this
     * time by industry. Checks each point in the filtered array - if the point's industry matches the current
     * industry filter it does nothing, if it doesn't it is assigned a createPoint value of false.
     *
     * @param  {[type]} currentStrings Array of filter strings the user has selected
     * @param  {object} filtArr        Necessary data to create the map point from the main data object
     * @param  {object} origLocArr     Reference to the map points data location in the main data object
     */
    filterCheckIndustry: function ( currentStrings, filtArr, origLocArr ) {
      var spliced = false;
      for ( var i = 0; i < filtArr.length; i++ ) {  //for every company in that object (object = different city)

        for ( var a = 0; a < filtArr[i].companies.length; a++ ) {
          if ( currentStrings.indexOf( filtArr[i].companies[a].industry ) != -1) {
            break;
          } else if ( a == filtArr[i].companies.length - 1 ) {
            filtArr[i].createPoint = false;
          }
        }
      }
    },



    /**
     * Create the map points after the filter operations have finished
     *
     * @param  {object} filtArr    Necessary data to create the map point from the main data object
     * @param  {object} origLocArr Reference to the map points data location in the main data object
     */
    filterCreatePoints: function ( filtArr, origLocArr ) {
      var pointCount = 0;

      //If we have atleast one point and we are cleared to create this point then clear
      //the map and create a point. Reset create point values of uncreated points
      for( var i = 0; i < filtArr.length; i++ ) {
        if ( filtArr[i].createPoint !== false ) {
          if( pointCount === 0 ) {
            SMSMap.clearMap();
          }
          SMSMap.createPoint(filtArr[i].lat, filtArr[i].long, origLocArr[i], true);
          pointCount++;
        } else {
          filtArr[i].createPoint = undefined;
        }
      }

      //if we filtered something reset the filter position. If not record the empty filter
      if( pointCount > 0 ) {
        SMSMap.filterPosition();
      } else {
        SMSMap.filterEmpty = true;
      }
    },



    /**
     * Clears the map of all points
     */
    clearMap: function(){
      SMSMap.pointClicked = false;

      SMSMap.hideInfo();

      for( var i=0; i<SMSMap.mapPoints.length; i++ ){
          SMSMap.mapPoints[i].setMap(null);
      }

      SMSMap.mapPoints = [];
    },



    /**
     * Changes the center and zoom of the map object
     */
    filterPosition: function (){
      var currentZoom = SMSMap.map.getZoom();
      var markers = SMSMap.mapPoints;
      var bounds = new google.maps.LatLngBounds();

      //google maps api function to extend the bounds of the new position to include all new points
      for( i=0; i<markers.length; i++ ) {
        bounds.extend(markers[i].getPosition());
      }

      //set the zoom to the minimum to fit the bounds if one point is present or set to a default value
      if (markers.length > 1) {
        SMSMap.map.fitBounds(bounds);
      } else {
        SMSMap.map.setZoom(currentZoom < 6 ? 6 : currentZoom);
        SMSMap.map.setCenter(markers[0].getPosition());
      }
    },



    /**
     * Adds the 'all points' option to the filter div and adds a click listener
     */
    drawAllFilter: function() {
      var allFilter = document.getElementById("all-div");
      var allP = document.createElement("p");

      allP.className = "current";
      allP.value = "All Map Points";
      allP.appendChild(document.createTextNode("All Map Points"));

      SMSMap.pastFiltered[0] = allP;
      SMSMap.currentFiltered[0] = allP;

      allFilter.appendChild(allP);

      SMSMap.allMapPoints = true;

      allP.onclick = function(){
        SMSMap.manageSelectedFilters( this );
      }
    },



    /**
     * Creates state filter option elements
     **/
    drawStateFilters: function (){
        var stateFilter = document.getElementById("state-div");
        var states = SMSMap.createStateList();
        var stateP;

        for (i = 0; i < states.length; i++) {
          stateP = document.createElement("p");
          stateP.className = "list";

          if ( states[i] === "All States" ) {
            stateP.className = "list not-half";
          }

          stateP.value = states[i];
          stateP.appendChild(document.createTextNode(states[i]));
          stateFilter.appendChild(stateP);

          stateP.onclick = function(){
            SMSMap.manageSelectedFilters( this );
          };
        }
    },



    /**
     * Creates the industry filter option elements
     */
    drawIndustryFilters: function(){
      var industryFilter = document.getElementById("industry-div");
      var industries = SMSMap.createIndustryList();
      var industryP;

      for (i = 0; i < industries.length; i++) {
        industryP = document.createElement("p");
        industryP.className = "list not-half";
        industryP.value = industries[i];
        industryP.appendChild(document.createTextNode(industries[i]));
        industryFilter.appendChild(industryP);

        if(industryP.value === "All"){
          SMSMap.pastFiltered[0] = industryP;
          var tempIndustry = document.createElement("p");
          tempIndustry.value = industries[i];
          tempIndustry.appendChild(document.createTextNode(industries[i]));
        }

        industryP.onclick = function(){
          SMSMap.manageSelectedFilters( this );
        };
      }
    },



    /**
     * Creates and returns a list of all states in the data object
     * @return {boolean} array of all state strings available
     */
    createStateList: function () {
      var stateArray = [];
      stateArray.push("All States");
      for (i = 0; i < SMSMap.coopData.length; i++) {
        if (stateArray.indexOf(SMSMap.coopData[i].state) === -1 && SMSMap.coopData[i].state != undefined) {
          stateArray.push(SMSMap.coopData[i].state);
        }
      }

      stateArray.sort();

      //special case -- create and add 'all states' selection to the arr in position 0
      if(stateArray.indexOf("All States") != 0){
        var allPos = stateArray.indexOf("All States");
        var temp = stateArray[0];

        stateArray[0] = "All States";
        stateArray[allPos] = temp;
      }

      //record state array as property of main smsmap object
      SMSMap.stateArray = stateArray;

      return stateArray;
    },



    /**
     * Creates and returns a list of all industries in the data object
     * @return {boolean} array of all industries strings available
     */
    createIndustryList: function () {
      var industryArray = [];

      for (a = 0; a < SMSMap.coopData.length; a++) {
        for (i = 0; i < SMSMap.coopData[a].companies.length; i++)
          if (industryArray.indexOf(SMSMap.coopData[a].companies[i].industry) === -1 && SMSMap.coopData[a].companies[i].industry != undefined) {
            industryArray.push(SMSMap.coopData[a].companies[i].industry);
          }
      }

      industryArray.sort();

      //record industry array as property of main smsmap object
      SMSMap.industryArray = industryArray;

      return industryArray;
    },






    //-----------Filter State Functions Below ------------------------
    //Some filter comparison functions that check the current selected filter
    //against the past selected filter and compare elements within the current selected filter
    //to determine which elements can be selected and can't be, while changing their classes to reflect that.
    //
    //For example: if the user selects two states they will have a selected class applied to them,
    //but then if the user selects the 'All States' option then these two states will now be deselected
    //and have the default class applied to them, and the 'All States' filter selection
    //will now have the selected class applied to it.
    //
    //^^ This happens because you can't select two states and all states at the same time
    //...and that kind of stuff just happens a lot and these functions deal with that



    /**
     * Kicks off the filter comparison process that determines if the user's filter selection
     * is new, and if there are any warnings to be displayed (example warning: no results for that filter selection)
     *
     * @param  {object} touched Element that users selected in the filter
     */
    manageSelectedFilters: function ( touched ) {
      var filterButton = SMSMap.filterMainButton;

      //if there was a filter warning visible lets hide it for now because the user made a new filter selection
      if( SMSMap.filterWarning ) {
        SMSMap.filterWarning.style.opacity = 0;
      }

      //don't allow filter until we check out the situation
      SMSMap.filterAllowed = false;

      //compares the live filter changes to each other to determine css changes and filter highlighting
      SMSMap.filterCompareCurrent( touched );

      //if the past and the current filters are the same or there is nothing in the current filter then do not allow user to filter
      if ( SMSMap.filterPastSameAsCurrent() || SMSMap.currentFiltered.length === 0 ) {
        SMSMap.changeAllowFilter( filterButton, false );
      }
      else { //otherwise allow user to filter
        SMSMap.changeAllowFilter( filterButton, true );
      }
    },



    /**
     * Checks if the selected element was already selected by the user, and handles
     * removing or adding the selection from/to the 'currentFiltered' array and the
     * styling changes that should accompany these changes.
     *
     * @param  {object} touched Element that users selected in the filter
     */
    filterCompareCurrent: function ( touched ) {
      //get index of touched element in the 'currentFiltered' array
      var ind = SMSMap.currentFiltered.indexOf( touched );

      //if the element isn't in the 'currentFiltered' array then call some functions
      //to check if the 'All Map Points' or the 'All States' filter elements were selected,
      //then add the selected element to the 'currentFiltered' array, then change the
      //style of the selected filter element
      if ( ind === -1 ) {
        SMSMap.filterChangeAllMapPoints( touched );
        SMSMap.filterChangeAllStates( touched );

        SMSMap.currentFiltered.push( touched );
        SMSMap.filterChangeSelected( touched, true );
      }
      //Otherwise remove the element from the 'currentFiltered' array, then
      //change the style of the selected filter element
      else {
        SMSMap.currentFiltered.splice( ind, 1);
        SMSMap.filterChangeSelected( touched, false );
      }
    },



    /**
     * The 'All Map Points' filter selection clears all other current selections
     * that were previously selected, and all other filter selections will clear
     * the 'All Map Points' selection if it was previously selected.
     *
     * This function checks the value of the touched element, and if it is the
     * 'All Map Points' filter selection then remove all elements from the
     * current selected array and records that 'All Map Points' is now selected.
     *
     * If the touched element was not 'All Map Points' then check to see if 'All
     * Map Points' was just selected; if it was then we deselect it and record this.
     *
     * @param  {object} touched Element that users selected in the filter
     */
    filterChangeAllMapPoints: function ( touched ) {
      //if the filter selection is 'All Map Points'
      if ( touched.value === "All Map Points" ) {
        //loop through 'currentFiltered' array to change the style of the elements
        //that will be removed from 'currentFiltered' array
        for (i = 0; i < SMSMap.currentFiltered.length; i++) {
          SMSMap.filterChangeSelected( SMSMap.currentFiltered[i], false);
        }
        //empty the 'currentFiltered' array
        SMSMap.currentFiltered = [];
        //record that 'All Map Points' is now selected
        SMSMap.allMapPoints = true;
      }
      //if the selected filter was not 'All Map Points'
      else if( SMSMap.allMapPoints ) {
        //loop through all 'currentFiltered' array elements, and if one of them
        //is 'All Map Points reset its class value, splice it from the array, and
        //record this deselected state.'
        for ( var a = 0; a < SMSMap.currentFiltered.length; a++ ) {
          if ( SMSMap.currentFiltered[a].value === "All Map Points" ) {
            SMSMap.currentFiltered[a].className = "list";
            SMSMap.currentFiltered.splice( a, 1 );
            SMSMap.allMapPoints = false;
            break;
          }
        }
      }
    },



    /**
     * The 'All States' filter selection clears all other current selections
     * that were states, and all state filter selections will clear
     * the 'All States' selection if it was previously selected.
     *
     * This function checks the value of the touched element, and if it is the
     * 'All States' filter selection then remove all state elements from the
     * current selected array and records that 'All States' is now selected.
     *
     * If the touched element was not 'All States' then check to see if
     * 'All States' was just selected; if it was then we deselect it and record this.
     *
     * @param  {object} touched Element that users selected in the filter
     */
    filterChangeAllStates: function ( touched ) {
      //if the selection is 'All States'
      if ( touched.value === "All States" ) {
        //make temp array
        var tempArr = [];

        //store all 'currentFiltered' elements in a temp array
        for( var b = 0; b < SMSMap.currentFiltered.length; b++ ) {
          tempArr[b] = SMSMap.currentFiltered[b];
        }

        //go through the temp array, splice out any states and reset their class
        for (i = 0; i < tempArr.length; i++) {
          if ( tempArr[i].value.length === 2 ) { // change  --- this is a bad way of determining if it is state...should have function to compare 'touched.value' to stateArray
            var location = SMSMap.currentFiltered.indexOf( tempArr[i] );

            if ( location != -1 ) {
              SMSMap.currentFiltered[ location ].className = "list";
              SMSMap.currentFiltered.splice( location, 1 );
            }
          }
        }
        //record that 'All States' is now selected
        SMSMap.allStates = true;
      }
      //otherwise, if 'All States' was just selected
      else if ( SMSMap.allStates ) {
        //if the selected filter was a state
        if ( touched.value.length === 2 ) { // change  --- this is a bad way of determining if it is state...should have function to compare 'touched.value' to stateArray
          //go through the 'currentSelected' array to find 'All States', splice it out,
          //reset its class, and record this
          for ( var a = 0; a < SMSMap.currentFiltered.length; a++ ) {
            if ( SMSMap.currentFiltered[a].value === "All States" ) {
              SMSMap.currentFiltered[a].className = "list not-half";
              SMSMap.currentFiltered.splice( a, 1 );
              SMSMap.allStates = false;
              break;
            }
          }
        }
      }
    },



    /**
     * Changes the class of the selected element so that the css styling changes
     * and shows the user that it is selected/deselected. Needed to add regex because
     * some of the elements have a not half-width addition to their className and some don't.
     *
     * @param  {object} touched  Element that users selected in the filter
     * @param  {boolean} action  True = change class to selected, False = change class to deselected
     */
    filterChangeSelected: function ( touched, action ) {
      //regex used to determine if the string 'not-half' is in the class name
      var halfCheck = /\bnot-half\b/;

      //if we are changing the class to the selected state
      if ( action === true ) {
        //test the regex and if it matches change to 'not-half' selected class
        if ( halfCheck.test( touched.className ) ) {
          touched.className = "current not-half";
        }
        //otherwise change to normal selected class
        else {
          touched.className = "current";
        }

      }
      //otherwise we are changing the class to the deselected state
      else {
        //test the regex and if it matches change to 'not-half' deselected class
        if ( halfCheck.test( touched.className ) ) {
          touched.className = "list not-half";
        }
        //otherwise change to normal deselected class
        else {
          touched.className = "list";
        }

      }
    },



    /**
     * Compares the last executed filter and the current selected filter.
     *
     * @return {boolean} True if the filter arrays are the same, False is different
     */
    filterPastSameAsCurrent: function () {
      var curr = SMSMap.currentFiltered;
      var past = SMSMap.pastFiltered;

      //if the lengths of the arrays are not equal then they aren't the same
      if ( curr.length != past.length ) {
        return false;
      }

      //for every element in the current array see if that element exists in the past array
      for ( var i = 0; i < curr.length; i++ ) {
        if ( past.indexOf( curr[i] ) == -1 ) {
          return false;
        }
      }

      //else the arrays are the same for our purposes
      return true;
    },



    /**
     * Changes the status of whether or not the user is allowed to execute the filter,
     * and changes the style of the filter button by changing its id.
     *
     * @param  {object} button The filter button element that users press
     * @param  {boolean} action True = enable filter, False = disable filter
     */
    changeAllowFilter: function ( button, action ) {
      //if the action is true change style of button and allow user to filter
      if ( action === true ) {
        button.id = "filter-calc-ready";
        SMSMap.filterAllowed = true;
      }
      //if action is fault change style of button and don't allow user to filter
      else {
        button.id = "filter-calc";
        SMSMap.filterAllowed = false;
      }
    },



    /**
     * Clear the 'pastFiltered' array and copy everything in the 'currentFiltered'
     * arry into the empty 'partFiltered' array. Then disallow the filter for the next
     * time the user opens the filter interface.
     */
    filterUpdatePast: function () {
      //clear 'pastFiltered' array
      SMSMap.pastFiltered = [];

      //loop through all 'currentFiltered' array and copy all elements to empty 'pastFiltered' array
      for ( var i = 0; i < SMSMap.currentFiltered.length; i++ ) {
        SMSMap.pastFiltered.push( SMSMap.currentFiltered[i] );
      }

      //disallow filter action
      SMSMap.changeAllowFilter( SMSMap.filterMainButton, false );
    },



    //map styling options
    mapStyle: [
      {
          "featureType":"all",
          "elementType":"all",
          "stylers": [
              {"visibility":"simplified"}
          ]
      },
      {
          "featureType":"administrative",
          "elementType":"labels.text.fill",
          "stylers": [
              {"color":"#444444"}
          ]
      },
      {
          "featureType":"landscape",
          "elementType":"all",
          "stylers": [
              {"color":"#f2f2f2"}
          ]
      },
      {
          "featureType":"poi",
          "elementType":"all",
          "stylers": [
              {"visibility":"off"}
          ]
      },
      {
          "featureType":"road",
          "elementType":"all",
          "stylers": [
              {"saturation":-100},
              {"lightness":45}
          ]
      },
      {
          "featureType":"road.highway",
          "elementType":"all",
          "stylers": [
              {"visibility":"simplified"}
          ]
      },
      {
          "featureType":"road.arterial",
          "elementType":"labels.icon",
          "stylers": [
              {"visibility":"off"}
          ]
      },
      {
          "featureType":"transit",
          "elementType":"all",
          "stylers": [
              {"visibility":"off"}
          ]
      },
      {
          "featureType":"water",
          "elementType":"all",
          "stylers": [
              {"color":"#34495e"},
              {"visibility":"on"}
          ]
      }
    ]

};
