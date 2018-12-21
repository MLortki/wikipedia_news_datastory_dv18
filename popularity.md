---
layout: popularity
---

Hi! This is our first visualization. Here you can see the most popular Wikipedia articles and categories for each day of the year 2017. Initially, the graph displays the most visited articles for the given day. The larger a node, the more visits it received in that day. The top bar chart displays the top 10 articles for the day and the bottom bar chart the top 10 categories for the day.\\
How to interact with the visualization:
- To change the number of nodes to display, you just have to drag the top slider. The number of nodes displayed will be shown to the left of the slider.
- To change the day for which you display data, you will have to drag the bottom slider. The date will be displayed to left of the slider in the format *DAY/MONTH*.
- Hovering over the nodes will highlight their outgoing edges and display the article's name.
- To better explore parts of the graph, you can zoom on the region of interest.
- To view an article's top neighbours, you just have to click the article's node. This will change the node color to green and display the top neighbours. The number of neighbours to display can again be changed using the top slider. Also, after selecting a node, you can then select one of its neighbours and you will change the focus on that neighbour.
- To drop the focus on a green node, just click it and you will be taken to the previous context.

<br>

{% include popularity_viz.html %}
