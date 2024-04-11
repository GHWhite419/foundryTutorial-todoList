class ToDoList {
  static ID = "todo-list";

  static FLAGS = {
    TODOS: "todos",
  };

  static TEMPLATES = {
    TODOLIST: `modules/${this.ID}/templates/todo-list.hbs`,
  };
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
  static getToDosForUser(userId) {
    return game.users.get(userId)?.getFlag(ToDoList.ID, ToDoList.FLAGS.TODOS);
  }

  static createToDo(userId, toDoData) {
    const newToDo = {
      isDone: false,
      ...toDoData,
      id: foundry.utils.randomID(16),
      userId,
    };

    const newToDos = {
      [newToDo.id]: newToDo,
    };

    return game.users
      .get(userId)
      ?.setFlag(ToDoList.ID, ToDoList.FLAGS.TODOS, newToDos);
  }

  static get allToDos() {
    const allToDos = game.users.reduce((accumulator, user) => {
      const userToDos = this.getToDosForUser(user.id);

      return {
        ...accumulator,
        ...userToDos,
      };
    }, {});

    return allToDos;
  }

  static updateToDo(toDoId, updateData) {
    const relevantToDo = this.allToDos[toDoId];

    const update = {
      [toDoId]: updateData,
    };

    return game.users
      .get(relevantToDo.userId)
      ?.setFlag(ToDoList.ID, ToDoList.FLAGS.TODOS, update);
  }

  static deleteToDo(toDoId) {
    const relevantToDo = this.allToDos[toDoId];

    const keyDeletion = {
      [`-=${toDoId}`]: null,
    };

    return game.users
      .get(relevantToDo.userId)
      ?.setFlag(ToDoList.ID, ToDoList.FLAGS.TODOS, keyDeletion);
  }

  static updateUserToDos(userId, updateData) {
    return game.users.get(userId)?.setFlag(ToDoList.ID, ToDoList.FLAGS.TODOS, updateData)
  }
}
