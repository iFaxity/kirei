import './bench.html';
import { html, defineElement, ref, reactive } from '@shlim/element';

function _random(max) {
    return Math.round(Math.random() * 1000) % max;
}

export default defineElement({
    name: 'MainElement',
    setup() {
        const rows = reactive([]);
        const selected = ref(undefined);
        const id = ref(1);

        function buildData(count = 1000) {
            const adjectives = ["pretty", "large", "big", "small", "tall", "short", "long", "handsome", "plain", "quaint", "clean", "elegant", "easy", "angry", "crazy", "helpful", "mushy", "odd", "unsightly", "adorable", "important", "inexpensive", "cheap", "expensive", "fancy"];
            const colours = ["red", "yellow", "blue", "green", "pink", "brown", "purple", "brown", "white", "black", "orange"];
            const nouns = ["table", "chair", "house", "bbq", "desk", "car", "pony", "cookie", "sandwich", "burger", "pizza", "mouse", "keyboard"];
            const data = [];
            for (let i = 0; i < count; i++) {
                data.push({id: id.value++, label: adjectives[_random(adjectives.length)] + " " + colours[_random(colours.length)] + " " + nouns[_random(nouns.length)] });
            }
            return data;
        }

        function add() {
            rows.push(...buildData(1000));
        }
        function remove(id) {
            rows.splice(rows.findIndex(d => d.id == id), 1);
        }
        function select(id) {
            selected.value = id;
        }
        function run() {
            rows.splice(0, rows.length, ...buildData());
            selected.value = undefined;
        }
        function update() {
            for (let i = 0; i < rows.length; i += 10) {
                rows[i].label += ' !!!';
            }
        }
        function runLots() {
            rows.splice(0, rows.length, ...buildData(10000));
            selected.value = undefined;
        }
        function clear() {
            rows.splice(0, rows.length);
            selected.value = undefined;
        }
        function swapRows() {
            if (rows.length > 998) {
                const d1 = rows[1];
                const d998 = rows[998];

                rows[1] = d998;
                rows[998] = d1;
            }
        }

        function handleClick(e) {
            const { action, id } = e.target.dataset;
            if (action && id) {
                if (action == 'select') {
                    select(id);
                } else if (action == 'remove') {
                    remove(id);
                }
            }
        }

        return () => html`
<link href="/css/currentStyle.css" rel="stylesheet"/>
<div class="container">
    <div class="jumbotron">
        <div class="row">
            <div class="col-md-6">
                <h1>@shlim/element-next (keyed)</h1>
            </div>
            <div class="col-md-6">
                <div class="row">
                    <div class="col-sm-6 smallpad">
                    <button type="button" class="btn btn-primary btn-block" id="run" @click=${run}>Create 1,000 rows</button>
                    </div>
                    <div class="col-sm-6 smallpad">
                        <button type="button" class="btn btn-primary btn-block" id="runlots" @click=${runLots}>Create 10,000 rows</button>
                    </div>
                    <div class="col-sm-6 smallpad">
                        <button type="button" class="btn btn-primary btn-block" id="add" @click=${add}>Append 1,000 rows</button>
                    </div>
                    <div class="col-sm-6 smallpad">
                        <button type="button" class="btn btn-primary btn-block" id="update" @click=${update}>Update every 10th row</button>
                    </div>
                    <div class="col-sm-6 smallpad">
                        <button type="button" class="btn btn-primary btn-block" id="clear" @click=${clear}>Clear</button>
                    </div>
                    <div class="col-sm-6 smallpad">
                        <button type="button" class="btn btn-primary btn-block" id="swaprows" @click=${swapRows}>Swap Rows</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <table class="table table-hover table-striped test-data" @click=${handleClick}>
        <tbody>${html.for(rows, item => item.id, item => html`
            <tr id=${item.id} class=${item.id == selected.value ? 'danger' : ''}>
                <td class="col-md-1">${item.id}</td>
                <td class="col-md-4">
                <a data-action="select" data-id=${item.id}>${item.label}</a>
                </td>
                <td class="col-md-1">
                <a>
                    <span class="glyphicon glyphicon-remove" aria-hidden="true"
                        data-action="remove" data-id=${item.id}></span>
                </a>
                </td>
                <td class="col-md-6"></td>
            </tr>`)}
        </tbody>
    </table>
    <span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true"></span>
</div>
`;
    },
});
