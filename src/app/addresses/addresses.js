angular.module('orderCloud')
	.config(AddressesConfig)
	.controller('AddressesCtrl', AddressesController)
	.controller('AddressEditCtrl', AddressEditController)
	.controller('AddressCreateCtrl', AddressCreateController)
    .controller('AddressAssignCtrl', AddressAssignController)
;

function AddressesConfig($stateProvider) {
	$stateProvider
		.state('addresses', {
			parent: 'base',
			templateUrl: 'addresses/templates/addresses.tpl.html',
			controller: 'AddressesCtrl',
			controllerAs: 'addresses',
			url: '/addresses?search&page&pageSize&searchOn&sortBy&filters',
			data: {componentName: 'Addresses'},
			resolve: {
				Parameters: function($stateParams, OrderCloudParameters) {
					return OrderCloudParameters.Get($stateParams);
				},
				AddressList: function(OrderCloud, Parameters) {
					return OrderCloud.Addresses.List(Parameters.search, Parameters.page, Parameters.pageSize || 12, Parameters.searchOn, Parameters.sortBy, Parameters.filters);
				}
			}
		})
		.state('addresses.edit', {
			url: '/:addressid/edit',
			templateUrl: 'addresses/templates/addressEdit.tpl.html',
			controller: 'AddressEditCtrl',
			controllerAs: 'addressEdit',
			resolve: {
				SelectedAddress: function($stateParams, $state, OrderCloud) {
					return OrderCloud.Addresses.Get($stateParams.addressid).catch(function() {
                        $state.go('^');
                    });
				}
			}
		})
		.state('addresses.create', {
			url: '/addresses/create',
			templateUrl: 'addresses/templates/addressCreate.tpl.html',
			controller: 'AddressCreateCtrl',
			controllerAs: 'addressCreate'
		})
        .state('addresses.assign', {
            url: '/addresses/:addressid/assign',
	        templateUrl: 'addresses/templates/addressAssign.tpl.html',
	        controller: 'AddressAssignCtrl',
	        controllerAs: 'addressAssign',
	        resolve: {
                UserGroupList: function(OrderCloud) {
                    return OrderCloud.UserGroups.List();
                },
                AssignmentsList: function($stateParams, OrderCloud) {
                    return OrderCloud.Addresses.ListAssignments($stateParams.addressid);
                },
                SelectedAddress: function($stateParams, $state, OrderCloud) {
                    return OrderCloud.Addresses.Get($stateParams.addressid).catch(function() {
                        $state.go('^');
                    });
                }
            }
        })
}

function AddressesController($state, $ocMedia, OrderCloud, OrderCloudParameters, AddressList, Parameters) {
	var vm = this;
	vm.list = AddressList;
	vm.parameters = Parameters;
	vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;

	//Check if filters are applied
	vm.filtersApplied = vm.parameters.filters || vm.parameters.from || vm.parameters.to || ($ocMedia('max-width:767px') && vm.sortSelection); //Sort by is a filter on mobile devices
	vm.showFilters = vm.filtersApplied;

	//Check if search was used
	vm.searchResults = Parameters.search && Parameters.search.length > 0;

	//Reload the state with new parameters
	vm.filter = function(resetPage) {
		$state.go('.', OrderCloudParameters.Create(vm.parameters, resetPage));
	};

	//Reload the state with new search parameter & reset the page
	vm.search = function() {
		vm.filter(true);
	};

	//Clear the search parameter, reload the state & reset the page
	vm.clearSearch = function() {
		vm.parameters.search = null;
		vm.filter(true);
	};

	//Clear relevant filters, reload the state & reset the page
	vm.clearFilters = function() {
		vm.parameters.filters = null;
		vm.parameters.from = null;
		vm.parameters.to = null;
		$ocMedia('max-width:767px') ? vm.parameters.sortBy = null : angular.noop(); //Clear out sort by on mobile devices
		vm.filter(true);
	};

	//Conditionally set, reverse, remove the sortBy parameter & reload the state
	vm.updateSort = function(value) {
		value ? angular.noop() : value = vm.sortSelection;
		switch(vm.parameters.sortBy) {
			case value:
				vm.parameters.sortBy = '!' + value;
				break;
			case '!' + value:
				vm.parameters.sortBy = null;
				break;
			default:
				vm.parameters.sortBy = value;
		}
		vm.filter(false);
	};

	//Used on mobile devices
	vm.reverseSort = function() {
		Parameters.sortBy.indexOf('!') == 0 ? vm.parameters.sortBy = Parameters.sortBy.split('!')[1] : vm.parameters.sortBy = '!' + Parameters.sortBy;
		vm.filter(false);
	};

	//Reload the state with the incremented page parameter
	vm.pageChanged = function() {
		$state.go('.', {page:vm.list.Meta.Page});
	};

	//Load the next page of results with all of the same parameters
	vm.loadMore = function() {
		return OrderCloud.Addresses.List(Parameters.search, vm.list.Meta.Page + 1, Parameters.pageSize || vm.list.Meta.PageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters)
			.then(function(data) {
				vm.list.Items = vm.list.Items.concat(data.Items);
				vm.list.Meta = data.Meta;
			});
	};
}

function AddressEditController($exceptionHandler, $state, $scope, toastr, OrderCloud, OCGeography, SelectedAddress) {
	var vm = this,
        addressID = SelectedAddress.ID;
	vm.addressName = SelectedAddress.AddressName;
	vm.address = SelectedAddress;
    vm.countries = OCGeography.Countries;
    vm.states = OCGeography.States;

    $scope.$watch(function() {
        return vm.address.Country
    }, function() {
        vm.address.State = null;
    });

	vm.Submit = function() {
		OrderCloud.Addresses.Update(addressID, vm.address)
			.then(function() {
				$state.go('addresses', {}, {reload: true});
                toastr.success('Address Updated', 'Success');
			})
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
	};

	vm.Delete = function() {
		OrderCloud.Addresses.Delete(SelectedAddress.ID, false)
			.then(function() {
				$state.go('addresses', {}, {reload: true});
                toastr.success('Address Deleted', 'Success');
			})
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
	};
}

function AddressCreateController($exceptionHandler, $scope, $state, toastr, OrderCloud, OCGeography) {
	var vm = this;
	vm.address = {
        Country: 'US' // this is to default 'create' addresses to the country US
    };
    vm.countries = OCGeography.Countries;
    vm.states = OCGeography.States;

    $scope.$watch(function() {
        return vm.address.Country
    }, function() {
        vm.address.State = null;
    });

	vm.Submit = function() {
		OrderCloud.Addresses.Create(vm.address)
			.then(function() {
				$state.go('addresses', {}, {reload: true});
                toastr.success('Address Created', 'Success');
			})
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
	};
}

function AddressAssignController($q, $scope, $state, Underscore, toastr, OrderCloud, Assignments, AssignmentsList, UserGroupList, SelectedAddress) {
    var vm = this;
    vm.list = UserGroupList;
    vm.assignments = AssignmentsList;
    vm.Address = SelectedAddress;

    $scope.$watchCollection(function() {
        return vm.list;
    }, function() {
        setSelected();
    });

    vm.setSelected = setSelected;
    function setSelected() {
        var assigned = Assignments.GetAssigned(vm.assignments.Items, 'UserGroupID');
        angular.forEach(vm.list.Items, function(item) {
            if (assigned.indexOf(item.ID) > -1) {
                item.selected = true;
                var assignmentItem = Underscore.where(vm.assignments.Items, {UserGroupID: item.ID})[0];
                item.IsShipping = assignmentItem.IsShipping;
                item.IsBilling = assignmentItem.IsBilling;
            }
        });
    }

    function AssignmentFunc() {
        return OrderCloud.Addresses.ListAssignments(vm.Address.ID, null, vm.assignments.Meta.PageSize);
    }
    
    vm.saveAssignments = SaveAssignments;
    vm.pagingfunction = PagingFunction;

    function PagingFunction() {
        if (vm.list.Meta.Page < vm.list.Meta.TotalPages) {
            var queue = [];
            var dfd = $q.defer();
            queue.push(OrderCloud.UserGroups.List(null, vm.list.Meta.Page + 1, vm.list.Meta.PageSize));
            if (AssignmentFunc !== undefined) {
                queue.push(AssignmentFunc());
            }
            $q.all(queue).then(function(results) {
                dfd.resolve();
                vm.list.Meta = results[0].Meta;
                vm.list.Items = [].concat(vm.list.Items, results[0].Items);
                if (results[1]) {
                    vm.assignments.Meta = results[1].Meta;
                    vm.assignments.Items = [].concat(vm.assignments.Items, results[1].Items);
                }
                if (AssignmentFunc !== undefined) {
                    setSelected();
                }
            });
            return dfd.promise;
        }
        else return null;
    }

    function SaveAssignments() {
        var assigned = Underscore.pluck(vm.assignments.Items, 'UserGroupID');
        var selected = Underscore.pluck(Underscore.where(vm.list.Items, {selected: true}), 'ID');
        var toAdd = Assignments.GetToAssign(vm.list.Items, vm.assignments.Items, 'UserGroupID');
        var toUpdate = Underscore.intersection(selected, assigned);
        var toDelete = Assignments.GetToDelete(vm.list.Items, vm.assignments.Items, 'UserGroupID');
        var queue = [];
        var dfd = $q.defer();
        angular.forEach(vm.list.Items, function(Item) {
            if ((Item.IsShipping || Item.IsBilling) && toAdd.indexOf(Item.ID) > -1) {
                queue.push(OrderCloud.Addresses.SaveAssignment({
                    UserID: null,
                    UserGroupID: Item.ID,
                    AddressID: vm.Address.ID,
                    IsShipping: Item.IsShipping,
                    IsBilling: Item.IsBilling
                }));
            }
            else if (toUpdate.indexOf(Item.ID) > -1) {
                var AssignmentObject = Underscore.where(vm.assignments.Items, {UserGroupID: Item.ID})[0]; //Should be only one
                if (AssignmentObject.IsShipping !== Item.IsShipping || AssignmentObject.IsBilling !== Item.IsBilling) {
                    queue.push(OrderCloud.Addresses.SaveAssignment({
                        UserID: null,
                        UserGroupID: Item.ID,
                        AddressID: vm.Address.ID,
                        IsShipping: Item.IsShipping,
                        IsBilling: Item.IsBilling
                    }));
                }
            }
        });
        angular.forEach(toDelete, function(ItemID) {
            queue.push(OrderCloud.Addresses.DeleteAssignment(vm.Address.ID, null, ItemID));
        });
        $q.all(queue).then(function() {
            dfd.resolve();
            $state.reload($state.current);
            toastr.success('Assignment Updated', 'Success');
        });
        return dfd.promise;
    }
}