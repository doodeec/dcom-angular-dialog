'use strict';

angular.module('angularModalDemo')
  .controller('MainCtrl',
    ['$scope','dialogService','$timeout',
        function ($scope, dialogService, $timeout) {

            $scope.oneDialog = function() {
                var dialog = dialogService.create('error');
                dialog.open();
            };

            $scope.twoDialogs = function() {
                var firstDialogOptions = {
                    className: 'info',
                    backdrop: false
                };
                var firstDialog = dialogService.create('info',firstDialogOptions);
                firstDialog.open();

                $timeout(function() {
                    var secondDialog = dialogService.create('error');
                    secondDialog.open();
                });
            };

            $scope.ctrlDialog = function() {
                var options = {
                    className: 'ctrlDialog',
                    controller: {
                        message: "This is dialog message injected from code",
                        magicButton: function() {
                            this.message = "Whoa, message has changed";
                        }
                    }
                };

                var dialog = dialogService.create('ctrl',options);
                dialog.open();
            };
  }]);
