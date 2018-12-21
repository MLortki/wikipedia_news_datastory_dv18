# Data Visualization class, EPFL 2018

Github page:
https://mlortki.github.io/wikipedia_news_datastory_dv18/

The pages containing the visualizations were created using Jekyll.

## Libraries used
We used the following libraries/packages:
- [d3](https://d3js.org/) - for general html manipulation
- [sigma.js](http://sigmajs.org/) - for drawing the graphs
- [d3-simple-slider](https://bl.ocks.org/johnwalley/e1d256b81e51da68f7feb632a53c3518) - for creating sliders

## Files/folders modified/added by us
The project’s structure is as follows:

- assets - directory containing several types of files
     - css - style files
     - data - data files which contain:
          - article_subject.csv - main categories for each article
          - dataDAY_MONTH.json - data about the visit counts for each article
          - dataMONTH.json - data about spikes in the number of visit counts
          - edges.json - data concerning the edges in the graphs
          - nodes.json - data concerning the nodes in the graphs
          - categories.json - number of visits for each category for each day
          - wiki_news.csv - small dataset of news
          - world.geojson - geojson file used for drawing the map
     - __scripts__ - the scripts used for creating the visualizations
          - graph.js - script used for drawing the graphs, the sliders, the charts and for connecting all the elements together
          - world_map.js - script used for dealing with the map
     - \_includes - directory containing html files for creating the divs filled with the visualizations’ elements
     - \_layouts - directory containing layouts used by Jekyll for creating the web pages
     - lib - directory containing libraries/packages used in the project’s implementation
     - notebooks - ipython notebooks used for collecting, analysing and grouping data into the datafiles presented above
     - index\.md, news\.md, popularity\.md - markdown files used by Jekyll for creating the web pages

## Usage
The visualization can be accesed at [wiki_viz](https://mlortki.github.io/wikipedia_news_datastory_dv18/).
The first and simpler visualization, called *Article popularity*, aims at revealing how the visit counts fluctuate over time for the articles, as well as for the categories. One can change the number of nodes to display in the graph, as well as the day for which to display the popularities of the articles and categories. The outgoing links for each article can be shown by hovering over the corresponding node and the most popular neighbours can be drawn by clicking the node.
The second visualization, called *Effect of news on article popularity*, wants to reveal more relevant information, namely how spikes in the number of visits occurr in connection with events that are usually also presented in the media. The users can change the number of nodes to be displayed, change the month for which to view the statistics, explore the statistics and the associated news for an article by clicking on its node and view the news associated to each highlighted country on the map by hovering overr them. There is also the possibility to run an animation which will take you through a series of interesting events that took place in each month of 2017.
For both visualizations, there are detailed descriptions of how to interact with them on their actual webpages.
