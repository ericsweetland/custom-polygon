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
  let parcelleHeig = Array();
  google.maps.event.addListener(map, "mousedown", function () {
    console.log("down");
    isDrawing = true;
    polyLine = new google.maps.Polyline({
      map: map,
    });
    google.maps.event.addListener(map, "mousemove", function (e) {
      console.log("move", e);
      console.log("isDrawing", isDrawing);
      if (isDrawing == true) {
        console.log("draw");
        var pageX = e.pixel.x;
        var pageY = e.pixel.y;
        console.log(pageX, pageY);
        var point = new google.maps.Point(parseInt(pageX), parseInt(pageY));

        console.log("point", point);

        var latLng = overlay.getProjection().fromContainerPixelToLatLng(point);

        console.log("latLng", latLng);

        polyLine.getPath().push(latLng);

        latLng = String(latLng);
        latLng = latLng.replace("(", "");
        latLng = latLng.replace(")", "");

        var array_lng = latLng.split(",");
        parcelleHeig.push(new google.maps.LatLng(array_lng[0], array_lng[1]));
      }
    });
  });

  //   google.maps.event.addListener(map, "mouseup", function () {
  //     console.log("up");
  //     isDrawing = false;
  //   });
}
