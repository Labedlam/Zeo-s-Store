describe('Component: Addresses', function() {
    var scope,
        q,
        address,
        oc;
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($q, $rootScope, OrderCloud) {
        scope = $rootScope.$new();
        q = $q;
        address = {
            CompanyName: "TestComp",
            FirstName: "Test",
            LastName: "Testing",
            Street1: "123 4th Ave N",
            Street2: "#200",
            City: "Minneapolis",
            State: "MN",
            Zip: "55403",
            Country: "US",
            AddressName: "TestAddressTest",
            ID: "TestAddress123456789"
        };
        oc = OrderCloud
    }));

    describe('State: addresses', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('addresses');
            spyOn(oc.Addresses, 'List').and.returnValue(null);
        }));
        it('should resolve AddressList', inject(function($injector) {
            $injector.invoke(state.resolve.AddressList);
            expect(oc.Addresses.List).toHaveBeenCalled();
        }));
    });

    describe('State: addresses.edit', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('addresses.edit');
            var defer = q.defer();
            defer.resolve();
            spyOn(oc.Addresses, 'Get').and.returnValue(defer.promise);
        }));
        it('should resolve SelectedAddress', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.SelectedAddress);
            expect(oc.Addresses.Get).toHaveBeenCalledWith($stateParams.addressid);
        }));
    });

    describe('State: addresses.assign', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('addresses.assign');
            spyOn(oc.UserGroups, 'List').and.returnValue(null);
            spyOn(oc.Addresses, 'ListAssignments').and.returnValue(null);
            var defer = q.defer();
            defer.resolve();
            spyOn(oc.Addresses, 'Get').and.returnValue(defer.promise);
        }));
        it('should resolve UserGroupList', inject(function($injector) {
            $injector.invoke(state.resolve.UserGroupList);
            expect(oc.UserGroups.List).toHaveBeenCalled();
        }));
        it('should resolve AssignmentsList', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.AssignmentsList);
            expect(oc.Addresses.ListAssignments).toHaveBeenCalledWith($stateParams.addressid);
        }));
        it('should resolve SelectedAddress', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.SelectedAddress);
            expect(oc.Addresses.Get).toHaveBeenCalledWith($stateParams.addressid);
        }));
    });

    describe('Controller: AddressEditCtrl', function() {
        var addressEditCtrl;
        beforeEach(inject(function($state, $controller) {
            addressEditCtrl = $controller('AddressEditCtrl', {
                $scope: scope,
                SelectedAddress: address
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('Submit', function() {
            beforeEach(function() {
                addressEditCtrl.address = address;
                addressEditCtrl.addressID = "TestAddress123456789";
                var defer = q.defer();
                defer.resolve(address);
                spyOn(oc.Addresses, 'Update').and.returnValue(defer.promise);
                addressEditCtrl.Submit();
                scope.$digest();
            });
            it ('should call the Addresses Update method', function() {
                expect(oc.Addresses.Update).toHaveBeenCalledWith(addressEditCtrl.addressID, addressEditCtrl.address);
            });
            it ('should enter the addresses state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('addresses', {}, {reload: true});
            }));
        });

        describe('Delete', function() {
            beforeEach(function() {
                var defer = q.defer();
                defer.resolve(address);
                spyOn(oc.Addresses, 'Delete').and.returnValue(defer.promise);
                addressEditCtrl.Delete();
                scope.$digest();
            });
            it ('should call the Addresses Delete method', function() {
                expect(oc.Addresses.Delete).toHaveBeenCalledWith(address.ID, false);
            });
            it ('should enter the addresses state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('addresses', {}, {reload: true});
            }));
        });
    });

    describe('Controller: AddressCreateCtrl', function() {
        var addressCreateCtrl;
        beforeEach(inject(function($state, $controller) {
            addressCreateCtrl = $controller('AddressCreateCtrl', {
                $scope: scope
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('Submit', function() {
            beforeEach(function() {
                addressCreateCtrl.address = address;
                var defer = q.defer();
                defer.resolve(address);
                spyOn(oc.Addresses, 'Create').and.returnValue(defer.promise);
                addressCreateCtrl.Submit();
                scope.$digest();
            });
            it ('should call the Addresses Create method', function() {
                expect(oc.Addresses.Create).toHaveBeenCalledWith(address);
            });
            it ('should enter the addresses state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('addresses', {}, {reload: true});
            }));
        });
    });

    describe('Controller: AddressAssignCtrl', function() {
        var addressAssignCtrl;
        beforeEach(inject(function($state, $controller) {
            addressAssignCtrl = $controller('AddressAssignCtrl', {
                $scope: scope,
                AssignmentsList: [],
                UserGroupList: [],
                SelectedAddress: {}
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('saveAssignments', function() {
            describe('toAdd and toDelete', function() {
                beforeEach(function() {
                    spyOn(oc.Addresses, 'SaveAssignment').and.returnValue(null);
                    spyOn(oc.Addresses, 'DeleteAssignment').and.returnValue(null);
                    addressAssignCtrl.assignments= {
                        Meta: {},
                        Items: [
                            {
                                IsShipping: true,
                                IsBilling: true,
                                UserGroupID: 'TestUserGroup12345'
                            }
                        ]
                    };
                    addressAssignCtrl.list = {
                        Meta: {},
                        Items: [
                            {
                                selected: true,
                                IsShipping: true,
                                IsBilling: true,
                                ID: 'TestUserGroup123456789'
                            },
                            {
                                selected: false,
                                IsShipping: true,
                                IsBilling: true,
                                ID: 'TestUserGroup12345'
                            }
                        ]
                    };
                    addressAssignCtrl.Address = {
                        ID: "TestAddress123456789"
                    };
                    addressAssignCtrl.saveAssignments();
                });
                var assignment = {
                    UserID: null,
                    UserGroupID: "TestUserGroup123456789",
                    AddressID: "TestAddress123456789",
                    IsShipping: true,
                    IsBilling: true
                };
                it ('should call the Addresses SaveAssignment method', function() {
                    expect(oc.Addresses.SaveAssignment).toHaveBeenCalledWith(assignment);
                });
                it ('should call the Addresses DeleteAssignment method', function() {
                    expect(oc.Addresses.DeleteAssignment).toHaveBeenCalledWith(addressAssignCtrl.Address.ID, null, addressAssignCtrl.assignments.Items[0].UserGroupID);
                });
            });
            describe('toUpdate', function() {
                beforeEach(function() {
                    spyOn(oc.Addresses, 'SaveAssignment').and.returnValue(null);
                    addressAssignCtrl.assignments= {
                        Meta: {},
                        Items: [
                            {
                                IsShipping: true,
                                IsBilling: true,
                                UserGroupID: 'TestUserGroup12345'
                            }
                        ]
                    };
                    addressAssignCtrl.list = {
                        Meta: {},
                        Items: [
                            {
                                selected: true,
                                IsShipping: false,
                                IsBilling: true,
                                ID: 'TestUserGroup12345'
                            }
                        ]
                    };
                    addressAssignCtrl.Address = {
                        ID: "TestAddress123456789"
                    };
                    addressAssignCtrl.saveAssignments();
                });
                var assignment = {
                    UserID: null,
                    UserGroupID: "TestUserGroup12345",
                    AddressID: "TestAddress123456789",
                    IsShipping: false,
                    IsBilling: true
                };
                it ('should call the Addresses SaveAssignment method', function() {
                    expect(oc.Addresses.SaveAssignment).toHaveBeenCalledWith(assignment);
                });
            });
        });
        describe('pagingfunction', function() {
            beforeEach(function() {
                spyOn(oc.UserGroups, 'List').and.returnValue(null);
                addressAssignCtrl.list = {
                    Meta: {
                        Page: 1,
                        TotalPages: 2,
                        PageSize: 20
                    }
                };
                addressAssignCtrl.assignments = {
                    Meta: {
                        PageSize: 20
                    }
                };
                addressAssignCtrl.pagingfunction();
            });
            it ('should call the UserGroups List method', function() {
                expect(oc.UserGroups.List).toHaveBeenCalledWith(null, addressAssignCtrl.list.Meta.Page +1, addressAssignCtrl.list.Meta.PageSize);
            });
        });

        describe('setSelected', function() {
            var selectedCount = 0;
            var isShippingCount = 0;
            var isBillingCount = 0;
            beforeEach(function() {
                addressAssignCtrl.list = {
                    Meta: {},
                    Items: [
                        {
                            ID: 'TestUserGroup12345'
                        },
                        {
                            ID: 'TestUserGroup123456'
                        },
                        {
                            ID: 'TestUserGroup1234567'
                        },
                        {
                            ID: 'TestUserGroup12345678'
                        }
                    ]
                };
                addressAssignCtrl.assignments = {
                    Meta: {},
                    Items: [
                        {
                            IsShipping: true,
                            IsBilling: true,
                            UserGroupID: 'TestUserGroup12345'
                        },
                        {
                            IsShipping: true,
                            IsBilling: false,
                            UserGroupID: 'TestUserGroup123456'
                        },
                        {
                            IsShipping: false,
                            IsBilling: true,
                            UserGroupID: 'TestUserGroup1234567'
                        }
                    ]
                };
                addressAssignCtrl.setSelected();
                angular.forEach(addressAssignCtrl.list.Items, function(item) {
                    if (item.selected)
                    {
                        selectedCount++;
                    }
                    if (item.IsShipping)
                    {
                        isShippingCount++;
                    }
                    if (item.IsBilling)
                    {
                        isBillingCount++;
                    }
                });
            });
            it ('should set correct number of list items to selected/isShipping/isBilling', function() {
                expect(selectedCount).toEqual(3);
                expect(isShippingCount).toEqual(2);
                expect(isBillingCount).toEqual(2);
            });

        });
    });
});

