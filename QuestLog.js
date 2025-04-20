/*:
 * @target MZ
 * @plugindesc Quest Log with categories and status filters - v1.3 (Story/Side + Active/Completed Tabs) 
 * @author Efermeral & ChatGPT
 * 
 * @help
 * Add quest:
 * $gameParty.addQuest(id, name, description, type); // type: "story" atau "side"
 * Mark as complete:
 * $gameParty.completeQuest(id);
 * Retake completed quest:
 * $gameParty.reactivateQuest(id);
 * If error no need to use reactiveQuest
 */

(() => {

  class Quest {
    constructor(id, name, description, type) {
      this.id = id;
      this.name = name;
      this.description = description;
      this.type = type || "side";
      this.completed = false;
    }
  }

  const _Game_Party_initialize = Game_Party.prototype.initialize;
  Game_Party.prototype.initialize = function () {
    _Game_Party_initialize.call(this);
    this._quests = [];
  };

  Game_Party.prototype.addQuest = function (id, name, description, type) {
    const quest = this._quests.find(q => q.id === id);
    if (!quest) {
      this._quests.push(new Quest(id, name, description, type));
    } else if (quest.completed) {
      // Jika quest sebelumnya sudah selesai dan diambil ulang, reset status
      quest.completed = false;
    }
  };

  Game_Party.prototype.completeQuest = function (id) {
    const quest = this._quests.find(q => q.id === id);
    if (quest) quest.completed = true;
  };

  Game_Party.prototype.reactivateQuest = function (id) {
    const quest = this._quests.find(q => q.id === id);
    if (quest) quest.completed = false;
  };

  Game_Party.prototype.getQuestsByTypeAndStatus = function (type, completed) {
    return this._quests.filter(q => q.type === type && q.completed === completed);
  };

  const _Window_MenuCommand_addOriginalCommands = Window_MenuCommand.prototype.addOriginalCommands;
  Window_MenuCommand.prototype.addOriginalCommands = function () {
    _Window_MenuCommand_addOriginalCommands.call(this);
    this.addCommand("Quest Log", "questLog", true);
  };

  const _Scene_Menu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
  Scene_Menu.prototype.createCommandWindow = function () {
    _Scene_Menu_createCommandWindow.call(this);
    this._commandWindow.setHandler("questLog", this.commandQuestLog.bind(this));
  };

  Scene_Menu.prototype.commandQuestLog = function () {
    SceneManager.push(Scene_QuestLog);
  };

  class Scene_QuestLog extends Scene_MenuBase {
    create() {
      super.create();
      this._type = "story";
      this._completed = false;
      this.createHelpWindow();
      this.createCategoryWindow();
      this.createStatusWindow();
      this.createQuestListWindow();

      this._categoryWindow.activate();
      this._categoryWindow.select(0);

      this._questListWindow.setHandler("cancel", () => {
        this._questListWindow.deactivate();
        this._statusWindow.activate();
        this._statusWindow.select(0);
      });

      this._statusWindow.setHandler("active", () => {
        this.switchStatus(false);
        this._statusWindow.deactivate();
        this._questListWindow.activate();
        this._questListWindow.select(0);
      });

      this._statusWindow.setHandler("completed", () => {
        this.switchStatus(true);
        this._statusWindow.deactivate();
        this._questListWindow.activate();
        this._questListWindow.select(0);
      });

      this._statusWindow.setHandler("cancel", () => {
        this._statusWindow.deactivate();
        this._categoryWindow.activate();
        this._categoryWindow.select(0);
      });

      this._categoryWindow.setHandler("story", () => {
        this.switchCategory("story");
        this._categoryWindow.deactivate();
        this._statusWindow.activate();
        this._statusWindow.select(0);
      });

      this._categoryWindow.setHandler("side", () => {
        this.switchCategory("side");
        this._categoryWindow.deactivate();
        this._statusWindow.activate();
        this._statusWindow.select(0);
      });

      this._categoryWindow.setHandler("cancel", this.popScene.bind(this));
    }

    helpWindowRect() {
      return new Rectangle(0, 0, Graphics.boxWidth, this.calcWindowHeight(2, false));
    }

    createCategoryWindow() {
      const y = this._helpWindow.height;
      const rect = new Rectangle(0, y, Graphics.boxWidth / 2, this.calcWindowHeight(1, false));
      this._categoryWindow = new Window_QuestCategory(rect);
      this.addWindow(this._categoryWindow);
    }

    createStatusWindow() {
      const y = this._helpWindow.height;
      const x = Graphics.boxWidth / 2;
      const rect = new Rectangle(x, y, Graphics.boxWidth / 2, this.calcWindowHeight(1, false));
      this._statusWindow = new Window_QuestStatus(rect);
      this.addWindow(this._statusWindow);
    }

    createQuestListWindow() {
      const y = this._helpWindow.height + this._categoryWindow.height;
      const h = Graphics.boxHeight - y;
      const rect = new Rectangle(0, y, Graphics.boxWidth, h);
      this._questListWindow = new Window_QuestList(rect, this._type, this._completed);
      this._questListWindow.setHelpWindow(this._helpWindow);
      this.addWindow(this._questListWindow);
    }

    switchCategory(type) {
      this._type = type;
      this._questListWindow.setTypeAndStatus(type, this._completed);
    }

    switchStatus(completed) {
      this._completed = completed;
      this._questListWindow.setTypeAndStatus(this._type, completed);
    }
  }

  class Window_QuestCategory extends Window_HorzCommand {
    maxCols() { return 2; }
    makeCommandList() {
      this.addCommand("Story", "story");
      this.addCommand("Side", "side");
    }
  }

  class Window_QuestStatus extends Window_HorzCommand {
    maxCols() { return 2; }
    makeCommandList() {
      this.addCommand("Active", "active");
      this.addCommand("Completed", "completed");
    }
  }

  class Window_QuestList extends Window_Selectable {
    constructor(rect, type, completed) {
      super(rect);
      this._type = type;
      this._completed = completed;
      this.refresh();
    }

    setTypeAndStatus(type, completed) {
      this._type = type;
      this._completed = completed;
      this.refresh();
    }

    maxItems() {
      return this._data ? this._data.length : 0;
    }

    refresh() {
      this._data = $gameParty.getQuestsByTypeAndStatus(this._type, this._completed);
      this.createContents();
      this.drawAllItems();
    }

    drawItem(index) {
      const quest = this._data[index];
      if (quest) {
        const rect = this.itemLineRect(index);
        const status = quest.completed ? "(Completed)" : "(Active)";
        const nameWithStatus = `${quest.name} ${status}`;
        this.drawText(nameWithStatus, rect.x, rect.y, rect.width, "left");
      }
    }

    currentQuest() {
      return this._data[this.index()];
    }

    updateHelp() {
      const quest = this.currentQuest();
      this._helpWindow.setText(quest ? quest.description : "");
    }
  }

})();
