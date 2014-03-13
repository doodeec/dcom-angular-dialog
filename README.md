#dcom-angular-dialog
[doodeec.com](http://doodeec.com)

##Version
0.2.0

##Description
This is a dialog module for angular, which uses Bootstrap 3 modals and the custom backdrop.
It creates `dialogService` in your app.

dialogService allows you to create dialog in this way:

    dialogService.create(templateName, options);

for example

    var dialog = dialogService.create('error', {
        className: 'errorDialog',
        controller: { message: "scope message" },
        persistent: true,
        backdrop: false);
    }

and call different methods:

    dialog.open()
    dialog.close()
    dialog.dismiss()
    dialog.destroy()

or register a custom callStack on these events:

- open
- ready
- dismiss
- destroy

    dialog.on('open', function() {/* callback */})

Closing the modal with ESC key, or with Backdrop click event are both supported. Closing with Backdrop click can be
disabled by setting `backdrop` option to false when creating a modal.

###Usage
Include Bootstrap 3 `modal.js` file.
Include `dcom-angular-dialog-{version}.min.js` and `dcom-angular-dialog-{version}.min.css`,
and in the app module definition add `dcModal` as required module

    angular.module('myApp', ['dcModal'])...

###Parameters
    
    - templateName
        name of html template defined for the modal, will be searched in templates folder by default (relative path)
    - options
        object of additional options

###Supported Modal Options

    - className
        CSS class of the root dialog element
    - controller
        controller function or object with scope definition to be used inside modal
    - persistent
        boolean value, defines if .close() method hides modal or removes it completely from DOM
    - backdrop
        when false, it disables closing of the dialog on backdrop click

###Credits

Thanks to [capaj](http://github.com/capaj) for the initial idea.


###Licence
Released under MIT licence.

###Support
If you encounter any problems using this module, contact me via [doodeec.com](http://doodeec.com)
or [send me an email](mailto:doodeec@gmail.com)

###Contribution
If you want to make this code better, feel free to open a PR

###Future
Plan is to get rid of Bootstrap and jQuery completely