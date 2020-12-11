import { reactive, ref, computed, watch } from '@kirei/element';
import { defineStore } from '@kirei/store';

const STORAGE_KEY = 'todomvc::storage';

// storage api for the todos (represents an external saving api could be a fetch request)
export function storagePlugin(provide) {
  provide('storage', {
    fetch(key) {
      const data = localStorage.getItem(key);
      return data == null ? data : JSON.parse(data);
    },
    save(key, data) {
      localStorage.setItem(key, JSON.stringify(data));
    },
  });
}

export const TodoStore = defineStore('todo', (ctx) => {
  // initialize data
  const data = ctx.storage.fetch(STORAGE_KEY) || [];
  let nextId = data.length;
  data.forEach((todo, idx) => { todo.id = idx; });

  const todos = reactive(data);
  const editedTodo = ref(null);
  const beforeEditCache = ref(null);
  const visibility = ref('all');

  // visibility filters
  const filters = {
    all: () => todos,
    active: () => todos.filter((todo) => !todo.completed),
    completed: () => todos.filter((todo) => todo.completed),
  };

  // Save to storage everytime todos change
  watch(todos, (todos) => {
    console.debug('SAVING', todos);
    ctx.storage.save(STORAGE_KEY, todos);
  }, { deep: true });

  return {
    // state
    visibility,
    editedTodo,
    todos,
    filters,
    // getters

    filteredTodos: computed(() => filters[visibility.value]()),
    remaining: computed(() => filters.active().length),
    // actions
    addTodo(title) {
      title = title && title.trim();

      if (title) {
        todos.push({
          id: nextId++,
          title,
          completed: false,
        });
      }
    },
    removeTodo(todo) {
      todos.splice(todos.indexOf(todo), 1);
    },
    editTodo(todo) {
      beforeEditCache.value = todo.title;
      editedTodo.value = todo;
    },
    doneEdit(todo) {
      if (editedTodo.value) {
        editedTodo.value = null;
        todo.title = todo.title.trim();

        if (!todo.title) {
          removeTodo(todo);
        }
      }
    },
    cancelEdit(todo) {
      todo.title = beforeEditCache.value;
      editedTodo.value = null;
      beforeEditCache.value = null;
    },
    removeCompleted() {
      todos.splice(0, todos.length, ...filters.active());
    },
    setVisibility(value) {
      visibility.value = value;
    },
    hasFilter(filter) {
      return filters.hasOwnProperty(filter);
    },
  };
});
