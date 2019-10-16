[![Support](https://img.shields.io/badge/Support-Community%20(no%20active%20support)-orange.svg)](https://docs.mendix.com/developerportal/app-store/app-store-content-support)
[![Studio](https://img.shields.io/badge/Studio%20version-8.0%2B-blue.svg)](https://appstore.home.mendix.com/link/modeler/)
![GitHub release](https://img.shields.io/github/release/JelteMX/mendix-file-dropper)
![GitHub issues](https://img.shields.io/github/issues/JelteMX/mendix-file-dropper)

# FileDropper

Inspired by the [Mendix Dropzone widget](https://appstore.home.mendix.com/link/app/916/). Drop files/images in your Mendix application. WebModeler compatible! This widget is based on [react-dropzone](https://github.com/react-dropzone/react-dropzone) and [MobX](https://github.com/mobxjs/mobx) (version 4, needed for IE11 compatibility).

![appstore](/assets/AppStoreIcon.png)

Show this dropzone:

![preview](/assets/screenshot.png)

## Features

- Drop files in a dropzone on your page
- Automatically upload to Mendix
- Save using a `POST` method (enabled progress bar) or `saveDocument` (this uses the `mx.data.saveDocument` method and should work offline)
- Restrict files based on size, number of files and mime types
- Verify a file after it is uploaded (onAccept Mf), or use a Verification Entity (see below) and verify before using a microflow or nanoflow
- Execute microflow/nanoflow after it is succesfully uploaded
- Show/hide labels & image previews

> Widget size: ~180Kb, which is ~52Kb Gzipped online

## Compatibility

### Mendix version

Only works in Mendix 8.0.0 and upwards. This widget was created using MobX, which needs a newer React version. Due to that limitation this widget will not work in Mendix versions lower than 8.

### Browsers

- IE 11
- Chrome,Firefox,Safari,Edge
- Should work on Mobile Web, but untested. If you find an issue, please let me know!

**Known issues:**

- In IE11, preview might not work or become very slow. If you experience problems with IE 11 (who uses this anyway??), please switch of previews.
- Progress bar relies on SVG which does not render properly in Microsoft Edge. It's on the Todo to replace this with a normal DIV element

## Basic configuration

### 1. Data

![configuration1](/assets/configuration1.jpg)

- Select and Entity that is (or extends) a `System.FileDocument` (`System.Image` also works)
- **Name** attribute is required, others are not
- Auto save is by default set to true. If for whatever reason you want to give the user control over that, set this to false
- Save Method:

We include the normal **POST** method (default) which will do a request to the Mendix server. The upside of that is that it includes a progress bar, which is beneficial if you handle big files or have a slow connection. If for whatever reason this doesn't work, you can use the **saveDocument** method. This uses `mx.data.saveDocument` and should (need to verify) also work offline.

### 2. Restrictions

![configuration2](/assets/configuration2.jpg)

- Max file size can be set to 0 to have no restrictions. This is always in Mb (1024 * 1024 bytes)
- Max files can be set to 0 to have no restrictions. If it is set to 1, the dropzone (which is clickable) will also restrict the amount of files you can select in the file dialog
- Mime types is used to restrict the type of files that can be uploaded. This is not fool-proof and might not work the same across browsers. Furthermore, if the Entity set in Data is of type `System.Image`, this option will be ignored.

### 3. Verification

![configuration3](/assets/configuration3.jpg)

Verification can be done in two ways:

- onAccept Mf: Microflow that is executed after upload. This can be done when handling small files, but will polute your system with files that are uploaded and maybe not removed
- beforeAccept Mf/Nf: This method uses an extra Entity (non-persistant!) that will be filled with some data from the file (name, size, type, extension) and sent to a microflow/nanoflow. This Mf/Nf will return a string. If the string is `""` or `empty`, it is considered accepted. If the string contains a text, this is used as the error message in the widget.

### 4. Events

![configuration4](/assets/configuration4.jpg)

- This microflow/nanoflow (can be used both) will be executed after a succesful upload. It will send the file object itself as an input parameter

### 5. UI

![configuration5](/assets/configuration5.jpg)

- For various icons you can either use the standard Bootstrap Gylphicon (the classname will be prefixed with `glyphicon glyphicon-`) or a built-in icon.

### 6. Texts

![configuration6](/assets/configuration6.jpg)

- Various texts can be configured. These are actually translatable strings, so the can be translated in Mendix based on the locale.

## Demo project

> _Will be published soon._

Here is the used Domain Model:

![domainmodel](/assets/domain-model.png)

## Issues, suggestions and feature requests

Please file an issue here on Github

## Development and contribution

TBD...

## TODO

- Add unit tests
- Add e2e tests
- Replace progress bar with proper div so it works in Edge
- Add styling properties (class prefixes etc), replace some BEM
- Make document icon optional

## IDEAS

- This widget is perfect right? Who needs new ideas? ;-)

## License

Apache 2
