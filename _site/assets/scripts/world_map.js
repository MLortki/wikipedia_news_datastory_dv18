// class for world map generation
// class WorldMap {
//
//
//   constructor() {


var width = screen.width * .8,
  height = screen.height * .65,
  centered;


//for tooltip
var offsetL = document.getElementById('map_container').offsetLeft + 10;
var offsetT = document.getElementById('map_container').offsetTop + 10;


const projection = d3.geoEquirectangular()
  .scale(100)
  .translate([width / 6, height / 3]);


var path = d3.geoPath()
  .projection(projection);



var svg_map = d3.select("#map_container").append("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("id", "svg_map")
  .on("wheel", function() {
    //zoomend needs mouse coords
    initX = d3.mouse(this)[0];
  })
// .call(zoom);

var g = svg_map
  .append("g");

// create tooltip for points
var tooltip_map = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);


d3.csv("assets/data/wiki_news.csv").then(function(news) {
  d3.json("assets/data/world.geo.json")
    .then(function(map_data) {

      console.log(map_data);

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
            .style("fill-opacity", ".8");
          // .style("fill", "rgb(214, 195, 135)");

          // Show tooltip_map
          tooltip_map.transition()
            .duration(200)
            .style("opacity", .9);

        })
        .on("mousemove", function(d) {
          // Place the tooltip_map
          tooltip_map.style("left", (d3.mouse(this)[0]) + offsetL + "px")
            .style("top", d3.event.pageY + "px");

          var toolTipHtml = "<h3 id='toolTipHeader'>Country: " + d.properties.admin + "</h3>";

          if (d3.select(this).style('fill') == "rgb(236, 81, 72)") {
            toolTipHtml = toolTipHtml + getNewsOfTheCountry(news, d);
          } else {
            //display tooltip text
            toolTipHtml += "<p class='toolTipText'>Continent: " + d.properties.continent + "</p>" +
              "<p class='toolTipText'>Economy: " + d.properties.economy + "</p>" +
              "<p class='toolTipText'>Formal: " + d.properties.formal_en + "</p>" +
              "<p class='toolTipText'>Region: " + d.properties.region_wb + "</p>";
          }

          tooltip_map.html(toolTipHtml);

        })
        .on("mouseout", function() {
          tooltip_map.transition()
            .duration(200)
            .style("opacity", 0);
          d3.select(this)
            .transition()
            .duration("100")
            // .style("fill", "#F2D165")
            .style("fill-opacity", "1")
        })
      // .on("click", postalAreaClicked)


      colorMap(1);

    });

})



// function getColor(news, d) {
//
//   colour = "#F2D165";
//   news.forEach(function(row) {
//     if (row['Country'] != "" && d.properties.admin.includes(row['Country'])) {
//       // console.log("found for " + row['Country'] + " in " + d.properties.admin);
//       colour = "#FFF169";
//       colour = '#ec5148';
//     }
//   });
//
//
//   return colour;
//
// }
//
// function colorMap(date) {
//   console.log("in colorMap");
//
//   d3.csv("assets/data/wiki_news.csv")
//     .then(function(news) {
//       // console.log(news);
//
//       d3.selectAll('.country').transition() //select all the countries and prepare for a transition to new values
//         .duration(500) // give it a smooth time period for the transition
//         .style('fill', function(d) {
//           // console.log(d);
//           return getColor(news, d);
//
//         });
//     });
// }

function getColor(news, d, date) {

  colour = "#F2D165";
  news.forEach(function(row) {

    if (row['Country'] != "" && d.properties.admin.includes(row['Country'])) {
      // console.log("found for " + row['Country'] + " in " + d.properties.admin);
      var newsDate = row['Date'].split('/')[1];

      if (newsDate == date) {
        colour = '#ec5148';
      }
    }
  });


  return colour;

}

function colorMap(date) {
  console.log("in colorMap");

  d3.csv("assets/data/wiki_news.csv")
    .then(function(news) {
      // console.log(news);

      d3.selectAll('.country').transition() //select all the countries and prepare for a transition to new values
        .duration(500) // give it a smooth time period for the transition
        .style('fill', function(d) {
          // console.log(d);
          return getColor(news, d, date);

        });
    });
}



function getNewsOfTheCountry(news, d) {
  var newsStr = "";
  news.forEach(function(row) {
    if (row['Country'] != "" && d.properties.admin.includes(row['Country'])) {
      newsStr = newsStr + "<p>" + row['Date'] + ": " +
        row['Article Name'] + ", " + row['Event Type'] + "</p>";
    }
  });
  return newsStr;
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
