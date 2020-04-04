import {State} from 'js-framework-benchmark-utils';
import {html, render} from '@shlim/html';
import './bench2.html';

const state = State(update);
const main = document.getElementById('container');

const Jumbotron = ({run, runLots, add, update, clear, swapRows}) => html`
  <div class="jumbotron">
    <div class="row">
      <div class="col-md-6">
        <h1>@shlim/html</h1>
      </div>
      <div class="col-md-6">
        <div class="row">
          <div class="col-sm-6 smallpad">
            <button type="button" class="btn btn-primary btn-block"
                    id="run" @click=${run}>Create 1,000 rows</button>
          </div>
          <div class="col-sm-6 smallpad">
            <button type="button" class="btn btn-primary btn-block"
                    id="runlots" @click=${runLots}>Create 10,000 rows</button>
          </div>
          <div class="col-sm-6 smallpad">
            <button type="button" class="btn btn-primary btn-block"
                    id="add" @click=${add}>Append 1,000 rows</button>
          </div>
          <div class="col-sm-6 smallpad">
            <button type="button" class="btn btn-primary btn-block"
                    id="update" @click=${update}>Update every 10th row</button>
          </div>
          <div class="col-sm-6 smallpad">
            <button type="button" class="btn btn-primary btn-block"
                    id="clear" @click=${clear}>Clear</button>
          </div>
          <div class="col-sm-6 smallpad">
            <button type="button" class="btn btn-primary btn-block"
                    id="swaprows" @click=${swapRows}>Swap Rows</button>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

interface Item {
  id: number;
  label: string;
}

const Table = (state) => {
  const { selected } = state;
  const data = state.data as Item[];

  function click(e) {
    const { action, id } = e.target.dataset;
    if (action && id) {
      state[action](+id);
    }
    /*const a = target.closest('a');
    const {action} = a.dataset;
    state[action](+a.closest('tr').id);*/
  }

  return html`
    <table @click=${click}
      class="table table-hover table-striped test-data">
      <tbody>${html.for(data, item => item.id, item => html`
        <tr id=${item.id} class=${item.id === selected ? 'danger' : ''}>
          <td class="col-md-1">${item.id}</td>
          <td class="col-md-4">
            <a data-action="select" data-id=${item.id}>${item.label}</a>
          </td>
          <td class="col-md-1">
            <a data-action="remove" data-id=${item.id}>
              <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
            </a>
          </td>
          <td class="col-md-6" />
        </tr>`)}
      </tbody>
    </table>
  `;
};


function update(state) {
  render(html`
  <div class="container">
    ${Jumbotron(state)}
    ${Table(state)}
    <span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true" />
  </div>`, main);
}
update(state);
