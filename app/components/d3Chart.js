import React from 'react';
import ReactDOM from 'react-dom';
import graphGenerator from '../generator/graphGenerator';
import { includes } from 'lodash';

let d3Chart = {};

d3Chart.create = function(element, width, height) {
  let self = this;
  this.data = {
    nodes: [],
    links: []
  };
  this.labels = {
    labelAnchors: [],
    labelAnchorLinks: []
  };

  this.validateLink = function (link) {
    let nodes = force.nodes();
    if (nodes.indexOf(link.source) === -1 || nodes.indexOf(link.target) === -1) {
      throw new Error(`link ${JSON.stringify(link)} invalid`);
    } else {
      return true;
    }
  }

  this.redrawLinks = async function (nodes) {
    let [ links ] = await graphGenerator.generateLinks(nodes, graphGenerator.storedArticles);
    for (let i in links) {
      if (!self.graphContainsLink(links[i])) {
        self.addLink(links[i]);
      }
    }
    graphGenerator.checkNodes(force.nodes(), force.links());
  }

  this.graphContainsLink = function (link) {
    let links = force.links();
    let found = false;
    for (let i in links) {
      if (includes(links[i].target.label, link.target.label) && includes(links[i].source.label, link.source.label)) {
        found = true;
      }
    }
    return found;
  }

  // will move this to store

  this.graphContainsNode = function (node) {
    let nodes = force.nodes();
    let found = false;
    for (let i in nodes) {
      if (includes(nodes[i], node.label)) {
        found = true;
      }
    }
    return found;
  }

  let calledCount = 0

  this.addNodes = function(data, labels) {
    console.log('new chart labels: ', labels.labelAnchors.length, 'chart label links: ', labels.labelAnchorLinks.length);
    try {
      for (let i in data.nodes) {
        self.addNode(data.nodes[i]);
      }
      for (let i in data.links) {
        self.addLink(data.links[i]);
      }

    calledCount !== 0 ? self.redrawLinks(force.nodes()) : null;
    calledCount += 1;
    } catch (error) {
      console.error(error);
    }
    console.log('(after update) chart labels: ', force2.nodes().length, 'chart label links: ', force2.links().length);
  };

  this.addNode = function(node) {
    if (self.graphContainsNode(node)) {
      return;
    }
    try {
      let nodes = force.nodes();
      let labelAnchors = force2.nodes();
      let labelAnchorLinks = force2.links();
      let labelNode1 = {
        node: node
      };
      let labelNode2 = {
        node: node
      };
      nodes.push(node);
      labelAnchors.push(labelNode1);
      labelAnchors.push(labelNode2);
      labelAnchorLinks.push({
        source: labelAnchors.length - 1,
        target: labelAnchors.length - 2,
        weight: Math.random()
      });
    } catch (error) {
      console.error(error);
    }
    self.update();
  };

  this.removeNode = function(label) {
    let i = 0;
    let n = findNode(label);
    while (i < self.links.length) {
      if ((links[i]['source'] == n) || (self.links[i]['target'] == n)) {
        self.links.splice(i, 1);
      } else i++;
    }
    self.data.nodes.splice(findNodeIndex(label), 1);
    self.update();
  };

  this.removeLink = function(source, target) {
    for (let i = 0; i < links.length; i++) {
      if (links[i].source.id == source && links[i].target.id == target) {
        links.splice(i, 1);
        break;
      }
    }
    self.update();
  };

  this.removeAllLinks = function() {
    links.splice(0, links.length);
    self.update();
  };

  this.removeAllNodes = function() {
    nodes.splice(0, links.length);
    self.update();
  };

  this.addLink = function(link) {
    try {
      let links = force.links();
      let newLink = {
        source: link.source,
        target: link.target,
        weight: link.weight
      };
      self.validateLink(newLink);
      links.push(newLink);
      self.update();
    } catch (error) {
      console.error(error);
    }
  };

  let findNode = function(label) {
    let nodes = force.nodes();
    console.log(nodes);
    for (let i in nodes) {
      if (nodes[i]["label"] === label) {
        return nodes[i];
      }
    };
  };

  let findNodeIndex = function(label) {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].label == label) {
        return i;
      }
    };
  };

  let labelDistance = 0;
  let vis = d3.select(element)
    .append('svg:svg')
    .attr('width', width)
    .attr('height', height)
    .attr('class', 'graph');

  let force = d3.layout.force()
    .size([width, height])
    .nodes([])
    .links([])
    .gravity(0.5)
    .linkDistance(50)
    .charge(-5000)
    .linkStrength((x) => {
      return x.weight * 5
    });

  // graph that displays labels
  let force2 = d3.layout.force()
    .nodes([])
    .links([])
    .gravity(0)
    .linkDistance(0)
    .linkStrength(8)
    .charge(-100)
    .size([width, height])

  this.update = function() {

    let link = vis.selectAll('line.link')
      .data(force.links(), (datum) => {
        return datum.source.label + "-" + datum.target.label;
      });

    let linkEnter = link.enter()
      .append('svg:line')
      .attr('class', 'link')
      .style('stroke', '#CCC');

    link.exit().remove();

    let node = vis.selectAll('g.node')
      .data(force.nodes());

    let nodeEnter = node.enter().append('svg:g')
      .attr('class', 'node');

    nodeEnter.append('svg:circle')
      .attr('r', 7)
      .style('fill', '#555')
      .style('stroke', '#FFF')
      .style('stroke-width', 3);

    nodeEnter.call(force.drag);
    node.exit().remove();

    let anchorLink = vis.selectAll('line.anchorLink')
      .data(force2.links());

    let anchorLinkEnter = anchorLink.enter()
      .append('svg:line')
      .attr('class', 'anchorLink');

    anchorLink.exit().remove();

    let anchorNode = vis.selectAll('g.anchorNode')
      .data(force2.nodes());

    let anchorNodeEnter = anchorNode.enter().append('svg:g')
      .attr('class', 'anchorNode');

    anchorNodeEnter.append('svg:circle')
      .attr('r', 0)
      .style('fill', '#FFF')

    anchorNodeEnter.append('svg:text')
      .text(function(datum, index) {
        return index % 2 === 0 ? "" : datum.node.label;
      })
      .style('fill', '#555')
      .style('font-family', 'Arial')
      .style('font-size', 16);

    anchorNode.exit().remove();

    this.updateLink = function() {
      this.attr('x1', function(datum) {
        return datum.source.x;
      }).attr('y1', function(datum) {
        return datum.source.y;
      }).attr('x2', function(datum) {
        return datum.target.x;
      }).attr('y2', function(datum) {
        return datum.target.y;
      });
    }

    this.updateNode = function() {
      try {
        this.attr('transform', function(datum) {
          return 'translate(' + datum.x + ", " + datum.y + ')';
        });
      } catch (error) {
        console.log(error);
      }
    }

    force.on('tick', function(tick) {
      node.call(self.updateNode);
      anchorNode.each(function(datum, index) {
        if (index % 2 === 0) {
          datum.x = datum.node.x;
          datum.y = datum.node.y;
        } else {
          try {
            let b = this.childNodes[1].getBoundingClientRect();
            let diffX = datum.x - datum.node.x; // wat?
            let diffY = datum.y - datum.node.y;
            let dist = Math.sqrt(diffX * diffX + diffY * diffY);
            let shiftX = b.width * (diffX - dist) / (dist * 2);
            shiftX = Math.max(-b.width, Math.min(0, shiftX));
            let shiftY = 5;
            this.childNodes[1].setAttribute('transform', `translate(${shiftX}, ${shiftY})`);
          } catch (error) {
            console.error(error);
          }
        }
      });

      anchorNode.call(self.updateNode);

      link.call(self.updateLink);
      anchorLink.call(self.updateLink);
      force.start();
      force2.start();
    });
    force.start();
    force2.start();
  }
  this.update();
}

export default d3Chart;