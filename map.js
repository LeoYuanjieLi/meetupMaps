"use strict";

// -------------------some constants------------------------



// meetUp URL
const MEETUP_URL = `https://api.meetup.com/find/upcoming_events?&sign=true&photo-host=public&topic_category=`;
const KEY = `142472577a4319c5c396d7767136165`;
// map center latitude and longitude
let centerLat;
let centerLon;
// // this is for the overlay center circle
// let overlay;
// circleOverlay.prototype = new google.maps.OverlayView();

// // -------------------some constants<end line>--------------

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
          position:mapCenter,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale:20,
            strokeWeight:0,
            fillColor:'lightblue',
            fillOpacity:0.4,
            strokeColor: "black",
            strokeWeight: 2
          },
        map: map
      });
      // setContent('Location found.');
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
  let eventMarkers = [];
  $('#js-search').submit(event =>{
    event.preventDefault();
    let userInput = $("#searchBar input").val();
    $.ajax({
      url: `${MEETUP_URL}${userInput}&offset=5&key=${KEY}&lat=${centerLat}&lon=${centerLon}&radius=smart`,
      dataType: "JSONP",
      method: 'GET',
      page: '60',

      // headers: {
      //   // 'Access-Control-Allow-Origin': '*',
      //   // 'Content-type': 'application/x-www-form-urlencoded',
      //   Authorization: `Bearer ${KEY}`
      // }
      success: function(result){
        eventMarkers = addMarkers(result.data.events);
        if(eventMarkers.length === 0){
          alert('No Events Listed, please try another keyword!')
        }
        showListButton(eventMarkers);
        showMarkers(eventMarkers, result.data.events);
        $(listView(eventMarkers, result.data.events));
        $(closeList);
        console.log(result.data);
      } 
    })

    cleanMarkers(eventMarkers);
    })
}

// add event location on map
function addMarkers(events){
// events is an array of events
  let markers = [];
  for(let i = 0; i < events.length; i++){
    let eventLon = events[i].group.lon;
    let eventLat = events[i].group.lat;
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
    console.log(opa);
  }

  return markers


}

// There is an issue need to be addressed: when showing the map, some markers have the exact same location, 
// so, if one spot has been taken, the next one that shares the same location need to be put a little bit to the side

function correctPutLocation(eventLat, eventLon){
  // give the location a random coefficience from the center
  let plusOrMinus = Math.floor(Math.random()*2) == 1 ? 1 : -1;
  let dLat = Math.random()* 0.003 *plusOrMinus;
  plusOrMinus = Math.floor(Math.random()*2) == 1 ? 1 : -1;
  let dLon = Math.random()*0.003 *plusOrMinus;
  let adjEventLat = dLat + eventLat;
  let adjEventLon = dLon + eventLon;
  return [adjEventLat, adjEventLon]
}


// show markers on the map, the markers should have an infowindow associate with it.
function showMarkers(markers, events){
  let infowindow = new google.maps.InfoWindow({
    maxWidth: 400,
    maxHeight:400,

  });

  for(let i = 0; i < markers.length; i++){
    markers[i][0].setMap(map);
    let eventDescription;
    let eventLocalTime;
    let eventLocalDate;
    if(events[i].description === undefined){
      eventDescription = "Please see event detail on the website.";
    }else{
      eventDescription = events[i].description;
    }

    if(events[i].local_time === undefined){
      eventLocalTime = "Not Provided";
    }else{
      eventLocalTime = events[i].local_time;
    }

    if(events[i].local_date === undefined){
      eventLocalDate = "Not Provided";
    }else{
      eventLocalDate = events[i].local_date;
    }
    let contentString = `
    <div class = 'popUpWindow'>
    <h1>Event Name: ${events[i].name}</h1>
    <p>Event Time(Local): ${eventLocalDate} at ${eventLocalTime}</p>
    <p>Distance to you: ${markers[i][1].toFixed(2)} Miles</p>
    <a class = "link" href = '${events[i].link}' target="_blank">Event Link</a>
    <br>
    <div class="eventContentPopUp">${eventDescription}</div>
    </div>
    `
    markers[i][0].addListener('click', function(){
      infowindow.open(map, markers[i][0])
      infowindow.setContent(contentString);
      infowindow.open(map, markers[i][0]);
    });
  }
}

// clean markers on the map
function cleanMarkers(markers){

  for(let i = 0; i < markers.length; i++){
    markers[i][0].setMap(null);
  }
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


// create a list view of events
function listView(markers,events){
  $(".js-list-button").click(event =>{
    $(".js-results").empty();
    $(".js-results").css("visibility", "visible");
    $('.js-results').append(`<button class="close-list">&#10005</button>`);
    $('.js-results').append(`<button class="sort-by-list">Sort By Proximity</button>`);
    $('.js-results').append(`<button class="sort-by-list">Sort By Time</button>`);
    $('.js-results').append(`<div class="js-results-list"></div>`);
    console.log('function listView ran!');
    for(let i =0; i< events.length; i++){
      $('.js-results-list').append(singleView(markers[i],events[i]));

    }
    
  })
}

// create a single view of an event
function singleView(marker,event){
  console.log('function singleView ran!')
  let eventDescription;
  let eventLocalTime;
  let eventLocalDate;
  if(event.description === undefined){
    eventDescription = "Please see event detail on the website.";
  }else{
    eventDescription = event.description;
  }

  if(event.local_time === undefined){
    eventLocalTime = "Not Provided";
  }else{
    eventLocalTime = event.local_time;
  }

  if(event.local_date === undefined){
    eventLocalDate = "Not Provided";
  }else{
    eventLocalDate = event.local_date;
  }
  return `
  <div class='single-view'>
    <h1>${event.name}</h1>
    <div><span class="bold">Distance to you:</span><span>${marker[1].toFixed(2)} Miles</span></div>
    <div><span class="bold">Event Time: </span><span>${eventLocalTime}</span></div>
    <div><span class="bold">Event Date: </span><span>${eventLocalDate}</span></div>
    <br>
    <a class = "link" href = '${event.link}' target="_blank">Event Link</a>    
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
dragElement(document.getElementById(("searchBar")));
dragElement(document.getElementsByClassName("js-results"));
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





$(search);