let map;
const earthRadius = 6378137.0;

function createPolygon(pointsArray) {
  google.maps.Polygon.prototype.douglasPeucker = function (tolerance) {
    let res = null;

    //adjust tolerance depending on the zoom level
    tolerance = tolerance * Math.pow(2, 20 - map.getZoom());

    if (this.getPath() && this.getPath().getLength()) {
      const points = this.getPath().getArray();

      const Line = function (p1, p2) {
        this.p1 = p1;
        this.p2 = p2;

        this.distanceToPoint = function (point) {
          // slope
          const m =
              (this.p2.lat() - this.p1.lat()) / (this.p2.lng() - this.p1.lng()),
            // y offset
            b = this.p1.lat() - m * this.p1.lng(),
            d = [];
          // distance to the linear equation
          d.push(
            Math.abs(point.lat() - m * point.lng() - b) /
              Math.sqrt(Math.pow(m, 2) + 1)
          );
          // distance to p1
          d.push(
            Math.sqrt(
              Math.pow(point.lng() - this.p1.lng(), 2) +
                Math.pow(point.lat() - this.p1.lat(), 2)
            )
          );
          // distance to p2
          d.push(
            Math.sqrt(
              Math.pow(point.lng() - this.p2.lng(), 2) +
                Math.pow(point.lat() - this.p2.lat(), 2)
            )
          );
          // return the smallest distance
          return d.sort(function (a, b) {
            return a - b; //causes an array to be sorted numerically and ascending
          })[0];
        };
      };

      const douglasPeucker = function (points, tolerance) {
        if (points.length <= 2) {
          return [points[0]];
        }
        let returnPoints = [],
          // make line from start to end
          line = new Line(points[0], points[points.length - 1]),
          // find the largest distance from intermediate poitns to this line
          maxDistance = 0,
          maxDistanceIndex = 0,
          p;
        for (var i = 1; i <= points.length - 2; i++) {
          const distance = line.distanceToPoint(points[i]);
          if (distance > maxDistance) {
            maxDistance = distance;
            maxDistanceIndex = i;
          }
        }
        // check if the max distance is greater than our tollerance allows
        if (maxDistance >= tolerance) {
          p = points[maxDistanceIndex];
          line.distanceToPoint(p, true);
          // include this point in the output
          returnPoints = returnPoints.concat(
            douglasPeucker(points.slice(0, maxDistanceIndex + 1), tolerance)
          );
          // returnPoints.push( points[maxDistanceIndex] );
          returnPoints = returnPoints.concat(
            douglasPeucker(
              points.slice(maxDistanceIndex, points.length),
              tolerance
            )
          );
        } else {
          // ditching this point
          p = points[maxDistanceIndex];
          line.distanceToPoint(p, true);
          returnPoints = [points[0]];
        }
        return returnPoints;
      };
      res = douglasPeucker(points, tolerance);
      // always have to push the very last point on so it doesn't get left off
      res.push(points[points.length - 1]);
      this.setPath(res);
    }
    return this;
  };

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
  //simplify polygon
  var douglasPeuckerThreshold = document.getElementById("distance").value; // in meters
  polygon.douglasPeucker(
    douglasPeuckerThreshold / (2.0 * Math.PI * earthRadius)
  );

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
