const DATA_DIR = 'data/daily_visitors/';
const INIT_GRAPH = 'data.json';
let NODES_TO_DISPLAY = 3;

/* Colors */
const NODE_COLOR = '#ec5148';
const NODE_COLOR_HOVER = '#7edf29';
const NODE_COLOR_CLICK = '#7edf29';
const EDGE_COLOR = '#489fec';
const EDGE_COLOR_HOVER = '#baff7e';
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

class EventHandler {
  constructor() {
    this.clickedNodes = [];
    this.camPos = [[0, 0]];
    this.totalScale = 1;
  }

	reset() {
		this.clickedNodes = [];
    this.camPos = [[0, 0]];
    this.totalScale = 1;
	}

  addNeighbors(id, graphObj, eventType) {
    /* Extract graph attributes */
    const outNei = graphObj.outNei[id];
    const inNei = graphObj.inNei[id];
    const graph = graphObj.sigma.graph;
    const nodes = graphObj.nodes;
    const drawnNodes = graphObj.drawnNodes;

    /* Append the biggest neighbor nodes to the graph */
		let node_cnt = 0;
    for (const i in outNei) {
			/* Stop after adding enough nodes */
			if (node_cnt == NODES_TO_DISPLAY - 1)
				break;

      const newNodeId = outNei[i].target;
      /* Ignore already present nodes */
      if (drawnNodes[newNodeId] === 1) {
				/* Count the node as added if it was added through hover or click */
				if (nodes[newNodeId].parentType === 'hover' || nodes[newNodeId].parentType === 'click')
					node_cnt += 1;
        /* Override event type in case of click */
        if (eventType === 'click' && nodes[newNodeId].parentType !== undefined)
          nodes[newNodeId].parentType = eventType;
        continue;
      }

      drawnNodes[newNodeId] = 1;
			node_cnt += 1;
      /* Mark new node as added by the current node */
      nodes[newNodeId].parent = id;
      nodes[newNodeId].parentType = eventType;

      const newNode = graphObj.nodes[newNodeId];
      graph.addNode(newNode);
      graph.addEdge(outNei[i]);
    }

    /* Redraw the graph */
    graphObj.sigma.refresh();
  }

  removeNeighbors(id, graphObj, eventType) {
    /* Extract graph attributes */
    const outNei = graphObj.outNei[id];
    const inNei = graphObj.inNei[id];
    const graph = graphObj.sigma.graph;
    const nodes = graphObj.nodes;
    const drawnNodes = graphObj.drawnNodes;

    /* Remove the nodes that were previously added on hover */
    for (const i in outNei) {
      const newNodeId = outNei[i].target;
      /* Only remove node if it was added by the current node through a
      similar event*/
      if (nodes[newNodeId].parent !== id ||
        nodes[newNodeId].parentType !== eventType)
        continue;

      drawnNodes[newNodeId] = 0;
      nodes[newNodeId].parent = undefined;
      nodes[newNodeId].parentType = undefined;
      graph.dropEdge(outNei[i].id);
      graph.dropNode(newNodeId);
    }

    /* Redraw the graph */
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

		/* Treat the click depending if its selection or deselection */
    if (this.clickedNodes.length === 0 || this.clickedNodes[this.clickedNodes.length - 1] !== id) {
      this.clickedNodes.push(id);
      this.camPos.push([newX, newY]);

			/* Change node color */
			cl.data.node.color = NODE_COLOR_CLICK;
      /* Draw the neighbor nodes */
      this.addNeighbors(id, graphObj, 'click');
      /* Adjust the scale */
      this.totalScale *= camera.settings("zoomingRatio");
      /* Zoom in */
      sigma.misc.animation.camera(camera, {
        x: newX,
        y: newY,
        ratio: camera.ratio / camera.settings("zoomingRatio")
      }, {
        duration: 1000
      });
    } else {
      this.clickedNodes.pop();
      this.camPos.pop();

			/* Change node color */
			cl.data.node.color = NODE_COLOR;
      /* Remove the neighbor nodes */
      this.removeNeighbors(id, graphObj, 'click');
      /* Adjust the scale */
      this.totalScale /= camera.settings("zoomingRatio");
      const newCamPos = this.camPos[this.camPos.length - 1];
      /* Zoom out */
      sigma.misc.animation.camera(camera, {
        x: newCamPos[0],
        y: newCamPos[1],
        ratio: camera.ratio * camera.settings("zoomingRatio")
      }, {
        duration: 1000
      });
    }
  }

  /* Hover over node  */
  onOverNode(hov, graphObj) {
    const id = hov.data.node.id;

    /* Add neighbors of the node */
    this.addNeighbors(id, graphObj, 'hover');
  }

  /* Hover out of node */
  onOutNode(hov, graphObj) {
    /* Identify the node and its neighbors */
    const id = hov.data.node.id;

    /* Remove neighbors of the node */
    this.removeNeighbors(id, graphObj, 'hover');
  }
}

class Graph {
  constructor(dataFile, eventHandler) {
    this.dataFile = dataFile;
    this.eventHandler = eventHandler;
    this.sigma = new sigma('graph');

    this.generateRepresentation(dataFile);
  }

	generateRepresentation() {
		/* Keep a representation of the graph */
    this.outNei = {};
    this.inNei = {};
    this.nodes = {};
    this.drawnNodes = {};

    d3.json(this.dataFile).then((data) => {
      /* Store in and out neighbours for each node */
      for (const i in data.edges) {
        const edge = data.edges[i];

        if (this.outNei[edge.source] != undefined)
          this.outNei[edge.source].push(edge);
        else
          this.outNei[edge.source] = [edge];

        if (this.inNei[edge.target] != undefined)
          this.inNei[edge.target].push(edge);
        else
          this.inNei[edge.target] = [edge];
      }

      /* Store nodes */
      for (const i in data.nodes) {
        const node = data.nodes[i];
        this.nodes[node.id] = node;
        this.drawnNodes[node.id] = 0;
      }

			/* Sort neighbors in decreasing order by size */
			for (const key in this.outNei)
				this.outNei[key].sort((node1, node2) => this.nodes[node2.target].size - this.nodes[node1.target].size);
			for (const key in this.inNei)
				this.inNei[key].sort((node1, node2) => this.nodes[node2.source].size - this.nodes[node1.source].size);
    });
	}

  draw() {
    /* Parse data file and draw graph*/
    const s = this.sigma;
    const evHand = this.eventHandler;

    /* Clear the graph and unbind methods, in case you redraw */
    s.graph.clear();
    s.unbind(["clickNode", "overNode", "outNode"]);

    /* Set the display settings for the sigma instance */
    s.settings({
      defaultLabelColor: LABEL_COLOR,
      edgeColor: 'default',
      defaultEdgeColor: EDGE_COLOR,
      defaultNodeColor: NODE_COLOR,
    });

    sigma.parsers.json(this.dataFile, s, () => {
      /* Keep only the largest nodes */
      let nodes = s.graph.nodes();
      nodes.sort((node1, node2) => node2.size - node1.size);
      const nodes_len = nodes.length;

      for (let i = 0; i < NODES_TO_DISPLAY; i++)
        this.drawnNodes[nodes[i].id] = 1;

      for (let i = NODES_TO_DISPLAY; i < nodes_len; i++) {
        this.drawnNodes[nodes[i].id] = 0;
        s.graph.dropNode(nodes[i].id);
      }

      /* Bind event handlers */
      s.bind("clickNode", (cl) => evHand.onNodeClick(cl, this));
      s.bind("overNode", (hov) => evHand.onOverNode(hov, this));
      s.bind("outNode", (hov) => evHand.onOutNode(hov, this));

      /* Refresh graph */
      s.refresh();
    });
  }
}

function createTimeSlider(graph, eventHandler) {
	/* Make slider go through all the year's days */
	const time_range = d3.range(1, 366).map((d) => new Date(2017, 0, d));
	const time_div_width = parseInt(d3.select('#time_slider').style("width"));
	const slider_width = parseInt(time_div_width * 0.9);
	const slider_spacing = parseInt((time_div_width - slider_width) / 2);
	let time_slider = d3.sliderHorizontal()
		.min(d3.min(time_range))
		.max(d3.max(time_range))
		.tickFormat(d3.timeFormat("%d/%m"))
		.width(slider_width);
	let slider_div = d3.select('#time_slider').append('svg')
		.attr('width', "100%")
		.attr('height', "100%")
		.append('g')
		.attr('transform', `translate(${slider_spacing}, 0)`);
	slider_div.call(time_slider);

	/* Display the graph according to the appropriate data file */
	let date = '01/01';
	time_slider.on('onchange', (val) => {
		const new_date = d3.timeFormat('%m/%d')(val);
		/* Change the graph only if the date changed */
		if (new_date !== date) {
			date = new_date;
			eventHandler.reset();
			graph.dataFile = DATA_DIR + `month_${date}.json`;
			graph.generateRepresentation();
			graph.draw();
		}
	});
}

whenDocumentLoaded(() => {
  let eventHandler = new EventHandler();
  let graph = new Graph(INIT_GRAPH, eventHandler);
  const button = d3.select('#article_button');

	/* Insert a slider to select day for which to display nodes */
	createTimeSlider(graph, eventHandler);

	/* Modify slider size on window resize */
	window.addEventListener("resize", () => {
		d3.selectAll('svg').remove();
		createTimeSlider(graph, eventHandler);
	});

  /* Draw the graph */
  button.on("click", () => {
    NODES_TO_DISPLAY = parseInt(document.getElementById('article_text').value);
    graph.draw();
  });

  graph.draw();
});
