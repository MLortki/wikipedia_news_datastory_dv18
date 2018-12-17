// class for world map generation
class WorldMap {


  constructor() {


    // var width = screen.width * .8,
    //   height = screen.height * .65,
    //   centered;


    var width = 960,
      height = 480;


    const projection = d3.geoNaturalEarth1()
      .rotate([0, 0])
      .center([8.54, 47.37])
      .scale(170000)
      .translate([width / 2, height / 2]) // SVG space
      .precision(.1);


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


    console.log("before method");
    //d3.json("assets/data/world_map.json", function(error, map_data) {\

    d3.json("assets/data/zurich_zips.geojson")
      .then(function(map_data) {

        // console.log("why so serious");
        console.log(map_data);

        // create map
        g.selectAll("path")
          .data(map_data.features)
          .enter()
          .append("path")
          .attr("class", "code") // give them a class for styling and access later
          .attr("d", path)
          .style("stroke", "white")
          // .style('fill', function(d) {
          //   return getColor(d.properties[map_column], coloring);
          // })

          .on("mouseover", function() {
            d3.select(this).transition()
              .duration("100")
              .style("fill-opacity", ".1");

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
            tooltip_map.html("<h4> Postal Code " + d.properties.ZIP + "</h4>" + tooltip_text);

          })
          .on("mouseout", function() {
            tooltip_map.transition()
              .duration(200)
              .style("opacity", 0);
            d3.select(this)
              .transition()
              .duration("100")
              .style("fill-opacity", "1")
          })
        // .on("click", countryClicked)

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


  }

}


function whenDocumentLoaded(action) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", action);
  } else {
    // `DOMContentLoaded` already fired
    action();
  }
}

whenDocumentLoaded(() => {
  plot_object = new WorldMap();
  // plot object is global, you can inspect it in the dev-console
});
