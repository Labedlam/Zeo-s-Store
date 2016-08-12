describe('Component: Buyers', function() {
    var scope,
        q,
        buyer,
        oc;
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($q, $rootScope, OrderCloud) {
        q = $q;
        scope = $rootScope.$new();
        buyer = {
            ID: "TestBuyer123456789",
            Name: "TestBuyerTest",
            Active: true
        };
        oc = OrderCloud;
    }));

    describe('State: buyers', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('buyers');
            spyOn(oc.Buyers, 'List').and.returnValue(null);
        }));
        it('should resolve BuyerList', inject(function($injector) {
            $injector.invoke(state.resolve.BuyerList);
            expect(oc.Buyers.List).toHaveBeenCalled();
        }));
    });

    describe('State: buyers.edit', function() {
        var state;
        beforeEach(inject(function($state) {
            state = $state.get('buyers.edit');
            var defer = q.defer();
            defer.resolve();
            spyOn(oc.Buyers, 'Get').and.returnValue(defer.promise);
        }));
        it('should resolve SelectedBuyer', inject(function($injector, $stateParams) {
            $injector.invoke(state.resolve.SelectedBuyer);
            expect(oc.Buyers.Get).toHaveBeenCalledWith($stateParams.buyerid);
        }));
    });

    describe('Controller: BuyerEditCtrl', function() {
        var buyerEditCtrl;
        beforeEach(inject(function($state, $controller) {
            buyerEditCtrl = $controller('BuyerEditCtrl', {
                $scope: scope,
                SelectedBuyer: buyer
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('Submit', function() {
            beforeEach(function() {
                buyerEditCtrl.buyer = buyer;
                var defer = q.defer();
                defer.resolve(buyer);
                spyOn(oc.Buyers, 'Update').and.returnValue(defer.promise);
                buyerEditCtrl.Submit();
                scope.$digest();
            });
            it ('should call the Buyers Update method', function() {
                expect(oc.Buyers.Update).toHaveBeenCalledWith(buyerEditCtrl.buyer);
            });
            it ('should enter the buyers state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('buyers', {}, {reload: true});
            }));
        });
    });

    describe('Controller: BuyerCreateCtrl', function() {
        var buyerCreateCtrl;
        beforeEach(inject(function($state, $controller) {
            buyerCreateCtrl = $controller('BuyerCreateCtrl', {
                $scope: scope
            });
            spyOn($state, 'go').and.returnValue(true);
        }));

        describe('Submit', function() {
            beforeEach(function() {
                buyerCreateCtrl.buyer = buyer;
                var defer = q.defer();
                defer.resolve(buyer);
                spyOn(oc.Buyers, 'Create').and.returnValue(defer.promise);
                buyerCreateCtrl.Submit();
                scope.$digest();
            });
            it ('should call the Buyers Create method', function() {
                expect(oc.Buyers.Create).toHaveBeenCalledWith(buyer);
            });
            it ('should enter the buyers state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('buyers', {}, {reload: true});
            }));
        });
    });
});

