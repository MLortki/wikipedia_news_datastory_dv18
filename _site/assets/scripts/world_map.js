// class for world map generation
// class WorldMap {
//
//
//   constructor() {


var width = screen.width * .8,
  height = screen.height * .65,
  centered;


const projection = d3.geoEquirectangular()
  .scale(75)
  .translate([width / 6, height / 3]);


var path = d3.geoPath()
  .projection(projection);

var svg_map = d3.select("#map_container").append("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("id", "svg_map");

var g = svg_map
  .append("g");

// create tooltip for points
var tooltip_map = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);


//d3.json("assets/data/world_map.json", function(error, map_data) {\

// d3.json("assets/data/world-2.json")
d3.json("assets/data/world.geo.json")
  .then(function(map_data) {
    g.selectAll("path")
      .data(map_data.features)
      .enter()
      .append("path")
      .attr("class", "country") // give them a class for styling and access later
      .attr("d", path)
      .style("stroke", "white")
      .style('fill', function(d) {
        return "#F2D165";
      })
      .on("mouseover", function() {
        d3.select(this).transition()
          .duration("100")
          // .style("fill-opacity", ".1");
          .style("fill", "rgb(214, 195, 135)");

        // Show tooltip_map
        tooltip_map.transition()
          .duration(200)
          .style("opacity", .9);

      })
      .on("mousemove", function(d) {
        // Place the tooltip_map
        tooltip_map.style("left", (d3.mouse(this)[0]) + "px")
          .style("top", d3.event.pageY + "px");

        //display tooltip text
        tooltip_map.html("<h3>Country: " + d.properties.admin + "</h3>" +
          "<p class='toolTipText'>Continent: " + d.properties.continent + "</p>" +
          "<p class='toolTipText'>Economy: " + d.properties.economy + "</p>" +
          "<p class='toolTipText'>Formal: " + d.properties.formal_en + "</p>" +
          "<p class='toolTipText'>Region: " + d.properties.region_wb + "</p>");

      })
      .on("mouseout", function() {
        tooltip_map.transition()
          .duration(200)
          .style("opacity", 0);
        d3.select(this)
          .transition()
          .duration("100")
          .style("fill", "#F2D165")
      });

    // svg_map.append("g")
    //   .attr("class", "boundary")
    //   .selectAll("boundary")
    //   .data([topojson.object(map_data, map_data.objects.countries)])
    //   .enter().append("path")
    //   .style("stroke", "white")
    //   .style('fill', function(d) {
    //     return "#F2D165";
    //   });
    // .on("mouseover", function() {
    //     d3.select(this).transition()
    //       .duration("100")
    //       .style("fill-opacity", ".1");
    //
    //     // Show tooltip_map
    //     tooltip_map.transition()
    //       .duration(200)
    //       .style("opacity", .9);
    //
    //   });
    // .on("mousemove", function(d) {
    //
    //   // Place the tooltip_map
    //   tooltip_map.style("left", (d3.mouse(this)[0]) + "px")
    //     .style("top", d3.event.pageY + "px");
    //
    //   //display tooltip text
    //   tooltip_map.html("<h4> Postal Code " + d.properties.ZIP + "</h4>");
    //
    // })
    // .on("mouseout", function() {
    //   tooltip_map.transition()
    //     .duration(200)
    //     .style("opacity", 0);
    //   d3.select(this)
    //     .transition()
    //     .duration("100")
    //     .style("fill-opacity", "1")
    // })
    // .attr("d", path)
    // .attr("preserveAspectRatio", "xMinYMin meet")
    // .attr("viewBox", "0 0 600 400")
    // //class to make it responsive
    // .classed("svg-content-responsive", true);
    // svg.append("g")
    //   .attr("class", "graticule")
    //   .selectAll("path")
    //   .data(graticule.lines)
    //   .enter().append("path")
    //   .attr("d", path);

  });




function postalAreaClicked(d) {
  var posX, posY, zoomScale;

  // we click inside the country
  if (d && centered !== d) {
    var centroid = path.centroid(d);
    //we retrieve the x and y coordination of where we clicked
    posX = centroid[0] - 20;
    posY = centroid[1] + 100;
    //determines how much we will zoom
    zoomScale = 1.3;
    centered = d;

  } else {
    // test if we double click twice
    //reposition to center of the screen and update zoom scale
    posX = width / 2;
    posY = height / 2;
    zoomScale = 1;
    centered = null;
  }


  g.transition()
    .duration(750)
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + zoomScale + ")translate(" + -posX + "," + -posY + ")")
    .on("start", function() {

      if (centered === d) {
        d3.select("#details").remove();
        var zipArea = d.properties.ZIP;
        // generateChart(zipArea);
      } else {
        d3.select("#details").remove();
      }
    });
}


//   }
//
// }
//
//
// function whenDocumentLoaded(action) {
//   if (document.readyState === "loading") {
//     document.addEventListener("DOMContentLoaded", action);
//   } else {
//     // `DOMContentLoaded` already fired
//     action();
//   }
// }
//
// whenDocumentLoaded(() => {
//   plot_object = new WorldMap();
//   // plot object is global, you can inspect it in the dev-console
// });
