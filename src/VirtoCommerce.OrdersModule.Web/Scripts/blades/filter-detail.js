angular.module('virtoCommerce.orderModule')
    .controller('virtoCommerce.orderModule.filterDetailController', ['$scope', '$localStorage', 'platformWebApp.settings', 'virtoCommerce.customerModule.members', '$translate', 'virtoCommerce.orderModule.statusTranslationService', 'platformWebApp.metaFormsService', 'platformWebApp.accounts',
        function ($scope, $localStorage, settings, members, $translate, statusTranslationService, metaFormsService, securityAccounts) {
        var blade = $scope.blade;

        blade.metaFields = blade.metaFields ? blade.metaFields : metaFormsService.getMetaFields('orderFilterDetail');
        
        function translateBladeStatuses(data) {
            blade.statuses = statusTranslationService.translateStatuses(data, 'customerOrder');
        }
        settings.getValues({ id: 'Order.Status' }, translateBladeStatuses);

        blade.fetchEmployees = function (criteria) {
            criteria.memberType = 'Employee';
            criteria.deepSearch = true;
            criteria.sort = 'name';

            return members.search(criteria);
        };

        blade.fetchCustomers = function (criteria) {
            criteria.memberType = 'Contact';
            criteria.deepSearch = true;
            criteria.sort = 'name';

            return members.search(criteria);
        };

        $scope.applyCriteria = function () {
            angular.copy(blade.currentEntity, blade.origEntity);
            if (blade.isNew) {
                $localStorage.orderSearchFilters.push(blade.origEntity);
                $localStorage.orderSearchFilterId = blade.origEntity.id;
                blade.parentBlade.filter.current = blade.origEntity;
                blade.isNew = false;
            }

            initializeBlade(blade.origEntity);
            blade.parentBlade.filter.criteriaChanged();
            // $scope.bladeClose();
        };
        
        $scope.saveChanges = function () {
            if (blade.currentEntity.customerId) {
                // Search for accounts by memberId (because customerID in order is an account)
                securityAccounts.search({ MemberIds: [blade.currentEntity.customerId] }, function (data) {
                    blade.currentEntity.customerIds = _.pluck(data.users, 'id');
                    $scope.applyCriteria();
                });
            }
            else {
                $scope.applyCriteria();
            }
        };

        function initializeBlade(data) {
            blade.currentEntity = angular.copy(data);
            blade.origEntity = data;
            blade.isLoading = false;

            blade.title = blade.isNew ? 'orders.blades.filter-detail.new-title' : data.name;
            blade.subtitle = blade.isNew ? 'orders.blades.filter-detail.new-subtitle' : 'orders.blades.filter-detail.subtitle';
        };

        var formScope;
        $scope.setForm = function (form) { formScope = form; }

        function isDirty() {
            return !angular.equals(blade.currentEntity, blade.origEntity);
        };

        blade.headIcon = 'fa fa-filter';

        blade.toolbarCommands = [
                {
                    name: "core.commands.apply-filter", icon: 'fa fa-filter',
                    executeMethod: function () {
                        $scope.saveChanges();
                    },
                    canExecuteMethod: function () {
                        return formScope && formScope.$valid;
                    }
                },
                {
                    name: "platform.commands.reset", icon: 'fa fa-undo',
                    executeMethod: function () {
                        angular.copy(blade.origEntity, blade.currentEntity);
                    },
                    canExecuteMethod: isDirty
                },
                {
                    name: "platform.commands.delete", icon: 'fas fa-trash-alt',
                    executeMethod: deleteEntry,
                    canExecuteMethod: function () {
                        return !blade.isNew;
                    }
                }];


        function deleteEntry() {
            blade.parentBlade.filter.current = null;
            $localStorage.orderSearchFilters.splice($localStorage.orderSearchFilters.indexOf(blade.origEntity), 1);
            delete $localStorage.orderSearchFilterId;
            blade.parentBlade.refresh();
            $scope.bladeClose();
        }

        // actions on load
        if (blade.isNew) {
            $translate('orders.blades.customerOrder-list.labels.unnamed-filter').then(function (result) {
                initializeBlade({ id: new Date().getTime(), name: result });
            });
        } else {
            initializeBlade(blade.data);
        }
    }]);
