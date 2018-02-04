"use strict";

// -------------------some constants------------------------



// meetUp URL
const MEETUP_URL = `https://api.meetup.com/find/upcoming_events?&sign=true&photo-host=public&text=`;
const KEY = `142472577a4319c5c396d7767136165`;
// map center latitude and longitude
let centerLat;
let centerLon;
// // this is for the overlay center circle
// let overlay;
// circleOverlay.prototype = new google.maps.OverlayView();

// // -------------------some constants<end line>--------------





// // google maps
// // overlay constructor, we need this to customize the center location object
// /** @constructor */
// function circleOverlay(cirCenter, image, map) {

//   // Initialize all properties.
//   this.bounds_ = cirCenter;
//   this.image_ = image;
//   this.map_ = map;

//   // Define a property to hold the image's div. We'll
//   // actually create this div upon receipt of the onAdd()
//   // method so we'll leave it null for now.
//   this.div_ = null;

//   // Explicitly call setMap on this overlay.
//   this.setMap(map);
// }

// /**
//  * onAdd is called when the map's panes are ready and the overlay has been
//  * added to the map.
//  */
// circleOverlay.prototype.onAdd = function() {

//   var div = document.createElement('div');
//   div.style.borderStyle = 'none';
//   div.style.borderWidth = '0px';
//   div.style.position = 'absolute';

//   this.div_ = div;

//   // Add the element to the "overlayLayer" pane.
//   var panes = this.getPanes();
//   panes.overlayLayer.appendChild(div);
// };

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
            fillColor:'white',
            fillOpacity:0.4,
          },
        map: map
      });
      // setContent('Location found.');
      map.setCenter(pos);
    }, function() {
      handleLocationError(true, infoWindow, map.getCenter());
    });



  } else {
    // Browser doesn't support Geolocation
    handleLocationError(false, infoWindow, map.getCenter());
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
        showMarkers(eventMarkers, result.data.events);
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
    let distance = Math.sqrt((eventLat*1000 - centerLat*1000)**2 + (eventLon*1000 - centerLon*1000)**2);
    let marker = new google.maps.Marker({
      position:latLng,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale:10,
        fillColor:'magenta',
        fillOpacity:1/distance*150,
        strokeColor:'magenta',
        strokeWeight:0,
      },
    });
    markers.push(marker);

  }

  return markers


}

// show markers on the map, the markers should have an infowindow associate with it.
function showMarkers(markers, events){
  let infowindow = new google.maps.InfoWindow({
    maxWidth: 600,
    maxHeight:200,

  });

  for(let i = 0; i < markers.length; i++){
    markers[i].setMap(map);
    let contentString = `
    <div class = 'popUpWindow'>
    <h1>Event Name: ${events[i].name}</h1>
    <a class = "link" href = '${events[i].link}' target="_blank">Event Link</a>
    <div class="eventContentPopUp">${events[i].description}</div>
    </div>
    `
    markers[i].addListener('click', function(){
      infowindow.open(map, markers[i])
      infowindow.setContent(contentString);
      infowindow.open(map, markers[i]);
    });
  }
}

// clean markers on the map
function cleanMarkers(markers){

  for(let i = 0; i < markers.length; i++){
    markers[i].setMap(null);
  }
}





$(search);