/*Script to display/manipulate/animate map*/


/*define width and heigh for projection*/
var width = screen.width * .8,
  height = screen.height * .65,
  centered;

/*label of article if one selected in networks, otherwise all*/
var currentArticle = "all";

/*offsets for correct positioning of tooltip*/
var offsetL = document.getElementById('map_container').offsetLeft + 10;
var offsetT = document.getElementById('map_container').offsetTop + 10;

/*projection for map*/
const projection = d3.geoEquirectangular()
  .scale(100)
  .translate([width / 6, height / 3]);

/*creating geo path using projection*/
var path = d3.geoPath()
  .projection(projection);

/*appending svg to display map*/
var svg_map = d3.select("#map_container").append("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("id", "svg_map")


var g = svg_map
  .append("g");

/*tooltip_map object creation that will appear on mouse hover*/
var tooltip_map = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);


/* reading json file containing world map in geojson format*/
d3.json("assets/data/world.geo.json")
  .then(function(map_data) {

    /*linking map with world geojson, entering data*/
    g.selectAll("path")
      .data(map_data.features)
      .enter()
      .append("path")
      .attr("class", "country") /*class for styling and accessing*/
      .attr("d", path)
      .style("stroke", "white")
      .style('fill', function(d) {
        return "#F2D165";
      })
      .on("mouseover", function() {
        d3.select(this).transition()
          .duration("100")
          .style("fill-opacity", ".8");

        /*Show tooltip_map*/
        tooltip_map.transition()
          .duration(200)
          .style("opacity", .9);

      })
      .on("mousemove", function(d) {
        /*Place the tooltip_map*/
        tooltip_map.style("left", (d3.mouse(this)[0]) + offsetL + "px")
          .style("top", d3.event.pageY + "px");

        /*display country name as the header of tooltip content*/
        var toolTipHtml = "<h3 id='toolTipHeader'>Country: " + d.properties.admin + "</h3>";

        /*in case country contains news (hence the color) for given circumstences, display news*/
        if (d3.select(this).style('fill') == "rgb(236, 81, 72)") {
          toolTipHtml = toolTipHtml + getNewsOfTheCountry(news, d);
        } else {
          /*otherwise display information regarding the country*/
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
          .style("fill-opacity", "1")
      })

    /* color countries with news*/
    colorMap();

  });



/*returns color of the country corresponding to the data d, given selected article in network
  (article equals 'all' otherwise) and news data set*/
function getColor(news, d, article) {

  /*default color of country without news*/
  var colour = "#F2D165";
  /*month that is selected on slider and displayed*/
  var date = MONTH_TO_ID[d3.select("#news_time_text").text().split(" ")[1]];

  news.forEach(function(row) {

    /*if news concerns the country corresponding to d data*/
    if (row['Country'] != "" && d.properties.admin.includes(row['Country'])) {

      /*retrieve month from exact date of the news*/
      var newsDate = row['Date'].split('/')[1];

      /*if slider month and news month are the same*/
      if (newsDate == date) {
        /*if specific article is not selected or selected article is linked with this news*/
        if (article === 'all' || article === row['Article Name'].trim()) {
          /*colour for countries that have news*/
          colour = '#ec5148';
        }
      }
    }
  });


  return colour;

}

/*colors the map, according to the current state. if specific article was selected, it takes
it as an argument. otherwise/if disselected 'all' is expected value for article*/
function colorMap(article = 'all') {

  /*update selected article*/
  currentArticle = article;

  /*read news daraset (contains links between article and news)*/
  d3.csv("assets/data/wiki_news.csv")
    .then(function(news) {

      d3.selectAll('.country').transition() //select all the countries and prepare for a transition
        .duration(500) // smooth time period fro transition
        .style('fill', function(d) {
          /*retrieve colot for each country*/
          return getColor(news, d, article);
        });
    });
}


/*returns content of tooltip, in case country has corresponding news*/
function getNewsOfTheCountry(news, d) {
  var newsStr = "";
  news.forEach(function(row) {
    /*retrieve date seleced through slider and displayed on the screen*/
    var date = MONTH_TO_ID[d3.select("#news_time_text").text().split(" ")[1]];

    /*if given news (row)  corresponds to the country of d data*/
    if (row['Country'] != "" && d.properties.admin.includes(row['Country'])) {
      /*if month of the selected date corresponds to the one of the news(row)*/
      if (row['Date'].split('/')[1] == date) {
        /*if specific article is not selected or selected article is linked with this news*/
        if (currentArticle === 'all' || currentArticle === row['Article Name'].trim()) {
          /*display article name and event type/summary*/
          newsStr = newsStr + "<p>" + row['Date'] + ": " +
            row['Article Name'] + ", " + row['Event Type'] + "</p>";
        }
      }
    }
  });

  return newsStr;
}
