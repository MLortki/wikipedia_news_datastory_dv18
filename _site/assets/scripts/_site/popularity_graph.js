const DATA_DIR = 'assets/data/';
const NODES_FILE = DATA_DIR + 'nodes.json';
const EDGES_FILE = DATA_DIR + 'edges.json';
const INIT_GRAPH = DATA_DIR + 'data01_01.json';
let NODES_TO_DISPLAY = 5;

/* Colors */
const NODE_COLOR = '#ec5148';
const NODE_COLOR_HOVER = '#f9918b';
const NODE_COLOR_CLICK = '#7edf29';
const EDGE_COLOR = '#489fec';
const EDGE_COLOR_HOVER = '#ffffff';
const LABEL_COLOR = '#ffffff';

/* Start doing stuff only when the document is loaded */
function whenDocumentLoaded(action) {
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", action);
	} else {
		// `DOMContentLoaded` already fired
		action();
	}
}

/* Arrange point in a circle shape */
function getCircle(center, radius, numPoints) {
	const coords = [];
	const angle_unit = 2 * Math.PI / numPoints;

	for (let i = 0; i < numPoints; i++) {
		let coord = {};
		coord.x = center.x + radius * Math.cos(i * angle_unit);
		coord.y = center.y + radius * Math.sin(i * angle_unit);
		coords.push(coord);
	}

	return coords;
}

class EventHandler {
	constructor() {
		/* Keep track of the nodes that we concentrate on */
	    this.clickedNodes = [];
	    this.camPos = [[0, 0]];
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
	constructor(graphDiv, dataFile, eventHandler) {
	    this.dataFile = dataFile;
	    this.eventHandler = eventHandler;
	    this.sigma = new sigma(graphDiv);

			/* Keep an internal representation of the graph */
			this.outNei = {};
	    this.inNei = {};
	    this.nodes = {};
		this.generateRepresentation(true);
	}

	generateRepresentation(firstDraw=false, node=undefined) {
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
						'size': nodes[i].absolute_size
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
					this.nodes[nodes[i].id].size = nodes[i].absolute_size;

				/* Get a sorted list of nodes */
				for (const key in this.nodes) {
					this.sortedNodes.push(this.nodes[key]);
				}
				this.sortedNodes.sort((node1, node2) => node2.size - node1.size);

				this.draw(node);
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

function createTimeSlider(div, granularity, graph, eventHandler) {
	/* Make slider go through all the year's days/months */
	const time_div_width = parseInt(d3.select(div).style("width"));
	const slider_width = parseInt(time_div_width * 0.9);
	const slider_spacing = parseInt((time_div_width - slider_width) / 2);
	let time_range = d3.range(1, 366).map((d) => new Date(2017, 0, d));
	let time_format = '%d/%m';
	if (granularity === 'month') {
		time_range = d3.range(1, 13);
		time_format = '%m';
	}

	const time_slider = d3.sliderHorizontal()
		.min(d3.min(time_range))
		.max(d3.max(time_range))
		.tickFormat(d3.timeFormat(time_format))
		.width(slider_width);
	const slider_div = d3.select(div).append('svg')
		.attr('width', "100%")
		.attr('height', "100%")
		.append('g')
		.attr('transform', `translate(${slider_spacing}, 0)`);
	slider_div.call(time_slider);

	/* Display the graph according to the appropriate data file */
	let date = '01_01';
	time_slider.on('onchange', (val) => {
		const new_date = d3.timeFormat('%d_%m')(val);
		/* Change the graph only if the date changed */
		if (new_date !== date) {
			date = new_date;
			graph.dataFile = DATA_DIR + `data${date}.json`;
			/* Keep focus on the current node */
			graph.generateRepresentation(false, eventHandler.getFocusNode());
		}
	});
}

function prepareGraph(settings) {
	/* Extract settings */
	graphDiv = settings.graphDiv;
	sliderDiv = settings.sliderDiv;
	sizeType = settings.sizeType;
	sliderGranularity = settings.sliderGranularity;

	/* Create popularity graph */
	let eventHandler = new EventHandler();
	let graph = new Graph(graphDiv, INIT_GRAPH, eventHandler);
	// const button = d3.select('#article_button');

	/* Insert a slider to select day for which to display nodes */
	createTimeSlider(sliderDiv, sliderGranularity, graph, eventHandler);

	/* Modify slider size on window resize */
	window.addEventListener("resize", () => {
		d3.selectAll('svg').remove();
		createTimeSlider(sliderDiv, graph, eventHandler);
	});

	// /* Draw the graph */
	// button.on("click", () => {
	// NODES_TO_DISPLAY = parseInt(document.getElementById('article_text').value);
	// 	/* Keep the focus on the current node */
	// 	popGraph.draw(popEventHandler.getFocusNode());
	// });
}

whenDocumentLoaded(() => {
	/* Prepare the popularity graph */
	popularity_settings = {
		graphDiv: 'popularity_graph',
		sliderDiv: '#popularity_time_slider',
		sizeType: 'absolute_size',
		sliderGranularity: 'day'
	}
	prepareGraph(popularity_settings);

	/* Prepare the news graph */
	news_settings = {
		graphDiv: 'news_graph',
		sliderDiv: '#news_time_slider',
		sizeType: 'daily_change_size',
		sliderGranularity: 'month'
	}
	prepareGraph(news_settings);
});
