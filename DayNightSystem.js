/*:
 * @target MZ
 * @plugindesc Sistem Day/Night + closck displayed on screen, with automatic tone based on in-game time.
 * @author Efermal & ChatGPT
 *
 * @param Time Speed
 * @type number
 * @min 1
 * @desc number of frames to add 1 minute of game time (60 frame = 1 detik).
 * @default 60
 *
 * @command SetTime
 * @text Set Game Time
 * @desc Atur set time spesific hour and minute.
 *
 * @arg hour
 * @type number
 * @min 0
 * @max 23
 *
 * @arg minute
 * @type number
 * @min 0
 * @max 59
 */

(() => {
    const pluginName = "DayNightSystem";
    const parameters = PluginManager.parameters(pluginName);
    const timeSpeed = Number(parameters["Time Speed"] || 60);
  
    let currentHour = 6;
    let currentMinute = 0;
    let frameCount = 0;
  
    PluginManager.registerCommand(pluginName, "SetTime", args => {
      currentHour = Number(args.hour);
      currentMinute = Number(args.minute);
      updateScreenTone();
    });
  
    function updateScreenTone() {
      const tone = getToneForHour(currentHour);
      $gameScreen.startTint(tone, 60);
    }
  
    function getToneForHour(hour) {
      if (hour >= 6 && hour < 8) {
        return [34, 34, 0, 0]; // sunrise
      } else if (hour >= 8 && hour < 17) {
        return [0, 0, 0, 0]; // daytime
      } else if (hour >= 17 && hour < 19) {
        return [-34, -17, 0, 0]; // sunset
      } else {
        return [-68, -68, 0, 68]; // night
      }
    }
  
    const _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function () {
      _Scene_Map_update.call(this);
      if (!$gameMessage.isBusy()) {
        frameCount++;
        if (frameCount >= timeSpeed) {
          frameCount = 0;
          currentMinute++;
          if (currentMinute >= 60) {
            currentMinute = 0;
            currentHour++;
            if (currentHour >= 24) {
              currentHour = 0;
            }
            updateScreenTone();
          }
        }
      }
    };
  
    // ==================
    // === JAM DI LAYAR ===
    // ==================
    class Window_Clock extends Window_Base {
      initialize() {
        const width = 170;
        const height = this.fittingHeight(1);
        super.initialize(new Rectangle(350, 0, width, height));
        this.opacity = 180;
        this.refresh();
      }
  
      refresh() {
        this.contents.clear();
        const h = String(currentHour).padStart(2, "0");
        const m = String(currentMinute).padStart(2, "0");
        this.drawText(`Time: ${h}:${m}`, 0, 0, this.width - 20, "left");
      }
  
      update() {
        super.update();
        this.refresh();
      }
    }
  
    let _Scene_Map_createAllWindows = Scene_Map.prototype.createAllWindows;
    Scene_Map.prototype.createAllWindows = function () {
      _Scene_Map_createAllWindows.call(this);
      this._clockWindow = new Window_Clock();
      this.addWindow(this._clockWindow);
    };
  
    // Getter untuk event
    Game_Interpreter.prototype.getGameHour = function () {
      return currentHour;
    };
    Game_Interpreter.prototype.getGameMinute = function () {
      return currentMinute;
    };
  })();
  
