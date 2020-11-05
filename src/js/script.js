let map;

function createPolygon(pointsArray) {
  let oldPoint = pointsArray[0];
  const smoothedArray = pointsArray.reduce(
    (newArray, newPoint) => {
      if (haversineDistance(oldPoint, newPoint)) {
        newArray.push(newPoint);
        oldPoint = newPoint;
      }
      return newArray;
    },
    [oldPoint]
  );

  const polygon = new google.maps.Polygon({
    paths: smoothedArray,
    strokeColor: "#0FF000",
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: "#0FF000",
    fillOpacity: 0.35,
    editable: true,
    geodesic: false,
  });

  function haversineDistance(p1, p2) {
    const threshold = parseInt(document.getElementById("distance").value);
    const metric = true;
    const earthRadius = metric
      ? 6371.071 * 1000 /* kilometers -> meters */
      : 3958.8 * 5280; /* miles -> feet */
    const lat1 = p1.lat() * (Math.PI / 180);
    const lat2 = p2.lat() * (Math.PI / 180);
    const latDiff = lat2 - lat1;
    const lngDiff = (p2.lng() - p1.lng()) * (Math.PI / 180);
    return (
      2 *
        earthRadius *
        Math.asin(
          Math.sqrt(
            Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
              Math.cos(lat1) *
                Math.cos(lat2) *
                Math.sin(lngDiff / 2) *
                Math.sin(lngDiff / 2)
          )
        ) >=
      threshold
    );
  }

  polygon.getPaths().forEach(function (path, index) {
    google.maps.event.addListener(path, "insert_at", function (evt) {
      console.log(path);
      console.log("insert", evt);
      console.log(path.i[evt].lat());
      console.log(path.i[evt].lng());
    });

    google.maps.event.addListener(path, "remove_at", function () {
      console.log("remove");
    });

    google.maps.event.addListener(path, "set_at", function (evt) {
      console.log(path);
      console.log("move", evt);
      console.log(path.i[evt].lat());
      console.log(path.i[evt].lng());
    });
  });

  google.maps.event.addListener(polygon, "dragend", function () {
    console.log("dreagged");
  });

  return polygon;
}

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
      const pageX = e.pixel.x;
      const pageY = e.pixel.y;
      const point = new google.maps.Point(parseInt(pageX), parseInt(pageY));
      let latLng = overlay.getProjection().fromContainerPixelToLatLng(point);
      polyLine.getPath().push(latLng);
      latLng = String(latLng);
      latLng = latLng.replace("(", "");
      latLng = latLng.replace(")", "");
      const array_lng = latLng.split(",");
      pointsArray.push(new google.maps.LatLng(array_lng[0], array_lng[1]));
    }
  });

  ["mouseup", "touchend"].forEach((evt) =>
    document.getElementById("map").addEventListener(evt, function () {
      isDrawing = false;
      localStorage.setItem("savedPointsArray", JSON.stringify(pointsArray));
      const polygon = createPolygon(pointsArray);
      polygon.setMap(map);
      polyLine.setMap(null);
      pointsArray = [];
      document.getElementsByClassName("save")[0].disabled = false;
    })
  );

  const savedPointsArray =
    JSON.parse(localStorage.getItem("savedPointsArray")) || [];
  if (savedPointsArray.length > 0) {
    const polygon = createPolygon(savedPointsArray);
    polygon.setMap(map);
    polyLine.setMap(null);
    pointsArray = [];
  }
}
