"use strict";

// -------------------some constants------------------------



// meetUp URL
const MEETUP_URL = `https://api.meetup.com/find/upcoming_events?&sign=true&page=30&photo-host=public&text=`;
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

      console.log(pos.lat);
      const mapCenter = pos;
      let marker = new google.maps.Marker({
          position:mapCenter,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale:20,
            strokeWeight:0,
            fillColor:'black',
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
      url: `${MEETUP_URL}${userInput}&page=20&offset=5&key=${KEY}`,
      dataType: "JSONP",
      method: 'GET',
      // headers: {
      //   // 'Access-Control-Allow-Origin': '*',
      //   // 'Content-type': 'application/x-www-form-urlencoded',
      //   Authorization: `Bearer ${KEY}`
      // }
      success: function(result){
        centerLat = result.data.city.lat;
        centerLon = result.data.city.lon;
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
    let latLng = new google.maps.LatLng(eventLat, eventLon);
    let distance = calDistance(eventLat, eventLon, centerLat, centerLon);
    let opa = parseFloat((1/Math.sqrt(distance)).toFixed(2), 10);
    let marker = new google.maps.Marker({
      position:latLng,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale:6,
        fillOpacity:opa,
        fillColor:'magenta',
        strokeColor:'blue',
        strokeWeight:2,
      },
    });
    markers.push([marker, distance]);
    console.log(opa);
  }

  return markers


}

// show markers on the map, the markers should have an infowindow associate with it.
function showMarkers(markers, events){
  let infowindow = new google.maps.InfoWindow({
    maxWidth: 400,
    maxHeight:400,

  });

  for(let i = 0; i < markers.length; i++){
    markers[i][0].setMap(map);
    let contentString = `
    <div class = 'popUpWindow'>
    <h1>Event Name: ${events[i].name}</h1>
    <p>Distance to you: ${markers[i][1].toFixed(2)} Miles</p>
    <a class = "link" href = '${events[i].link}' target="_blank">Event Link</a>
    <div class="eventContentPopUp">${events[i].description}</div>
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
    $('.js-results').append(`<button class="close-list">Close</button>`)
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
  return `
  <div class='single-view'>
    <h1>${event.name}</h1>
    <p>Distance to you: ${marker[1].toFixed(2)} Miles</p>
    <a class = "link" href = '${event.link}' target="_blank">Event Link</a>    
    <div class="event-content-single-view">${event.description}</div>
  </div>
  `
}

function closeList(){
  $('.js-results').on("click", ".close-list", (event =>{
    console.log('function closeList ran!');
    $(".js-results").empty();
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

$(search);