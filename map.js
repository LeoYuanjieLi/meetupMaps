"use strict";

// -------------------some constants------------------------



// meetUp URL
const MEETUP_URL = `https://api.meetup.com/2/open_events?&sign=true&photo-host=public&topic=`;
const KEY = `142472577a4319c5c396d7767136165`;
// map center latitude and longitude
let centerLat;
let centerLon;
// event markers
let eventMarkers = [];
// EVENT_DIST_PAIR is to be used for storing the fetched data for sorting purpose.
let EVENT_DIST_PAIR;
// declare user input
let USER_INPUT;
// declare the result URL, we will get it when user first click on search, we will save the 'next link' for 'load-more' function
let STORED_RESPONSE;
// // this is for the overlay center circle
// let overlay;
// circleOverlay.prototype = new google.maps.OverlayView();

// // -------------------some constants<end>--------------

// initualize map
let map;
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    mapTypeControl: false,
    center: {lat: 42.3770, lng: -71.1167},
    zoom: 10,
    styles: mapStyle
  });
  
  // Try HTML5 geolocation.
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(mapPos) {
      let pos = {
        lat: mapPos.coords.latitude,
        lng: mapPos.coords.longitude
      };

      centerLat = mapPos.coords.latitude;
      centerLon = mapPos.coords.longitude;
      console.log(pos.lat);
      const mapCenter = pos;
      let marker = new google.maps.Marker({
        map: map,
        scale:0.6,
        draggable: false,
        animation: google.maps.Animation.BOUNCE,
        position: mapCenter
      });

      map.setCenter(pos);

    }, function() {
      handleLocationError(true, infowindow, map.getCenter());
    });



  } else {
    // Browser doesn't support Geolocation
    handleLocationError(false, infowindow, map.getCenter());
  }
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setContent(browserHasGeolocation ?
                        'Error: The Geolocation service failed.' :
                        'Error: Your browser doesn\'t support geolocation.');
  infoWindow.open(map);
}


// meetUp search
function search(){
  $('#js-search').submit(event =>{
    event.preventDefault();
    // if there are list viewing, close it because of user re-searched.
    $(".js-results").css("visibility", "hidden");
    // get user input
    USER_INPUT = $("#searchBar input").val();
    if(hasNumber(USER_INPUT)){
      alert("number is not allowed!");
    }else if(hasSpecialChar(USER_INPUT)){
      alert("special character is not allowed!")
    }else{
    $.ajax({
      url: `${MEETUP_URL}${USER_INPUT}&offset=0&key=${KEY}&lat=${centerLat}&lon=${centerLon}&radius=smart&page=20`,
      dataType: "JSONP",
      method: 'GET',
      page: '20',

      success: function(result){
        STORED_RESPONSE = result;
        cleanMarkers(eventMarkers);
        if(result.results === undefined){
          alert('No Events Listed, please try another keyword!')
        }else{
          eventMarkers = addMarkers(result.results);
        }

        showListButton(eventMarkers);
        showMarkers(eventMarkers, result.results);
        $(listView(eventMarkers, result.results));
        // console.log(result);
        // here we make a deep copy of all events. To use for sorting purposes.
        let STORED_MARKERS = $.extend(true, [], eventMarkers);
        let STORED_EVENTS = $.extend(true, [], result.results);
        // console.log("The length of STORED_EVENTS is", STORED_EVENTS.length);
        EVENT_DIST_PAIR = [];
        for (let i = 0; i<STORED_EVENTS.length; i++){
          EVENT_DIST_PAIR.push([STORED_EVENTS[i], STORED_MARKERS[i][1]]);
        }

        // console.log("The length of EVENT_DIST_PAIR is", EVENT_DIST_PAIR.length);
      }


    })}
    })
}



// clean markers on the map
function cleanMarkers(markers){

  for(let i = 0; i < markers.length; i++){
    markers[i][0].setMap(null);
  }
}

// add event location on map
function addMarkers(events){
// events is an array of events
  let markers = [];
  for(let i = 0; i < events.length; i++){
    // console.log(events[i].venue);
    let eventLon;
    let eventLat;
    if(events[i].venue === undefined){
      eventLon = events[i].group.group_lon;
      eventLat = events[i].group.group_lat;     
    }else{
      eventLon = events[i].venue.lon;
      eventLat = events[i].venue.lat;
    };
    // console.log(eventLat,eventLon);
    let adjLatLon = correctPutLocation(eventLat, eventLon);
    let latLng = new google.maps.LatLng(adjLatLon[0], adjLatLon[1]);
    let distance = calDistance(eventLat, eventLon, centerLat, centerLon);
    let opa = parseFloat((1/Math.sqrt(distance)).toFixed(2), 10);
    let marker = new google.maps.Marker({
      position:latLng,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale:6,
        fillOpacity:opa,
        fillColor:'magenta',
        strokeColor:'magenta',
        strokeWeight:1,
      },
    });
    markers.push([marker, distance]);

  }

  return markers


}

// There is an issue need to be addressed: when showing the map, some markers have the exact same location, 
// so, if one spot has been taken, the next one that shares the same location need to be put a little bit to the side

function correctPutLocation(eventLat, eventLon){
  // give the location a random coefficience from the center
  let plusOrMinus = Math.floor(Math.random()*2) == 1 ? 1 : -1;
  let dLat = Math.random()* 0.001 *plusOrMinus;
  plusOrMinus = Math.floor(Math.random()*2) == 1 ? 1 : -1;
  let dLon = Math.random()*0.001 *plusOrMinus;
  let adjEventLat = dLat + eventLat;
  let adjEventLon = dLon + eventLon;
  return [adjEventLat, adjEventLon]
}


// show markers on the map, the markers should have an infowindow associate with it.
function showMarkers(markers, events){
  let infowindow = new google.maps.InfoWindow({
    maxWidth: 220,
    maxHeight:400,

  });

  for(let i = 0; i < markers.length; i++){
    markers[i][0].setMap(map);
    let eventDescription;
    let eventLocalTime;
    if(events[i].description === undefined){
      eventDescription = "Please see event detail on the website.";
    }else{
      eventDescription = events[i].description;
    }

    if(events[i].time === undefined){
      eventLocalTime = "Not Provided";
    }else{
      eventLocalTime = new Date(events[i].time + events[i].utc_offset);
    }
    // console.log(eventLocalTime);
    let contentString = `
    <div class = 'popUpWindow'>
    <h1>Event Name: ${events[i].name}</h1>
    <p>Event Time(Local): ${eventLocalTime}</p>
    <p>Distance to you: ${markers[i][1].toFixed(2)} Miles</p>
    <a class = "link" href = '${events[i].event_url}' target="_blank">Event Link</a>
    <br>
    </div>
    `
    markers[i][0].addListener('click', function(){
      infowindow.open(map, markers[i][0])
      infowindow.setContent(contentString);
      infowindow.open(map, markers[i][0]);

    });

    // if user click on the map, the window should close
    map.addListener('click', function(){
      infowindow.close();
    })
  }
    // if user click on any button, the window should close as well. 
    $('button').click(event => {
      infowindow.close();
    })
}


// calculate distance given two points of latitude and longitude
function calDistance(lat1, lon1, lat2, lon2){
    var R = 6371e3; // metres
    var φ1 = lat1*(Math.PI / 180);
    var φ2 = lat2*(Math.PI / 180);
    var Δφ = (lat2-lat1)*(Math.PI / 180);
    var Δλ = (lon2-lon1)*(Math.PI / 180);

    var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    var d = R * c;
    return d/1000*0.621371
}


// create a list view of events construct by an array of single views
function listView(markers,events){
  $(".listButton").click(event =>{
    $(".js-results").empty();
    $(".js-results").css("visibility", "visible");
    $('.js-results').append(`<button class="close-list">&#10005</button>`);
    $('.js-results').append(`<button class="sort-by-prox">Sort By Proximity</button>`);
    $('.js-results').append(`<button class="sort-by-time">Sort By Time</button>`);
    $('.js-results').append(`<div class="js-results-list">
                             <div class = "part-one"></div>
                             </div>`);
    // console.log('function listView ran!');
    for(let i =0; i< events.length; i++){
      $('.js-results-list .part-one').append(singleView(markers[i],events[i]));
    }

     $('.js-results-list').append(`<div class="load-more"><button>Load More</button></div>`);
     if(STORED_RESPONSE["meta"]["next"] !== ""){
      $('.load-more').css("visibility", "visible");
     }
    
  })
}


// when user click on load more, the reload function will load additional callback events, it is similar to listView function
function reload(markers,events){
    // console.log('function listView ran!');
    for(let i =0; i< events.length; i++){
      $('.js-results-list .part-one').append(singleView(markers[i],events[i]));
    }

    
}
// create a single view of an event
function singleView(marker,event){
  // console.log('function singleView ran!');
  let eventDescription;
  let eventLocalTime;
  if(event.description === undefined){
    eventDescription = "Please see event detail on the website.";
  }else{
    eventDescription = event.description;
  }

  if(event.time === undefined){
    eventLocalTime = "Not Provided";
  }else{
    eventLocalTime = new Date(event.time+event.utc_offset);
  }

  return `
  <div class='single-view'>
    <h1>${event.name}</h1>
    <div><span class="bold">Distance to you:</span><span>${marker[1].toFixed(2)} Miles</span></div>
    <div><span class="bold">Event Time: </span><span>${eventLocalTime}</span></div>
    <br>
    <a class = "link" href = '${event.event_url}' target="_blank">Event Link</a>    
    <div class="event-content-single-view">${eventDescription}</div>
  </div>
  `
}

function closeList(){
  $('.js-results').on("click", ".close-list", (event =>{
    console.log('function closeList ran!');
    $(".js-results").empty();
    $(".js-results").css("visibility", "hidden");
  }))
}

// show listEvent Button
function showListButton(markers){
  if(markers.length ===0){
    $('.js-list-button').empty()
  }else if(markers.length !==0){
    $('.js-list-button').empty();
    $('.js-list-button').append(`<button class="listButton">View in List</button>`)
  }
}




//-----------------------------Make the DIV element draggagle-------------------------------:
// dragElement(document.getElementById(("searchBar")));
function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    /* if present, the header is where you move the DIV from:*/
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    /* otherwise, move the DIV from anywhere inside the DIV:*/
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    /* stop moving when mouse button is released:*/
    document.onmouseup = null;
    document.onmousemove = null;
  }
}


// ---------------------- draggable div end---------------------------------------------


// ---------------------------------Sorting Functions---------------------------------------------

// sort the list events by proximity
function sortProx(){
  $('.js-results').on("click", '.sort-by-prox', event =>{
    event.preventDefault();
    // console.log('sortProx ran!');
    let sortedEvents = [];
    let sortedDistance = [];
    // console.log("test", EVENT_DIST_PAIR.length);
    for(let i = 0; i<EVENT_DIST_PAIR.length; i++){
      sortedDistance.push(EVENT_DIST_PAIR[i][1]);
    }

    // sort the numbers first
    sortedDistance.sort((a,b)=>{return a-b});

    // store the EVENTS into a temp file because we need to change to old array
    let EVENT_DIST_PAIR_temp = $.extend(true, [], EVENT_DIST_PAIR); 

    // sort the event according to the distance
    sortedDistance.forEach(function(key) {
        var found = false;
        EVENT_DIST_PAIR = EVENT_DIST_PAIR.filter(function(item) {
            if(!found && item[1] == key) {
                sortedEvents.push(item[0]);
                found = true;
                return false;
            } else 
                return true;
        })
    })

    // recover our array 
    EVENT_DIST_PAIR = EVENT_DIST_PAIR_temp;


    // console.log("STORED_EVENTS is", EVENT_DIST_PAIR);
    // console.log("sorted distance is", sortedDistance);
    // console.log("sorted events are", sortedEvents);
    $('.part-one').empty();
    for(let i = 0; i<sortedEvents.length; i++){

      let eventDescription;
      let eventLocalTime;
      if(sortedEvents[i]["description"] === undefined){
        eventDescription = "Please see event detail on the website.";
      }else{
        eventDescription = sortedEvents[i]["description"];
      }

      if(sortedEvents[i]["time"] === undefined){
        eventLocalTime = "See on website";
      }else{
        eventLocalTime = new Date(sortedEvents[i]["time"] +sortedEvents[i]["utc_offset"]);
      }

      let singleContent = 
      `
      <div class='single-view'>
        <h1>${sortedEvents[i]["name"]}</h1>
        <div><span class="bold">Distance to you:</span><span>${sortedDistance[i].toFixed(2)} Miles</span></div>
        <div><span class="bold">Event Time: </span><span>${eventLocalTime}</span></div>
        <br>
        <a class = "link" href = '${sortedEvents[i]["event_url"]}' target="_blank">Event Link</a>    
        <div class="event-content-single-view">${eventDescription}</div>
      </div>
      `;
      $('.part-one').append(singleContent);
    }

    // console.log('now the length of EVENT_DIST_PAIR is', EVENT_DIST_PAIR.length);
  })
}



// sort the list events by proximity
function sortTime(){
  $('.js-results').on("click", '.sort-by-time', event =>{
    event.preventDefault();
    // console.log('sortTime ran!');
    let sortedEvents = [];

    let sortedTime = [];
    for(let i = 0; i<EVENT_DIST_PAIR.length; i++){
      sortedTime.push(EVENT_DIST_PAIR[i][0]["time"]);
    }
    // store the EVENTS into a temp file because we need to change to old array    
    let EVENT_DIST_PAIR_temp = $.extend(true, [], EVENT_DIST_PAIR); 
    // sort the numbers first
    sortedTime.sort((a,b)=>{return a-b});

    // sort the event according to the distance
    sortedTime.forEach(function(key) {
        var found = false;
        EVENT_DIST_PAIR = EVENT_DIST_PAIR.filter(function(item) {
            if(!found && item[0]["time"] == key) {
                sortedEvents.push(item);
                found = true;
                return false;
            } else 
                return true;
        })
    })


    // recover our array 
    EVENT_DIST_PAIR = EVENT_DIST_PAIR_temp;


    // console.log("STORED_EVENTS is", EVENT_DIST_PAIR);
    // console.log("sorted time is", sortedTime);
    // console.log("sorted events are", sortedEvents);
    $('.part-one').empty();

    for(let i = 0; i<sortedTime.length; i++){

      let eventDescription;
      let eventLocalTime;

      if(sortedEvents[i][0]["description"] === undefined){
        eventDescription = "Please see event detail on the website.";
      }else{
        eventDescription = sortedEvents[i][0]["description"];
      }

      if(sortedEvents[i][0]["time"] === undefined){
        eventLocalTime = "See on website";
      }else{
        eventLocalTime = new Date(sortedEvents[i][0]["time"] +sortedEvents[i][0]["utc_offset"]);
      }

      let singleContent = 
      `
      <div class='single-view'>
        <h1>${sortedEvents[i][0]["name"]}</h1>
        <div><span class="bold">Distance to you:</span><span>${sortedEvents[i][1].toFixed(2)} Miles</span></div>
        <div><span class="bold">Event Time: </span><span>${eventLocalTime}</span></div>
        <br>
        <a class = "link" href = '${sortedEvents[i][0]["event_url"]}' target="_blank">Event Link</a>    
        <div class="event-content-single-view">${eventDescription}</div>
      </div>
      `;
      $('.part-one').append(singleContent);
    }
    
  })
}

// ---------------------------------Sorting Functions Ends--------------------------------------------

// -----------------Load more into page when user click on the load-more button-----------------------

function loadmore(){
  // TO DO
  $(".js-results").on( "click", ".load-more button", event =>{
    // console.log('load-more function ran, and the link is', STORED_RESPONSE.meta);
    if (STORED_RESPONSE["meta"]["next"] !== ""){

      $.ajax({
                url: STORED_RESPONSE["meta"]["next"],
                dataType: "JSONP",
                method: 'GET',
                page: '20',
                success: function(result){
                  STORED_RESPONSE = result;
                  if(STORED_RESPONSE["meta"]["next"] === ""){
                      $(".load-more").css("visibility", "hidden");
                    };
                  console.log("the new response is", result);
                  let newEventMarkers = addMarkers(result.results);
                  eventMarkers.push.apply(eventMarkers, newEventMarkers);
                  showMarkers(newEventMarkers, result.results);
                  reload(eventMarkers, result.results);
                  console.log(eventMarkers);
                  // here we make a deep copy of all events. To use for sorting purposes.
                  let STORED_MARKERS = $.extend(true, [], eventMarkers);
                  let STORED_EVENTS = $.extend(true, [], result.results);
                  // console.log("The length of STORED_EVENTS is", STORED_EVENTS.length);
                  for (let i = 0; i<STORED_EVENTS.length; i++){
                    EVENT_DIST_PAIR.push([STORED_EVENTS[i], STORED_MARKERS[i][1]]);
                  }
                }
            })


    }else{
      console.log('no more events!')
    }



  })
}

// -----------------Load more ends--------------------------------------------------------------------

// -------------------------------------enter page----------------------------------------------------
function enterPage(){
  $('.cover-page button').click(event=>{
    event.preventDefault();
    $('.cover-page').remove();

  })
}
// -------------------------------------enter page ends-----------------------------------------------

// --------------------------------------check if contains numbers in string--------------------------

function hasNumber(str) {
  return /\d/.test(str);
}
// --------------------------------------check if contains numbers in string end----------------------

// --------------------------------------check if contains special char ------------------------------
function hasSpecialChar(str){
 return /[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?@]/g.test(str);
}
// --------------------------------------check if contains special char end --------------------------

// ----------------------------------Run the program--------------------------------------------------

$(search);
$(sortProx);
$(sortTime);
$(enterPage);
$(closeList);
$(loadmore);