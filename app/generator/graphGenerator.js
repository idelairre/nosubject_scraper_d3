import backlinks from '../../output/backlinks';
import categories from '../../output/categories';
import { includes, uniq, union, difference } from 'lodash';
import 'babel-polyfill';

class GraphGenerator {
  constructor() {
    this.storedArticles = [];
    this.storedNodes = [];
  };

  fetchCategory(title) {
    for (let i = categories.length; i -= 1;) {
      if (categories[i].title === title) {
        return categories[i];
      }
    }
  }

  async generateCategoryNodes(title) {
    try {
      let category = await this.fetchCategory(title);
      let links = [], nodes = [];
      let rootNode = {
        label: category.title
      };
      nodes.push(rootNode);
      for (let i = category.articles.length; i -= 1;) {
        let article = category.articles[i].title
        let node = {
          label: article
        };
        nodes.push(node);
      }
      for (let i = category.articles.length; i -= 1;) {
        for (let j = nodes.length; j -= 1;) {
          if (nodes[j].label !== rootNode.label) {
            links.push({
              source: rootNode,
              target: nodes[j]
            });
          }
        }
      }
      // this.checkNodes(nodes, links)
      let data = {
        nodes: nodes,
        links: links
      };
      return data;
    } catch (error) {
      throw error;
    }
  }

  fetchArticle(title) {
    try {
      for (let i = backlinks.length; i -= 1;) {
        if (backlinks[i].title === title) {
          return backlinks[i];
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  async generateLinkedNodes(title) {
    try {
      let article = await this.fetchArticle(title);
      let articles = [];
      articles.push(article);
      for (let i = 0; article.links.length - 1 > i; i += 1) {
        let foundArticle = this.fetchArticle(article.links[i].title)
        if (foundArticle !== undefined) {
          articles.push(foundArticle);
        }
      }
      this.storedArticles = union(this.storedArticles, articles);

      console.log('stored articles: ', this.storedArticles.length);
      let nodes = this.generateNodes(articles.length, articles);

      nodes = this.validateNodeUniqueness(nodes);

      // console.log('links: ', links.length, 'nodes: ', nodes.length);
      this.storedNodes = union(this.storedNodes, nodes);
      let data = {
        nodes: nodes
        // links: links
      };
      return data;
    } catch (error) {
      throw error;
    }
  }

  validateNodeUniqueness(nodes) {
    this.storedNodes.map((storedNode) => {
      nodes.map((node) => {
        if (storedNode.label === node.label) {
          nodes.splice(nodes.indexOf(node), 1);
        }
      });
    });
    return nodes;
  }

  async generateNewNodes(nodeCount, minLinks, shuffle) {
    console.warn(`generating ${nodeCount} new nodes with atleast ${minLinks} links`);
    try {
      let articles = await this.generateArticlesWithLinks(minLinks);
      shuffle ? articles = await this.shuffle(articles) : null;
      let nodes = this.generateNodes(nodeCount, articles);

      // console.log('new nodes: ', nodes.length, 'new links: ', links.length);
      console.log('stored nodes', this.storedNodes.length);
      nodes = this.validateNodeUniqueness(nodes);
      console.log('unique nodes', nodes.length)
      this.storedNodes = union(this.storedNodes, nodes);

      // this.storedLinks = union(this.storedLinks, links);
      let data = {
        nodes: nodes
        // links: links
      };
      // this.checkNodes(data.nodes, data.links);
      console.warn('new nodes generated');
      return data;
    } catch (error) {
      throw error;
    }
  }

  shuffle(array) {
    console.log('shuffling...');
    return new Promise((resolve, reject) => {
      for (let i = array.length - 1; i > 0; i -= 1) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
      }
      console.log('shuffling done');
      resolve(array);
    });
  }

  generateArticlesWithLinks(minimumLinkCount) {
    console.log(`generating articles with ${minimumLinkCount} or less links...`);
    console.log('initial data: ', backlinks.length);

    return new Promise((resolve, reject) => {
      // only get articles greater than the minimum length
      try {
        let articlesWithLinks = [];
        for (let i = backlinks.length; i -= 1;) {
          if (backlinks[i].links.length > minimumLinkCount) {
            articlesWithLinks.push(backlinks[i]);
          }
        }

        // console.log('first pass: ', articlesWithLinks.length);

        // sort articles
        articlesWithLinks = articlesWithLinks.sort((a, b) => {
          return a.title.toLowerCase() - b.title.toLowerCase();
        });

        // remove duplicates
        for (let i = articlesWithLinks.length - 1; i -= 1;) {
          if (articlesWithLinks[i - 1] && articlesWithLinks[i].title.toLowerCase() === articlesWithLinks[i - 1].title.toLowerCase()) {
            delete articlesWithLinks[i];
          }
        }

        articlesWithLinks = articlesWithLinks.filter((element) => {
          return (typeof element !== "undefined");
        });

        // console.log('second pass: ', articlesWithLinks.length);
        // console.log('done');
        this.storedArticles = union(this.storedArticles, articlesWithLinks);
        // console.log('articles stored: ', !!this.storedArticles.length);
        resolve(articlesWithLinks);
      } catch (error) {
        resolve(error);
      }
    });
  }

  generateNodes(nodeCount, articles) {
    console.log(`generating ${nodeCount} nodes from ${articles.length} articles...`);
    let nodes = [];
    // return new Promise((resolve, reject) => {
      try {
        for (let i = 0; nodeCount > i; i += 1) {
          let node = {
            label: articles[i].title
          };
          nodes.push(node);
          // console.log(node);
        }

        return nodes;
      } catch (error) {
        // reject(error);
      }
    // });
  }

  generateLinks(nodes, articles) {
    try {
      let foundNodes = [];
      let links = [];
      for (let j = 0; articles.length - 1 > j; j += 1) {
        let sourceNode = this.findNode(articles[j].title, nodes);
        if (sourceNode !== undefined && articles[j].hasOwnProperty('links')) {
          for (let k = 0; articles[j].links.length  - 1 > k; k += 1) {
            let targetNode = this.findNode(articles[j].links[k].title, nodes);
            // console.log(targetNode)
            if (targetNode !== undefined && targetNode.label !== sourceNode.label) {
              let link = {
                  source: sourceNode,
                  target: targetNode,
                  weight: Math.random()
                };
              links.push(link);
              // console.log(link, 'links count: ', links.length);
            }
          }
        }
      }
      // console.log('links: ', links);
      return links;
    } catch (error) {
      console.error(error);
    }
  }

  findNode(title, nodes) {
    for (let i = 0; nodes.length > i; i += 1) {
      if (nodes[i].label === title) {
        return nodes[i];
      }
    }
  }

  checkGraphJson(nodes, links, labelAnchors, labelAnchorLinks) {
    this.checkNodes(nodes, links);
    this.checkLabels(labelAnchors, labelAnchorLinks);
  }

  checkNodes(nodes, links) {
    let errors = 0;
    console.log('checking nodes');
    for (let j = 0; j < links.length - 1; j += 1) {
      let targetIndex = nodes.indexOf(links[j].target);
      let sourceIndex = nodes.indexOf(links[j].source);
      if (nodes[targetIndex]) {
        // console.log(`target node ${JSON.stringify(nodes[targetIndex])} referenced at link ${JSON.stringify(links[j])} is OK`);
      } else {
        console.error(`target node at ${targetIndex} referenced at link ${JSON.stringify(links[j])} is shit, index position: ${targetIndex}`);
        delete nodes[j];
        errors += 1;
      }
      if (nodes[sourceIndex]) {
        // console.log(`source node ${JSON.stringify(nodes[sourceIndex])} referenced at link ${JSON.stringify(links[j])} is OK`);
      } else {
        console.error(`source node at ${sourceIndex} referenced at link ${JSON.stringify(links[j])} is shit, index position: ${sourceIndex}`);
        delete nodes[j];
        errors += 1;
      }
    }
    console.log('errors: ', errors);
    if (errors > 0) {
      links = links.filter((element) => {
        return (typeof element !== "undefined");
      });
    }
    errors > 0 ? console.log('links repaired') : null;
  }

  checkLabels(labelAnchors, labelAnchorLinks) {
    let errors = 0;
    console.log('checking labels');
    for (let i = 0; labelAnchorLinks.length - 1 > i; i += 1) {
      let targetIndex = labelAnchors.indexOf(labelAnchorLinks[i].target);
      let sourceIndex = labelAnchors.indexOf(labelAnchorLinks[i].source);
      if (labelAnchors[targetIndex]) {
        // console.log(`target node ${JSON.stringify(labelAnchors[targetIndex])} referenced at link ${JSON.stringify(labelAnchorLinks[i])} is OK`);
      } else {
        console.error(`target label index ${targetIndex} referenced at link ${JSON.stringify(labelAnchorLinks[i])} is shit, index position: ${targetIndex}`);
        delete labelAnchorLinks[i];
        errors += 1;
      }
      if (labelAnchors[sourceIndex]) {
        // console.log(`source node ${JSON.stringify(labelAnchors[sourceIndex])} referenced at link ${JSON.stringify(labelAnchorLinks[i])} is OK`);
      } else {
        console.error(`source label index ${sourceIndex} referenced at link ${JSON.stringify(labelAnchorLinks[i])} is shit, index position: ${sourceIndex}`);
        delete labelAnchorLinks[i];
        errors += 1;
      }
    }
    console.log('errors: ', errors);
    if (errors > 0) {
      labelAnchorLinks = labelAnchorLinks.filter((element) => {
        return (typeof element !== "undefined");
      });
    }
    errors > 0 ? console.log('label links repaired') : null;
  }

  graphContainsNode(node) {
    let nodes = this.force.nodes();
    if (nodes.indexOf(node) !== -1 || nodes.indexOf(node) > -1) {
      return true;
    } else {
      return false;
    }
    // for (let i = 0; nodes.length > i; i += 1) {
    //   let label = nodes[i].label.trim();
    //   // console.log(label);
    //   if (label === node.label.trim()) {
    //     console.log('found by label');
    //     return true;
    //   }
    // }
  }

  compareBacklinksToChartLinks(nodes, testLinks, article) {
    let valid = false;
    try {
      testLinks.map((link) => {
        article.links.map((articleLink) => {
          if (link.target.label === articleLink.title && graphContainsNode(articleLink.title)) {
            valid = true;
          }
          console.log(`link ${JSON.stringify(link)} is valid? ${valid}`);
        });
      });
    } catch (error) {
      console.error(error);
    }
  }

  validateNode(node, nodes, links) {
    try {
      let testLinks = [];
      let sourceArticle = this.fetchArticle(node);
      for (let i = links.length; i -= 1;) {
        if (node === links[i].source.label) {
          testLinks.push(links[i]);
        }
      }
      this.compareBacklinksToChartLinks(nodes, testLinks, sourceArticle);
    } catch (error) {
      throw error;
    }
  }
}

const graphGenerator = new GraphGenerator();

export default graphGenerator;
