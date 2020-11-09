let map;
let polygon;
let pointsArray = new Array();

function createPolygon(pointsArray, editable) {
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
  polygon && polygon.setMap(null);
  polygon = new google.maps.Polygon({
    paths: smoothedArray,
    strokeColor: "#0FF000",
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: "#0FF000",
    fillOpacity: 0.35,
    editable,
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

  //Setting up the listeners that will fire when the polygon is being edited
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

function savePolygon(pointsArray) {
  polygon && polygon.setMap(null);
  polygon = createPolygon(pointsArray, false);
  polygon.setMap(map);
  document.getElementsByClassName("save")[0].disabled = true;
  document.getElementsByClassName("edit")[0].disabled = false;
  localStorage.setItem("savedPointsArray", JSON.stringify(pointsArray));
  pointsArray = [];
}

function loadSavedPolygon() {
  const savedPointsArray =
    JSON.parse(localStorage.getItem("savedPointsArray")) || [];
  if (savedPointsArray.length > 0) {
    savedPointsArray.forEach(function (point) {
      pointsArray.push(new google.maps.LatLng(point.lat, point.lng));
    });
    polygon = createPolygon(pointsArray, false);
    polygon.setMap(map);
    document.getElementsByClassName("edit")[0].disabled = false;
  }
}

function editPolygon(pointsArray) {
  polygon = createPolygon(pointsArray, true);
  polygon.setMap(map);
  document.getElementsByClassName("save")[0].disabled = false;
  document.getElementsByClassName("edit")[0].disabled = true;
}

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 39.2259125, lng: -84.52 },
    zoom: 15,
    draggable: false,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
  });

  let isDrawing = false;
  let overlay = new google.maps.OverlayView();
  let polyLine;
  pointsArray = [];
  overlay.setMap(map);

  ["mousedown", "touchstart"].forEach((evt) =>
    document.getElementById("map").addEventListener(evt, function () {
      document.getElementsByClassName("save")[0].disabled = true;
      document.getElementsByClassName("edit")[0].disabled = true;
      isDrawing = true;
      //remove any other polygons on the map
      polygon && polygon.setMap(null);
      pointsArray = [];
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
      polygon = createPolygon(pointsArray, true);
      polygon.setMap(map);
      polyLine.setMap(null);
      //enable save button
      document.getElementsByClassName("save")[0].disabled = false;
      document.getElementsByClassName("edit")[0].disabled = true;
    })
  );

  //save button click handler
  document
    .getElementsByClassName("save")[0]
    .addEventListener("click", function () {
      savePolygon(pointsArray);
    });

  //edit button click handler
  document
    .getElementsByClassName("edit")[0]
    .addEventListener("click", function () {
      editPolygon(pointsArray);
    });

  loadSavedPolygon();
}
