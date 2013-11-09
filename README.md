#dcom-angular-dialog

##Description
This is dialog module for angular, which uses Bootstrap 3 modals and custom backdrop.
dialogService allows you to create dialog

    dialogService.create(templateName, className, customCtrl, persistent);

for example

    var dialog = dialogService('error', 'errorDialog', { message: "scope message" }, true);

and call different methods:

    dialog.open()
    dialog.close()
    dialog.dismiss()
    dialog.destroy()

or register custom callStack on these events:

- open
- ready
- dismiss
- destroy

It supports closing dialog with ESC key, or with Backdrop click event

###Parameters
    
    - templateName
        name of the html template defined for custom modal
    - className
        CSS class of modal
    - customCtrl
        function or object that define modal controller
    - persistent
        boolean value, defines if .close() method hides modal or removes it completely from DOM

###Credits

Thanks to @capaj for the initial idea.


###Licence
Released under MIT licence.
Feel free to contribute or use.