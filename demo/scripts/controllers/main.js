"use strict";

angular.module("angularModalDemo")
    .controller("MainCtrl",
    ["$scope", "DialogService", "$timeout",
        function ($scope, DialogService, $timeout) {

            DialogService.setDefaultTemplate("<div><div class=\"dc-modal-body\">This is set from " +
                "the controller - {{message}}</div></div>");

            $scope.oneDialog = function (e) {
                var dialog = DialogService.get("error", {
                    controller: {
                        message: "Using default dialog template"
                    }
                });
                dialog.open(e);
            };

            $scope.twoDialogs = function (e) {
                var firstDialogOptions = {
                    className: "info",
                    backdrop: false,
                    template: "templates/info.html"
                };
                var firstDialog = DialogService.get("info", firstDialogOptions);
                firstDialog.open(e);

                $timeout(function () {
                    var secondDialog = DialogService.get("error", {
                        template: "templates/error.html"
                    });
                    secondDialog.open(e);
                }, 200);
            };

            $scope.ctrlDialog = function (e) {
                var options = {
                    className: "ctrlDialog",
                    template: "templates/ctrl.html",
                    controller: {
                        message: "This is dialog message injected from code",
                        magicButton: function () {
                            this.message = "Whoa, message has changed";
                        }
                    },
                    animate: false
                };

                var dialog = DialogService.get("ctrl", options);
                dialog.open(e);
            };

            $scope.ctrlDialog2 = function (e) {
                var options = {
                    className: "ctrlDialog",
                    template: "templates/ctrl.html",
                    controller: function ($scope) {
                        $scope.message = "This is message injected to the scope via modal options.";
                    }
                };

                var dialog = DialogService.get("ctrl", options);
                dialog.open(e);
            };
        }]);