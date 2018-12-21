---
layout: default
---

# Dataset description
We used a Wikipedia dataset originally retrieved from the SNAP repository. This is a website containing human navigation paths on Wikipedia that were collected through human-computer interaction within a game called Wikispeedia. In the game, players received pairs of Wikipedia articles and had to reach one article from the other through Wikipedia links between them.  The dataset provided consists of 4604 different articles.  For the purpose of our project, we cleaned and extracted relevant information from the above-mentioned website, consisting of names of articles, their categories and linkage information in the form of an adjacency matrix. \\
Since the goal of our project was to identify popularity, we looked for spikes in the number of visits and linked those occurrences with the corresponding events in the real world for visualization, we could have used an arbitrary sample from the millions of Wikipedia articles as long as we could identify unusual activities caused by external factors. Therefore, we deemed the obtained articles that we were kindly provided by Mr. Ricaud as sufficient.
Additionally, we queried the number of visits for all days in 2017 for all articles in our dataset from Wikipedia API. This information served as the basis for popularity and spike detection. \\
Furthermore, the dataset linking spikes of specific articles with news was created manually by us for the project. We built a dataset of around 200 entries specifying article name, event type, date and source (if applicable) of the event.

<br>

# Article popularity
The first visualization presents how the articles' popularity, measured in terms of number of visits, changes everyday for the year 2017. Statistics for both top 10 most popular articles and top 10 most popular article categories are provided. \\
[Popularity visualization](./popularity.html)

<br>

# Effect of news on article popularity
The second visualization shows for each month of 2017 the articles that registered the highest visit count spikes. Linked to some of the articles, there are also news which are are provided as a justification for the unusual article activity. The places related to the articles can also be viewed on a world map. \\
[News visualization](./news.html)
