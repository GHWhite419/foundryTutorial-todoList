class ToDoList {
    static ID = 'todo-list'

    static FLAGS = {
        TODOS: 'todos'
    }

    static TEMPLATES = {
        TODOLIST: `modules/${this.ID}/templates/todo-list.hbs`
    }
}

/**
 * A single ToDo in our list of ToDos.
 * @typedef {Object} ToDo
 * @property {string} id - A unique ID to identify this ToDo.
 * @property {string} label - The text of the ToDo.
 * @property {boolean} isDone - Marks whether the ToDo is done.
 * @property {string} userId - The user who owns this ToDo.
 */

class ToDoListData {
    
}