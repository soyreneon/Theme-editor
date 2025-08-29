# ThemeTuner

ThemeTuner is a tool to change/fix colors globally in settings.json file for your current theme. It scans all the colors defined(even those defined without this extension) and list it sorted by number of appearences.

## Demo

![ThemeTuner in action](https://github.com/soyreneon/Theme-editor/raw/main/media/demo.mp4)

### Before

![How to preview](https://github.com/soyreneon/Theme-editor/raw/main/media/img-before.png)

### After

![How to preview](https://github.com/soyreneon/Theme-editor/raw/main/media/img-after.png)

| Before                                                                                     |                                           After                                           |
| ------------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------: |
| ![How to preview](https://github.com/soyreneon/Theme-editor/raw/main/media/img-before.png) | ![How to preview](https://github.com/soyreneon/Theme-editor/raw/main/media/img-after.png) |

## How to use it

Install ThemeTuner, then press `Cmd+Shift+P` on macOS or `Ctrl+Shift+P` on Windows and Linux and type `ThemeTuner: Open ThemeTuner` and ThemeTuner will scan your current color palette automatically. It will open an editor in a second tab for a better debuging experience.

To modify a diferent theme, switch to another theme using `Cmd+K+T` on macOS or `Ctrl+K+T` on Windows and Linux. It will re-scan the new theme.

# Interface

This extension has the following structure:

- Current theme name
- Number of available colors
- Reset button (it will override all customizations, even those made without ThemeTuner)
- Refresh button (refresh in case that you made changes without ThemeTuner)
- Export (execute the native vscode command `Developer: Generate Color Theme From Current Settings`)
- Color list (Every color has a color box, the hex code and the amount of properties where it is applied)

Check this reference image:

![Overall interface](https://github.com/soyreneon/Theme-editor/raw/main/media/img_interface.png)

# Tools

Click a color and you will see the available tools:

- color picker
- brightness controls
- existing color palette
- reset color to the original
- set custom name to find it easily
- pin/unpin color to top of the list
- detailed property list (includes colors with or without transparency)

![Tools and details](https://github.com/soyreneon/Theme-editor/raw/main/media/img-colorcontent.png)

The `*` mark indicates these color has been customized

![Color customized](https://github.com/soyreneon/Theme-editor/raw/main/media/img-customized.png)

# Considerations

If you need to customize separate properties, go to settings.json to do it manually(Press `Ctrl+,` or `Cmd+,` to go to settings).

_ThemeTuner **only shows a list of the properties defined in your theme** (when a prop is not defined, it takes the default vscode core value). If some property is missing, then is not defined and you have to add it manually. **THAT MEANS YOU MIGHT NOT FIND THE PROPERTY COLOR YOU'RE LOOKING FOR. e.g. if you switch to `Dark+ (Default Dark+)` theme, you will only see token colors, background editor and other colors will be taken from vscode core settings**_

# Future features

Depending on demand, new features are coming(some features have being released but don't forget to rate it):

- property filter
- individual color change
- alpha/transparency modification
- add new property

# License

MIT

**Enjoy!**
