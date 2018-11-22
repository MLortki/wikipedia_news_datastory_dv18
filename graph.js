let INIT_GRAPH = 'data.json';
const NEI_TO_DISPLAY = 5;
let NODES_TO_DISPLAY = 3;

/* Colors */
const NODE_COLOR = '#ec5148';
const NODE_COLOR_HOVER = '#7edf29';
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

    /* Append neighbor nodes to the graph */
    for (const i in outNei) {
      const newNodeId = outNei[i].target;
      /* Ignore already present nodes */
      if (drawnNodes[newNodeId] === 1) {
        /* Override event type in case of click */
        if (eventType === 'click' && nodes[newNodeId].parentType !== undefined)
          nodes[newNodeId].parentType = eventType;
        continue;
      }

      drawnNodes[newNodeId] = 1;
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

    if (this.clickedNodes.length === 0 || this.clickedNodes[this.clickedNodes.length - 1] !== id) {
      this.clickedNodes.push(id);
      this.camPos.push([newX, newY]);

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

whenDocumentLoaded(() => {
  let eventHandler = new EventHandler();
  let graph = new Graph(INIT_GRAPH, eventHandler);
  const button = d3.select('#article_button');

	/* Insert a slider to select day for which to display nodes */
	const time_range = d3.range(1, 366).map((d) => new Date(2017, 0, d));

	const time_slider = d3.sliderHorizontal()
		.min(d3.min(time_range))
		.max(d3.max(time_range))
		.tickFormat(d3.timeFormat("%d/%m"))
		.width(900);

	const slider_div = d3.select('#time_slider').append('svg')
		.attr('width', "100%")
		.attr('height', "5%")
		.append('g')
		.attr('transform', 'translate(10, 0)');

	slider_div.call(time_slider);

	let date = '01/01';
	time_slider.on('onchange', (val) => {
		val = d3.timeFormat('%m/%d')(val);

		if (val !== date) {
			date = val;
			if (val === '01/01') {
				eventHandler.reset();
				graph.dataFile = 'data.json';
				graph.generateRepresentation();
			}
			else {
				eventHandler.reset();
				graph.dataFile = 'data2.json';
				graph.generateRepresentation();
			}

			graph.draw();
		}
	});

  /* Draw the graph */
  button.on("click", () => {
    NODES_TO_DISPLAY = parseInt(document.getElementById('article_text').value);
    graph.draw();
  });

  graph.draw();
});
