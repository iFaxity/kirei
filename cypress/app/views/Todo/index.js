import {
  defineComponent,
  html,
  css,
  ref,
  computed,
  onMount,
  onUnmount,
  toRef,
} from '@kirei/element';
import { useStore } from '@kirei/store';
import { TodoStore } from '../../store/Todo';

function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, 1000 * seconds));
}

// app todo view
export default defineComponent({
  name: 'AppTodo',
  styles: css`
    @import 'https://unpkg.com/todomvc-app-css@2.2.0/index.css';

    :host {
      font: 14px 'Helvetica Neue', Helvetica, Arial, sans-serif;
      line-height: 1.4em;
    }
  `,
  directives: {
    todoFocus: {
      updated(el, binding) {
        if (binding.value) {
          el.focus();
        }
      },
    },
  },

  async setup() {
    await sleep(5);

    // install store for every instance of this element
    const store = useStore(TodoStore);

    const newTodo = ref('');
    const allDone = computed({
      get() {
        return store.remaining === 0;
      },
      set(value) {
        store.todos.forEach((todo) => { todo.completed = value; });
      },
    });

    // Full spec-compliant TodoMVC with localStorage persistence
    // and hash-based routing in ~120 effective lines of JavaScript.
    // localStorage persistence
    function pluralize(n) {
      return n === 1 ? 'item' : 'items';
    }

    // handle routing
    function onHashChange() {
      const path = window.location.hash.replace(/#\/?/, '');

      if (store.hasFilter(path)) {
        store.setVisibility(path);
      } else {
        window.location.hash = '';
        store.setVisibility('all');
      }
    }

    function onKeyup() {
      store.addTodo(newTodo.value);
      newTodo.value = '';
    }

    // lifecycle hooks
    onMount(() => {
      window.addEventListener('hashchange', onHashChange, false);
      onHashChange();
    });
    onUnmount(() => {
      window.removeEventListener('hashchange', onHashChange, false);
    });

    return () => html`
      <section class="todoapp">
        <header class="header">
          <h1>todos</h1>
          <input
            class="new-todo"
            autofocus
            autocomplete="off"
            placeholder="What needs to be done?"
            v-model=${newTodo}
            @keyup.enter=${onKeyup}
          />
        </header>
        <section class="main" v-show=${store.todos.length}>
          <input
            id="toggle-all"
            class="toggle-all"
            type="checkbox"
            v-model=${allDone}
          />
          <label for="toggle-all"></label>
          <ul class="todo-list">
            ${store.filteredTodos.map((todo) =>
              html.key(
                todo,
                todo.id,
                html`
                  <li
                    class="todo"
                    class=${{
                      completed: todo.completed,
                      editing: todo == store.editedTodo,
                    }}
                  >
                    <div class="view">
                      <input
                        class="toggle"
                        type="checkbox"
                        v-model=${toRef(todo, "completed")}
                      />
                      <label @dblclick=${() => store.editTodo(todo)}>${todo.title}</label>
                      <button
                        class="destroy"
                        @click=${() => store.removeTodo(todo)}
                      ></button>
                    </div>
                    <input
                      class="edit"
                      type="text"
                      v-model=${toRef(todo, "title")}
                      v-todo-focus=${todo == store.editedTodo}
                      @blur=${() => store.doneEdit(todo)}
                      @keyup.enter=${() => store.doneEdit(todo)}
                      @keyup.esc=${() => store.cancelEdit(todo)}
                    />
                  </li>
                `
              )
            )}
          </ul>
        </section>
        <footer class="footer" v-show=${store.todos.length}>
          <span class="todo-count">
            <strong>${store.remaining}</strong> ${pluralize(store.remaining)} left
          </span>
          <ul class="filters">
            <li>
              <a href="#/all" class=${{ selected: store.visibility == "all" }}
                >All</a
              >
            </li>
            <li>
              <a
                href="#/active"
                class=${{ selected: store.visibility == "active" }}
                >Active</a
              >
            </li>
            <li>
              <a
                href="#/completed"
                class=${{ selected: store.visibility == "completed" }}
                >Completed</a
              >
            </li>
          </ul>
          <button
            class="clear-completed"
            @click=${store.removeCompleted}
            v-show=${store.todos.length > store.remaining}
          >
            Clear completed
          </button>
        </footer>
      </section>
      <footer class="info">
        <p>Double-click to edit a todo</p>
        <p>Written by <a href="http://faxity.se">Christian Norrman</a></p>
        <p>Part of <a href="http://todomvc.com">TodoMVC</a></p>
      </footer>
    `;
  },
});
