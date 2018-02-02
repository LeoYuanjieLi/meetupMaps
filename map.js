"use strict";

// -------------------some constants------------------------



// meetUp URL
const MEETUP_URL = `https://api.meetup.com/find/upcoming_events?&sign=true&photo-host=public&text=`;
const KEY = `142472577a4319c5c396d7767136165`;
// map center latitude and longitude
let centerLat;
let centerLon;
// this is for the overlay center circle
let overlay;

// -------------------some constants<end line>--------------





// google maps

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
      let marker = new google.maps.Marker({
        position: {lat: pos.lat, lng: pos.lng},
        optimized:false,
        map: map
      });
      // infoWindow.setContent('Location found.');
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

  $('#js-search').submit(event =>{
    console.log("search ran!")
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
        showOnMap(result.data.events);
        console.log(result.data)
      } 
    })

    })
}

// show event location on map
function showOnMap(events){
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
        strokeWeight:0
      },
      map:map
    });
    console.log(distance)
    markers.push(marker);

  }


}





$(search);