import alt from '../alt';
import { getActionCreators } from 'alt-async'
import { createStore } from 'alt-utils/lib/decorators';
import ChartActions from '../actions/chartActions';
import { union } from 'lodash';

const LinkedNodeGenerator = getActionCreators("LinkedNodeGenerator");
const NodeGenerator = getActionCreators("NodeGenerator");
const CategoryNodeGenerator = getActionCreators("CategoryNodeGenerator");

@createStore(alt)
class ChartStore {
  constructor() {
    this.state = { data: { nodes: [], links: [] }, newData: { nodes: [], links: [] } };
    this.bindListeners({
      handleGeneratedNodes: [CategoryNodeGenerator.success, LinkedNodeGenerator.success, NodeGenerator.success],
      handleGeneratingNodesFailed: [CategoryNodeGenerator.failure, LinkedNodeGenerator.failure, NodeGenerator.failure]
    });
  }

  handleGenerateNodes() {
    // do nothing
  }

  handleGeneratedNodes(data) {
    this.setState({
      data: {
        nodes: union(data.nodes, this.state.data.nodes),
        links: union(data.links, this.state.data.links)
      },
      newData: {
        nodes: data.nodes,
        links: data.links
      }
    });
    console.log('updated data: nodes: ', this.state.data.nodes.length);
  }

  handleGeneratingNodesFailed(errorMessage) {
    console.error(errorMessage);
  }
}

export default ChartStore;
