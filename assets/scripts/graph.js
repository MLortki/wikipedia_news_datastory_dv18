const DATA_DIR = 'assets/data/';
const NODES_FILE = DATA_DIR + 'nodes.json';
const EDGES_FILE = DATA_DIR + 'edges.json';
const DAY_INIT_GRAPH = DATA_DIR + 'data01_01.json';
const MONTH_INIT_GRAPH = DATA_DIR + 'data1.json';
let NODES_TO_DISPLAY = 5;
const NODES_LIMIT = 200;
const NUM_BARS = 10;
const LABEL_LIMIT = 18;

/* Colors */
const NODE_COLOR = '#ec5148';
const NODE_COLOR_HOVER = '#f9918b';
const NODE_COLOR_CLICK = '#7edf29';
const EDGE_COLOR = '#489fec';
const EDGE_COLOR_HOVER = '#ffffff';
const LABEL_COLOR = '#ffffff';

/* Months */
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const MONTH_TO_ID = {
  'January': 1,
  'February': 2,
  'March': 3,
  'April': 4,
  'May': 5,
  'June': 6,
  'July': 7,
  'August': 8,
  'September': 9,
  'October': 10,
  'November': 11,
  'December': 12
}

/* Start doing stuff only when the document is loaded */
function whenDocumentLoaded(action) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", action);
  } else {
    // `DOMContentLoaded` already fired
    action();
  }
}

/* Create a bar chart associated to the graph */
function createPopularityBarChart(div, data) {
  /* Define chart margins */
  const margin = {
    top: 30,
    right: 0,
    bottom: 10,
    left: 105
  };
  const height = parseInt(d3.select(div).style('height'));
  const width = parseInt(d3.select(div).style('width'));
  /* Define x and y scale */
  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.visits)])
    .range([margin.left, width - margin.right]);
  const y = d3.scaleBand()
    .domain(data.map(d => d.label))
    .range([margin.top, height - margin.bottom])
    .padding(0.1);

  /* Draw bars */
  d3.select(div).append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('fill', 'steelBlue')
    .append('g')
    .selectAll('rect')
    .data(data)
    .enter().append('rect')
    .attr('x', x(0))
    .attr('y', d => y(d.label))
    .attr('width', d => x(d.visits) - x(0))
    .attr('height', y.bandwidth());

  /* Draw axes */
  const svg = d3.select(div).select('svg');
  const xAxis = g => g
    .attr("transform", `translate(0,${margin.top})`)
    .call(d3.axisTop(x).ticks(width / 80))
    .call(g => g.select(".domain").remove());
  const yAxis = g => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).tickSizeOuter(0));

  svg.append("g")
    .attr("text-anchor", "end")
    .style("font", "12px sans-serif")
    .selectAll("text")
    .data(data)
    .enter().append("text")
    .attr("x", d => x(d.visits) - 4)
    .attr("y", d => y(d.label) + y.bandwidth() / 2)
    .attr("dy", "0.35em")
  // .text(d => format(d.visits));

  svg.append("g")
    .call(xAxis);

  svg.append("g")
    .call(yAxis);
}

/* Create a bar chart with statistics about an article */
function createNewsBarChart(div, data) {
  /* Define chart margins */
  const margin = {
    top: 10,
    right: 0,
    bottom: 30,
    left: 20
  };
  const height = parseInt(d3.select(div).style('height'));
  const width = parseInt(d3.select(div).style('width'));
  /* Define x and y scale */
  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.day)])
    .range([margin.left, width - margin.right]);
  const y = d3.scaleLinear()
    .domain(data.map(d => d.visits))
    .range([margin.top, height - margin.bottom])
    .padding(0.1);

  /* Draw bars */
  d3.select(div).append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('fill', 'steelBlue')
    .append('g')
    .selectAll('rect')
    .data(data)
    .enter().append('rect')
    .attr('x', d => x(d.day))
    .attr('y', y(0))
    .attr('width', d => x(d.visits) - x(0))
    .attr('height', y.bandwidth());

  /* Draw axes */
  const svg = d3.select(div).select('svg');
  const xAxis = g => g
    .attr("transform", `translate(0,${margin.top})`)
    .call(d3.axisTop(x).ticks(width / 80))
    .call(g => g.select(".domain").remove());
  const yAxis = g => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).tickSizeOuter(0));

  svg.append("g")
    .attr("text-anchor", "end")
    .style("font", "12px sans-serif")
    .selectAll("text")
    .data(data)
    .enter().append("text")
    .attr("x", d => x(d.visits) - 4)
    .attr("y", d => y(d.label) + y.bandwidth() / 2)
    .attr("dy", "0.35em")
  // .text(d => format(d.visits));

  svg.append("g")
    .call(xAxis);

  svg.append("g")
    .call(yAxis);
}

class EventHandler {
  constructor() {
    /* Keep track of the nodes that we concentrate on */
    this.clickedNodes = [];
    this.camPos = [
      [0, 0]
    ];
    this.totalScale = 1;
  }

  getFocusNode() {
    return this.clickedNodes[this.clickedNodes.length - 1];
  }

  highlightNeighbors(id, graphObj, eventType) {
    const neighs = graphObj.outNei[id];
    let color = EDGE_COLOR_HOVER;

    /* Change hovered node color */
    graphObj.sigma.graph.nodes(id).color = NODE_COLOR_HOVER;

    if (eventType === 'outHover') {
      if (graphObj.nodes[id].color === undefined)
        graphObj.sigma.graph.nodes(id).color = NODE_COLOR;
      else
        graphObj.sigma.graph.nodes(id).color = graphObj.nodes[id].color;
      color = EDGE_COLOR;
    }

    /* Re-add already drawn edges with a new color */
    for (let i in neighs) {
      const node = neighs[i].target;

      /* If the edge is not drawn, continue */
      if (graphObj.drawnNodes[node] === undefined)
        continue;

      const newEdge = neighs[i];
      newEdge.color = color;
      graphObj.sigma.graph.dropEdge(newEdge.id);
      graphObj.sigma.graph.addEdge(newEdge);
    }

    graphObj.sigma.refresh();
  }

  /* Node click */
  onNodeClick(cl, graphObj) {
    /* Identify the node and its position */
    const id = cl.data.node.id;
    const [prevXAbs, prevYAbs] = this.camPos[this.camPos.length - 1];
    const newX = cl.data.captor.x / this.totalScale + prevXAbs;
    const newY = cl.data.captor.y / this.totalScale + prevYAbs;
    const camera = graphObj.sigma.camera;
    const graph = graphObj.sigma.graph;
    const zoomDuration = (camera.ratio === 1) ? 0 : 1000;

    /* Treat the click depending if it's selection or deselection */
    if (this.clickedNodes.length === 0 || this.clickedNodes[this.clickedNodes.length - 1] !== id) {
      /* Change the focus to the current node */
      this.clickedNodes.push(id);
      this.camPos.push([newX, newY]);

      /* Zoom to the normal ratio */
      sigma.misc.animation.camera(camera, {
        x: prevXAbs,
        y: prevYAbs,
        ratio: 1
      }, {
        duration: zoomDuration,
        onComplete: () => {
          /* Move to the selected node */
          sigma.misc.animation.camera(camera, {
            x: newX,
            y: newY
          }, {
            duration: 1000,
            onComplete: () => {
              /* Change focus through node color */
              if (this.clickedNodes.length > 1) {
                const prevNode = this.clickedNodes[this.clickedNodes.length - 2];
                graphObj.nodes[prevNode].color = NODE_COLOR;
              }
              /* Add the nodes of interest */
              graphObj.draw(id);
            }
          });
        }
      });
    } else {
      this.clickedNodes.pop();
      const prevPos = this.camPos.pop();

      const newCamPos = this.camPos[this.camPos.length - 1];
      /* Zoom to the normal ratio */
      sigma.misc.animation.camera(camera, {
        x: prevPos[0],
        y: prevPos[1],
        ratio: 1
      }, {
        duration: zoomDuration,
        onComplete: () => {
          /* Move to the previous focus */
          sigma.misc.animation.camera(camera, {
            x: newCamPos[0],
            y: newCamPos[1]
          }, {
            duration: 1000,
            onComplete: () => {
              /* Change focus to the previously selected node or to the main view */
              const prevNode = this.clickedNodes[this.clickedNodes.length - 1];
              /* Change focus through node color */
              graphObj.nodes[id].color = NODE_COLOR;
              graphObj.draw(prevNode);
            }
          });
        }
      });
    }
  }

  /* Hover over node  */
  onOverNode(hov, graphObj) {
    /* Identify the node */
    const id = hov.data.node.id;

    /* Add neighbors of the node */
    this.highlightNeighbors(id, graphObj, 'onHover');
  }

  /* Hover out of node */
  onOutNode(hov, graphObj) {
    /* Identify the node */
    const id = hov.data.node.id;

    /* Remove neighbors of the node */
    this.highlightNeighbors(id, graphObj, 'outHover');
  }
}

class Graph {
  constructor(eventHandler, graphSettings) {
    this.eventHandler = eventHandler;
    /* Extract graph settings */
    this.graphType = graphSettings.graphType;
    this.dataFile = graphSettings.dataFile;
    this.sizeType = graphSettings.sizeType;
    this.sigma = new sigma(graphSettings.graphDiv);

    /* Keep an internal representation of the graph */
    this.outNei = {};
    this.inNei = {};
    this.nodes = {};
    this.generateRepresentation(true);
  }

  generateRepresentation(firstDraw = false, node = undefined) {
    /* Keep a representation of the graph */
    this.sortedNodes = [];

    d3.json(this.dataFile).then((nodes) => {
      /* Also get data about node coordinates and the edges when first loading
      the graph */
      if (firstDraw === true) {
        /* Store nodes */
        for (const i in nodes) {
          const node = {
            'id': nodes[i].id,
            'size': nodes[i][this.sizeType]
          }
          this.nodes[node.id] = node;
        }

        /* Get a sorted list of nodes */
        for (const key in this.nodes) {
          this.sortedNodes.push(this.nodes[key]);
        }
        this.sortedNodes.sort((node1, node2) => node2.size - node1.size);

        /* Nodes data */
        d3.json(NODES_FILE).then((nodes) => {
          for (const i in nodes) {
            const id = nodes[i].id;
            this.nodes[id].label = nodes[i].label;
            this.nodes[id].x = nodes[i].x;
            this.nodes[id].y = nodes[i].y;
          }

          /* Draw bar charts */
          if (this.graphType === 'popularity') {
            /* Draw article popularity chart */
            const popularityData = this.sortedNodes.slice(0, NUM_BARS).map(
              ((article) => {
                const d = {
                  'label': this.nodes[article.id].label.slice(0, LABEL_LIMIT),
                  'visits': article.size
                };
                return d;
              }));
            createPopularityBarChart('#article_chart', popularityData);
          }
        });

        /* Edges data */
        d3.json(EDGES_FILE).then((edges) => {
          /* Store in and out neighbours for each node */
          for (const i in edges) {
            const edge = edges[i];

            /* Don't store self links */
            if (edge.source == edge.target)
              continue;

            if (this.outNei[edge.source] !== undefined)
              this.outNei[edge.source].push(edge);
            else
              this.outNei[edge.source] = [edge];

            if (this.inNei[edge.target] !== undefined)
              this.inNei[edge.target].push(edge);
            else
              this.inNei[edge.target] = [edge];
          }

          /* Sort neighbors in decreasing order by size */
          for (const key in this.outNei)
            this.outNei[key].sort((node1, node2) =>
              this.nodes[node2.target].size - this.nodes[node1.target].size);
          for (const key in this.inNei)
            this.inNei[key].sort((node1, node2) =>
              this.nodes[node2.source].size - this.nodes[node1.source].size);

          /* Draw the graph */
          this.draw(node);
        });
      } else {
        /* Only change node size */
        for (const i in nodes)
          this.nodes[nodes[i].id].size = nodes[i][this.sizeType];

        /* Get a sorted list of nodes */
        for (const key in this.nodes) {
          this.sortedNodes.push(this.nodes[key]);
        }
        this.sortedNodes.sort((node1, node2) => node2.size - node1.size);

        this.draw(node);

        /* Draw bar charts */
        if (this.graphType === 'popularity') {
          /* Erase previous charts */
          d3.select('#article_chart').selectAll('svg').remove();
          /* Draw new article popularity chart */
          const popularityData = this.sortedNodes.slice(0, NUM_BARS).map(
            ((article) => {
              const d = {
                'label': this.nodes[article.id].label.slice(0, LABEL_LIMIT),
                'visits': article.size
              };
              return d;
            }));
          createPopularityBarChart('#article_chart', popularityData);
        }
      }
    });
  }

  draw(node) {
    const s = this.sigma;
    const evHand = this.eventHandler;

    /* Clear the graph and unbind methods, in case you redraw */
    s.graph.clear();
    this.drawnNodes = {};
    this.drawnEdges = {};
    s.unbind(["clickNode", "overNode", "outNode"]);

    /* Set the display settings for the sigma instance */
    s.settings({
      defaultLabelColor: LABEL_COLOR,
      edgeColor: 'default',
      defaultEdgeColor: EDGE_COLOR,
      defaultNodeColor: NODE_COLOR,
      sideMargin: 800
    });

    /* Draw the most popular nodes */
    let nodesArray = this.sortedNodes;
    let numNodes = Math.min(NODES_TO_DISPLAY, nodesArray.length);
    if (node !== undefined) {
      /* Draw the most popular nodes connected to the given one */
      nodesArray = this.outNei[node].map(x => this.nodes[x.target]);
      numNodes = Math.min(NODES_TO_DISPLAY - 1, nodesArray.length);

      /* Draw the main node */
      this.nodes[node].color = NODE_COLOR_CLICK;
      if (this.drawnNodes[node] === undefined)
        s.graph.addNode(this.nodes[node]);
      this.drawnNodes[node] = 1;
    }

    /* Draw nodes */
    for (let i = 0; i < numNodes; i++) {
      const newNode = nodesArray[i];
      if (this.drawnNodes[newNode.id] === undefined)
        s.graph.addNode(newNode);
      this.drawnNodes[newNode.id] = 1;
      /* Draw the main node's outgoing edges */
      if (node !== undefined) {
        const edgeId = this.outNei[node][i].id;
        if (this.drawnEdges[edgeId] === undefined)
          s.graph.addEdge(this.outNei[node][i]);
        this.drawnEdges[edgeId] === 1;
      }
    }
    /* Draw the edges */
    for (let i = 0; i < numNodes; i++) {
      const src = nodesArray[i].id;
      const neighs = this.outNei[src];
      /* Skip drawing edges if the node has no outgoing edges */
      if (neighs === undefined)
        continue;

      for (let j = 0; j < neighs.length; j++) {
        const dst = neighs[j].target;
        /* Check that the neighbor is drawn */
        if (this.drawnNodes[dst] === 1) {
          const edgeId = neighs[j].id;
          if (this.drawnEdges[edgeId] === undefined)
            s.graph.addEdge(neighs[j]);
          this.drawnEdges[edgeId] === 1;
        }
      }
    }

    /* Bind event handlers */
    s.bind("clickNode", (cl) => evHand.onNodeClick(cl, this));
    s.bind("overNode", (hov) => evHand.onOverNode(hov, this));
    s.bind("outNode", (hov) => evHand.onOutNode(hov, this));

    /* Refresh graph */
    s.refresh();
  }
}

function createTimeSlider(div, granularity, graph, eventHandler, value) {
  /* Make slider go through all the year's days/months */
  const div_width = parseInt(d3.select(div).style("width"));
  const slider_width = parseInt(div_width * 0.9);
  const slider_spacing = parseInt((div_width - slider_width) / 2);
  let time_range = d3.range(1, 366).map((d) => new Date(2017, 0, d));
  let tick_format = d3.timeFormat('%d/%m');
  let date = '01_01';
  if (granularity === 'month') {
    time_range = d3.range(0, 13);
    tick_format = ((i) => MONTHS[i]);
    date = MONTH_TO_ID['January'];
  }

  let slider = d3.sliderHorizontal()
    .min(d3.min(time_range))
    .max(d3.max(time_range))
    .tickFormat(tick_format)
    .width(slider_width);
  /* Set slider value */
  // if (value !== undefined)
  //     slider = slider.value(value);

  const slider_div = d3.select(div).append('svg')
    .attr('width', "100%")
    .attr('height', "100%")
    .append('g')
    .attr('transform', `translate(${slider_spacing}, 0)`);
  slider_div.call(slider);

  /* Display the graph according to the appropriate data file */
  slider.on('onchange', (val) => {
    let new_date = parseInt(val) + 1;

    if (granularity == 'day')
      new_date = d3.timeFormat('%d_%m')(val);

    /* Change the date displayed */
    const p_id = div.split('_')[0] + '_time_text';
    if (granularity == 'day') {
      const day = d3.timeFormat('%d/%m')(val);
      d3.select(p_id).text('Day: ' + day);
    } else {
      val = parseInt(val);
      const month = MONTHS[val];
      d3.select(p_id).text('Month: ' + month);
    }
    // colorMap(val);


    /* Change the graph only if the date changed */
    if (new_date !== date) {
      date = new_date;
      graph.dataFile = DATA_DIR + `data${date}.json`;
      /* Keep focus on the current node */
      graph.generateRepresentation(false, eventHandler.getFocusNode());
    }
  });

  return slider;
}



function colorMap(date) {

  d3.selectAll('.country').transition() //select all the countries and prepare for a transition to new values
    .duration(500) // give it a smooth time period for the transition
    .style('fill', function(d) {
      // console.log(d);
      if (d.properties.admin == 'Russia') {
        console.log("coloring russia");
        return "#FFF169";
      } else {
        return "#F2D165";
      }
        // the end color value
    })
}

function createNodesSlider(div, graph, eventHandler, value) {
  const div_width = parseInt(d3.select(div).style("width"));
  const slider_width = parseInt(div_width * 0.9);
  const slider_spacing = parseInt((div_width - slider_width) / 2);

  let slider = d3.sliderHorizontal()
    .min(0)
    .max(NODES_LIMIT)
    .step(5)
    .tickFormat((ind) => '')
    .width(slider_width);
  /* Set slider value */
  // if (value !== undefined)
  //     slider = slider.value(value);

  const slider_div = d3.select(div).append('svg')
    .attr('width', "100%")
    .attr('height', "100%")
    .append('g')
    .attr('transform', `translate(${slider_spacing}, 0)`);
  slider_div.call(slider);

  /* Change the number of nodes to display */
  slider.on('onchange', (val) => {
    NODES_TO_DISPLAY = parseInt(val);
    /* Change the number displayed */
    const p_id = div.split('_')[0] + '_nodes_text';
    d3.select(p_id).text('Nodes: ' + val);
    /* Redraw graph */
    graph.draw(eventHandler.getFocusNode());
  });

  return slider;
}

function prepareGraph(settings) {
  /* Extract settings */
  timeSliderDiv = settings.timeSliderDiv;
  nodesSliderDiv = settings.nodesSliderDiv;
  sliderGranularity = settings.sliderGranularity;
  initGraph = (sliderGranularity === 'day') ? DAY_INIT_GRAPH : MONTH_INIT_GRAPH;

  /* Create popularity graph */
  let eventHandler = new EventHandler();
  const graphSettings = {
    graphType: settings.graphType,
    graphDiv: settings.graphDiv,
    dataFile: initGraph,
    sizeType: settings.sizeType
  }
  let graph = new Graph(eventHandler, graphSettings);

  /* Insert a slider to select day for which to display nodes */
  let timeSlider = createTimeSlider(timeSliderDiv, sliderGranularity, graph, eventHandler);

  /* Insert slider for choosing the number of nodes to display */
  let nodeSlider = createNodesSlider(nodesSliderDiv, graph, eventHandler);

  /* Modify slider size on window resize */
  window.addEventListener("resize", () => {
    /* Erase old sliders */
    d3.select(timeSliderDiv).selectAll('svg').remove();
    d3.select(nodesSliderDiv).selectAll('svg').remove();
    /* Maintain sliders on the same values */
    const timeValue = timeSlider.value();
    const nodeValue = nodeSlider.value();
    timeSlider = createTimeSlider(timeSliderDiv, 'day', graph, eventHandler, timeValue);
    nodeSlider = createNodesSlider(nodesSliderDiv, graph, eventHandler, nodeValue);

    if (settings.graphType === 'popularity') {
      /* Also resize bar charts */
      /* Erase previous charts */
      d3.select('#article_chart').selectAll('svg').remove();
      /* Draw new article popularity chart */
      const popularityData = graph.sortedNodes.slice(0, NUM_BARS).map(
        ((article) => {
          const d = {
            'label': graph.nodes[article.id].label.slice(0, LABEL_LIMIT),
            'visits': article.size
          };
          return d;
        }));
      createBarChart('#article_chart', popularityData);
    }
  });
}

whenDocumentLoaded(() => {
  if (document.getElementById('popularity_graph') !== null) {
    /* Prepare the popularity graph */
    const popularity_settings = {
      graphType: 'popularity',
      graphDiv: 'popularity_graph',
      timeSliderDiv: '#popularity_time_slider',
      nodesSliderDiv: '#popularity_nodes_slider',
      sizeType: 'absolute_size',
      sliderGranularity: 'day'
    }
    prepareGraph(popularity_settings);
  } else if (document.getElementById('news_graph') !== null) {
    /* Prepare the news graph */
    const news_settings = {
      graphType: 'news',
      graphDiv: 'news_graph',
      timeSliderDiv: '#news_time_slider',
      nodesSliderDiv: '#news_nodes_slider',
      sizeType: 'daily_change_size',
      sliderGranularity: 'month'
    }
    prepareGraph(news_settings);
  }
});