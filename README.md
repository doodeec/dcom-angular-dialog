#dcom-angular-dialog
[doodeec.com](http://doodeec.com)

##Description
This is a dialog module for angular, which uses Bootstrap 3 modals and the custom backdrop.
It creates `dialogService` in your app.
dialogService allows you to create dialog:

    dialogService.create(templateName, className, customCtrl, persistent, backdropDisable);

for example

    var dialog = dialogService.create('error', 'errorDialog', { message: "scope message" }, true, true);

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

It supports closing the dialog with ESC key, or with Backdrop click event. Closing with Backdrop click can be
disabled by adding parameter `backdropDisable` in method `.create()`.

###Usage
Include dcomDialog.js and dcomDialog.css, and in the app module definition put `dcomDialog` as a required module

    angular.module('myApp', ['dcomDialog'])...

###Parameters
    
    - templateName
        name of html template defined for the modal, will be searched in templates folder by default (relative path)
    - className
        CSS class of the root dialog element
    - customCtrl
        function or object that define the modal controller
    - persistent
        boolean value, defines if .close() method hides modal or removes it completely from DOM
    - backdropDisable
        disables closing of dialog on backdrop click

###Credits

Thanks to [capaj](http://github.com/capaj) for the initial idea.


###Licence
Released under MIT licence.
Feel free to contribute or use.