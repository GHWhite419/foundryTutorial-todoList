class ToDoList {
  static ID = "todo-list";

  static FLAGS = {
    TODOS: "todos",
  };

  static TEMPLATES = {
    TODOLIST: `modules/${this.ID}/templates/todo-list.hbs`,
  };

  static initialize() {
    this.toDoListConfig = new ToDoListConfig();
    game.settings.register(this.ID, this.SETTINGS.INJECT_BUTTON, {
      name: `TODO-LIST.settings.${this.SETTINGS.INJECT_BUTTON}.Name`,
      default: true,
      type: Boolean,
      scope: "client",
      config: true,
      hint: `TODO-LIST.settings.${this.SETTINGS.INJECT_BUTTON}.Hint`,
      onChange: () => ui.players.render()
    });
  }

  static SETTINGS = {
    INJECT_BUTTON: "inject-button",
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

Hooks.on("renderPlayerList", (playerList, html) => {
  if (!game.settings.get(ToDoList.ID, ToDoList.SETTINGS.INJECT_BUTTON)) {
    return;
  }

  const loggedInUserListItem = html.find(`[data-user-id="${game.userId}"]`);

  const tooltip = game.i18n.localize("TODO-LIST.button-title");

  html.on("click", ".todo-list-icon-button", (event) => {
    const userId = $(event.currentTarget)
      .parents("[data-user-id]")
      ?.data()?.userId;
    ToDoList.toDoListConfig.render(true, { userId });
  });

  loggedInUserListItem.append(
    `<button type='button' class='todo-list-icon-button flex0' title='${tooltip}'><i class='fas fa-tasks'></i> </button>`
  );
});

Hooks.once("init", () => {
  ToDoList.initialize();
});

class ToDoListData {
  static getToDosForUser(userId) {
    // To utilize these todo methods, we begin by targeting the given user's ID and passing that in as an argument.
    // In this first method - getToDosForUser - we simply pass that user ID in and target it to get the given user's todo flags.
    return game.users.get(userId)?.getFlag(ToDoList.ID, ToDoList.FLAGS.TODOS);
  }

  static createToDo(userId, toDoData) {
    // In createToDo, we first pass in the userId as above for one parameter, and then the toDoData we're writing as another.
    // The toDoData is passed into this newToDo object to create a new flag.
    const newToDo = {
      isDone: false,
      ...toDoData,
      id: foundry.utils.randomID(16),
      userId,
      // isDone will act as our checkbox, marked false - incomplete - by default. Wouldn't make sense to create a todo that's already done now, would it?
      // toDoData is accepted above as an argument for this method and is then spread into the newToDo object. Since toDoData is an object like newToDo, We use spread to ensure all previous information is merged with the structure of the newToDo object instead of overwriting it.
      // For id, we use a built-in foundry utility to generate a random string, the argument indicates it will be 16 character's in length. When we need to update or delete said to do, we can target this id.
      // And finally, userId is passed in from the parameter above to indicate which user owns the newToDo object. We use shorthand here as the value is already defined when the userId is passed in.
    };

    const newToDos = {
      [newToDo.id]: newToDo,
      // In order to set this newToDo as a new flag, we need to convert the entire newToDo object into a property of a larger object. We'll do this by defining the todo's id as the key, and the entire newToDo object as the value. The reason we do this is...
    };

    return (
      game.users
        // ...because of the way the setFlag method is set up within Foundry. First of all, the TODOS flags is an object that is similar to the newToDos object, rather than the newToDo object. There are several properties that follow the format of key = id, value = todo object. The way setFlag works is that when we set a newFlag, it merges that flag with the flags already in there instead of replacing it. However, if we set newToDo as the flag (instead of newToDos), the TODOS flags would conform to that structure, rather than its current, and would in effect overwrite the entire TODOS flags with the data from only a single to-do.
        // Tl;dr we pass in "newToDos" instead of "newToDo" to merge new data with old data and avoid overwriting.
        .get(userId)
        ?.setFlag(ToDoList.ID, ToDoList.FLAGS.TODOS, newToDos)
    );
  }

  static get allToDos() {
    const allToDos = game.users.reduce((accumulator, user) => {
      // The accumulator argument acts as the progressive collection of user todos, beginning as an empty object.
      // The user argument identifies a particular user as the reducer loops through the game.users collection, and is used to save those todos in a variable.
      const userToDos = this.getToDosForUser(user.id);
      // userToDos stores the todos for the user currently targeted by the reducer.

      return {
        // Using spread operators, we first make sure the currently collected information is returned and therefore saved from the accumulator.
        // We then spread in the new userToDos, growing the accumulator before iterating for the next user.
        ...accumulator,
        ...userToDos,
      };
    }, {});
    // The empty object argument indicates the starting state of our return.

    return allToDos;
  }

  static updateToDo(toDoId, updateData) {
    // We first capture our targeted todo in relevantToDo, which references our allToDos object using the toDoId argument as the key.
    // By creating the allToDos method, we've made it a lot easier to target our desired todo for update by removing the need to loop through users within the same method.
    const relevantToDo = this.allToDos[toDoId];

    // Next we prepare a new object to merge in with existing data, using toDoId as the targeted key in our existing flag, and passing in our updateData argument as the new data.
    const update = {
      [toDoId]: updateData,
    };

    // We finish by using the setFlag data (passing in the update object as our argument) to merge in the updated data with the existing data, replacing any conflicts - similar to how the createToDo method works.
    return game.users
      .get(relevantToDo.userId)
      ?.setFlag(ToDoList.ID, ToDoList.FLAGS.TODOS, update);
  }

  static deleteToDo(toDoId) {
    // Only needing one parameter here, we pass in our targeted todo's id and save it to a variable, once again using the allToDos object to make our lives easier.
    const relevantToDo = this.allToDos[toDoId];

    // We then create our keyDeletion object, using Foundry's specific syntax for deleting flags.
    // Instead of targeting our todo directly by passing in the id as the key, we instead create a new object, with a dynamic key that matches our target todo's id. Along with the special syntax and the template literal, we set the value as null. This tells Foundry that we want to delete the flag, ratherr than update it with a value of null.
    const keyDeletion = {
      [`-=${toDoId}`]: null,
    };

    // Finally we set the flag using our special object, and voila: the todo is deleted.
    return game.users
      .get(relevantToDo.userId)
      ?.setFlag(ToDoList.ID, ToDoList.FLAGS.TODOS, keyDeletion);
  }

  static updateUserToDos(userId, updateData) {
    // This simple method behaves similar to updateToDo, but targets userId instead of toDoId, allowing us to pass in updateData for multiple todos at once.
    return game.users
      .get(userId)
      ?.setFlag(ToDoList.ID, ToDoList.FLAGS.TODOS, updateData);
  }
}

class ToDoListConfig extends FormApplication {
  static get defaultOptions() {
    const defaults = super.defaultOptions;

    const overrides = {
      height: "auto",
      id: "todo-list",
      template: ToDoList.TEMPLATES.TODOLIST,
      title: "To Do List",
      userId: game.userId,
      closeOnSubmit: false,
      submitOnChange: true,
    };

    const mergedOptions = foundry.utils.mergeObject(defaults, overrides);

    return mergedOptions;
  }
  getData(options) {
    return {
      todos: ToDoListData.getToDosForUser(options.userId),
    };
  }

  async _updateObject(event, formData) {
    const expandedData = foundry.utils.expandObject(formData);

    await ToDoListData.updateUserToDos(this.options.userId, expandedData);

    this.render();
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.on("click", "[data-action]", this._handleButtonClick.bind(this));
  }

  async _handleButtonClick(event) {
    const clickedElement = $(event.currentTarget);
    const action = clickedElement.data().action;
    const toDoId = clickedElement.parents("[data-todo-id]")?.data()?.todoId;

    console.log("Button clicked!", { this: this, action, toDoId });

    switch (action) {
      case "create": {
        await ToDoListData.createToDo(this.options.userId);
        this.render();
        break;
      }

      case 'delete': {
        const confirmed = await Dialog.confirm({
          title: game.i18n.localize("TODO-LIST.confirms.deleteConfirm.Title"),
          content: game.i18n.localize("TODO-LIST.confirms.deleteConfirm.Content")
        });

        if (confirmed) {
          await ToDoListData.deleteToDo(toDoId);
          this.render();
        }

        break;
      }

      default:
        console.log("Invalid action detected", action);
    }
  }
}
