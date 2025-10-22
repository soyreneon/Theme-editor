## ThemeTuner

ThemeTuner is a tool to change/fix colors globally in `settings.json` file for your current theme. It scans all the colors defined (even those defined without this extension) and displays them sorted by number of occurrences.

# Demo

![Watch ThemeTuner Demo](https://github.com/soyreneon/Theme-editor/raw/main/media/demo.gif)

Watch a full demo on [youtube](https://www.youtube.com/watch?v=6rxlV-PZwBo).

| Before/after customizations                                                        |
| ---------------------------------------------------------------------------------- |
| ![Before](https://github.com/soyreneon/Theme-editor/raw/main/media/img-before.png) |
| ![After](https://github.com/soyreneon/Theme-editor/raw/main/media/img-after.png)   |

## How to use it

Install ThemeTuner, then press `Cmd+Shift+P` on macOS or `Ctrl+Shift+P` on Windows and Linux and type `ThemeTuner: Open ThemeTuner` and ThemeTuner will scan your current color palette automatically. It will open an editor in a second tab for a better debuging experience.

To modify a diferent theme, switch to another theme using `Cmd+K+T` on macOS or `Ctrl+K+T` on Windows and Linux. It will re-scan the new theme.

## Interface

This extension has the following structure:

- Current theme name
- Number of available colors
- Reset button (it will override all customizations, even those made without ThemeTuner)
- Refresh button (refresh in case that you made changes without ThemeTuner)
- Export (execute the native vscode command `Developer: Generate Color Theme From Current Settings`)
- Filter by property type
- Eyedropper tool for searching
- Search by text(color or property)
- Color list (Each color has its own tools and detailed property list)

Check this reference image:

![Overall interface](https://github.com/soyreneon/Theme-editor/raw/main/media/img_interface.png)

## Tools

Click a color and you will see the available tools:

- color picker
- brightness controls
- existing color palette
- reset color to the original
- set custom name to find it easily
- pin/unpin color to top of the list
- detailed property list
- check/uncheck color group for more control applying changes
- click property for individual color change (change transparency for workbench colors)

![Tools and details](https://github.com/soyreneon/Theme-editor/raw/main/media/img-colorcontent.png)

The `*` mark indicates these color has been customized

![Color customized](https://github.com/soyreneon/Theme-editor/raw/main/media/img-customized.png)

## Tips

ThemeTuner was designed to edit themes guided by our vision, so you don't need to be an expert in theming or in all the existing properties.

- The general recommendation is to find a theme you like and start making visible color changes. If you find the color you want to change, add a name to it so it's easy to recognize. If not, reset it to default and continue this process.

- Regarding property color classification, there are two broad divisions:

| ui colors</br>(text and background) |                                 code syntax                                 |
| ----------------------------------- | :-------------------------------------------------------------------------: |
| Workbench colors                    | Textmate token colors </br> Semantic token colors </br> Syntax colors </br> |

## Considerations

- _ThemeTuner **only shows a list of the properties defined in your theme** (when a prop is not defined, it takes the default vscode core value). If some property is missing, then is not defined and you have to add it manually. **THAT MEANS YOU MIGHT NOT FIND THE PROPERTY COLOR YOU'RE LOOKING FOR. e.g. if you switch to `Dark+ (Default Dark+)` theme, you will only see token colors, background editor and other colors will be taken from vscode core settings**_

- If you need to identify a specific Texmate token color, press `Ctrl+Shift+P` or `Cmd+Shift+P` and type `Developer: Inspect Editor Tokens and Scopes` and you can find it.

- Eyedropper tool is a native tool provided by browser, sometimes it makes small mistakes identifiyng colors (the error rate is about &plusmn;2). For windows, eyedropper doesn't support click outside vscode and you need to zoom in text to identify typografy colors. Great tool for identifying no transparency colors.

# Future features

Depending on demand, new features are coming(some features have being released but don't forget to rate it):

- add new property
- color templates
- advanced export

## License

MIT

**Enjoy!**
