let map;

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 39.2259125, lng: -84.52 },
    zoom: 15,
    draggable: false,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
  });

  var markers = [];

  let isDrawing = false;
  let overlay = new google.maps.OverlayView();
  overlay.draw = function () {};
  overlay.setMap(map);
  let polyLine;
  let pointsArray = Array();

  ["mousedown", "touchstart"].forEach((evt) =>
    document.getElementById("map").addEventListener(evt, function () {
      isDrawing = true;
      polyLine = new google.maps.Polyline({
        map: map,
      });
    })
  );

  google.maps.event.addListener(map, "mousemove", function (e) {
    if (isDrawing == true) {
      let pageX = e.pixel.x;
      let pageY = e.pixel.y;
      let point = new google.maps.Point(parseInt(pageX), parseInt(pageY));
      let latLng = overlay.getProjection().fromContainerPixelToLatLng(point);
      polyLine.getPath().push(latLng);
      latLng = String(latLng);
      latLng = latLng.replace("(", "");
      latLng = latLng.replace(")", "");
      let array_lng = latLng.split(",");
      pointsArray.push(new google.maps.LatLng(array_lng[0], array_lng[1]));
    }
  });

  ["mouseup", "touchend"].forEach((evt) =>
    document.getElementById("map").addEventListener(evt, function () {
      isDrawing = false;
      const polygon = new google.maps.Polygon({
        paths: pointsArray,
        strokeColor: "#0FF000",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#0FF000",
        fillOpacity: 0.35,
        editable: true,
        geodesic: false,
      });
      polygon.setMap(map);
      polyLine.setMap(null);
      pointsArray = [];
    })
  );
}
