#dc-modal
[doodeec.com](http://doodeec.com)

##Version
1.0.0

##Description
This is a dialog module for angular.
It creates and makes `DialogService` service available in your app.

DialogService allows you to create dialog in this way:

    DialogService.get({string} dialogName, {object} config);

where optional config object is used to configure the dialog.
For example you can call

    var dialog = DialogService.get('error', {
        className: 'errorDialog',
        controller: { message: "scope message" },
        persistent: true,
        backdrop: false,
        template: 'templates/errorDialog.html'
    });

and call different methods:

    dialog.open()
    dialog.close()
    dialog.dismiss()
    dialog.destroy()
    dialog.isOpened()

or register a custom callStack of functions for these events:

- open
- ready (called once template for modal is resolved - resolving template starts directly inside modal constructor)
- dismiss
- destroy (when modal is being destroyed, it gets dismissed first, so dismissed stack is called before destroy stack)

like this

    dialog.on('open', function() {/* callback */})
    

Closing the modal with ESC key, or with Backdrop click are both supported. Closing with Backdrop click can be
disabled by setting `backdrop` option to false when creating a new modal.

When dialog is created without `template` config parameter, default template will be used to create a dialog.
Default template looks like this:

    <div class="dc-modal-body"><p>{{message}}</p></div>
    
So you can create simple dialogs without any need to create your custom templates.
DialogService provides a method `setDefaultTemplate(string)` which you can use to customize default template
and use simple dialogs without `template` config parameter.

Service also provides a way to define base path for templates (default value is empty - all paths are taken as 
relative/absolute). When you have all your dialog templates in i.e. `templates/dialogs` folder, you can easily set this path via
`setBaseTemplatePath("templates/dialogs")`.
Calling
 
    DialogService.get("error", {template: "404.html"});
    
afterwards will result in using dialog template `templates/dialogs/404.html` 

###Usage
Include `dcModal-{version}.js` and `dcModal-{version}.css` files in your website and in the app module 
definition add `dcModal` as a required module

    angular.module('myApp', ['dcModal'])...

##Documentation
###Service methods

    - get({name}, {config}[optional])       @returns DcDialog instance
        finds dialog by its name, if dialog with given name does not exist, creates a new one
    - findById({number})                    @returns DcDialog or null
        finds dialog by its id and returns found dialog
        returns null if dialog is not found
    - setDefaultTemplate({string})
        sets default template which is used for dialogs without 'template' config property
        this can be either static HTML or it can contain angular expressions
        when expressions are used in default template, these are filled from 'controller' config property
    - setBaseTemplatePath({string})
        sets base path for ALL dialogs globally
        BEWARE that this setting makes absolute template path useless

###Parameters
    
    - name
        {string} name of dialog
    - config
        {object} config with additional options

###Supported Config Options

    - className
        {string} CSS class of the root dialog element
    - controller
        {function/object} controller function or object with scope definition to be used inside modal
    - persistent
        {bool} defines if .close() method hides modal or removes it completely from DOM
    - backdrop
        {bool} false for disabling closing of the dialog with backdrop click (true by default)
    - animate
        {bool} false for not animating the modal when entering/leaving the screen (true by default)
    - template
        {string} path to template which should be used with this dialog

###Credits
Thanks to [capaj](http://github.com/capaj) for the initial idea.

###Licence
Released under MIT licence.

###Support
Tested across Angular 1.0.6 - 1.2.14 - 1.3.15, but probably should be also compatible with other versions.

If you encounter any problems using this module, contact me via [doodeec.com](http://doodeec.com)
or [send me an email](mailto:doodeec@gmail.com)

###Contribution
If you want to make this code better, feel free to open a PR

###Author
Dusan Bartos<br/>
[doodeec.com](http://doodeec.com)<br/>
[doodeec@gmail.com](mailto:doodeec@gmail.com)